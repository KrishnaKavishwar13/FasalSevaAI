from datetime import datetime
from database import get_db_connection
from fastapi import APIRouter
from schemas import AnalyzeInput, SpoilageInput, PriceInput, BestDayInput, RecommendInput, ExplainInput
from constants import crop_encoding, risk_decode
from ml import spoilage_regressor, spoilage_classifier, predict_price_safe
from utils import haversine, suggest_schemes
from config import groq_client

router = APIRouter(tags=["Analysis"])

@router.post("/analyze")
async def analyze(data: AnalyzeInput):
    now   = datetime.now()
    month = now.month
    week  = int(now.strftime("%W"))

    # STEP 1 — Spoilage (fast, local model)
    crop_enc       = crop_encoding.get(data.crop, 1)
    X_spoil        = [[crop_enc, data.temp, data.humidity, data.days_stored]]
    days_remaining = float(spoilage_regressor.predict(X_spoil)[0])
    days_remaining = round(max(0.5, days_remaining), 1)
    risk_enc       = int(spoilage_classifier.predict(X_spoil)[0])
    risk_level     = risk_decode.get(risk_enc, 'Green')
    storage_viable = days_remaining > 2

    # STEP 2 — Price for each day (fast, local model)
    spoilage_days = max(1, int(days_remaining))
    daily_results = []
    for day in range(1, spoilage_days + 1):
        pred_price   = predict_price_safe(data.crop, data.state, data.current_price, month, week, day)
        crates       = max(1, data.quantity_kg / 50)
        storage_cost = round(crates * day * 2, 2)
        revenue      = round(data.quantity_kg * (pred_price / 100), 2)
        net_profit   = round(revenue - storage_cost - 200, 2)
        daily_results.append({"day": day, "predicted_price": pred_price,
                               "storage_cost": storage_cost, "revenue": revenue,
                               "net_profit": net_profit})

    best_day = max(daily_results, key=lambda x: x['net_profit'])
    price_15 = predict_price_safe(data.crop, data.state, data.current_price, month, week, 15)

    # STEP 3 — DB lookup (NO OSM call — too slow)
    conn = get_db_connection()
    c    = conn.cursor()
    c.execute('SELECT * FROM cold_storages WHERE verified = 1')
    rows = c.fetchall()
    conn.close()

    storages = []
    for row in rows:
        s    = dict(row)
        dist = haversine(data.farmer_lat, data.farmer_lng, s['lat'], s['lng'])
        storages.append({
            "name":                s['name'],
            "address":             s['address'],
            "phone":               s['phone'],
            "price_per_crate_day": s['price_per_crate_day'],
            "available_crates":    s['available_crates'],
            "distance_km":         round(dist, 1),
            "transport_cost":      round(dist * 15, 0),
            "verified":            True,
            "badge":               "✅ Verified Partner",
            "maps_link":           f"https://www.google.com/maps?q={s['lat']},{s['lng']}"
        })
    storages.sort(key=lambda x: x['distance_km'])
    nearest = storages[0] if storages else None

    # STEP 4 — Profit Calculator
    crates = max(1, data.quantity_kg / 50)
    rev1    = round(data.quantity_kg * (data.current_price / 100), 2)
    profit1 = round(rev1 - 200, 2)

    if storage_viable and nearest:
        transport_to_storage = nearest['transport_cost']
        storage_cost_real    = round(crates * best_day['day'] * nearest['price_per_crate_day'], 2)
        rev2    = round(data.quantity_kg * (best_day['predicted_price'] / 100), 2)
        profit2 = round(rev2 - storage_cost_real - transport_to_storage - 200, 2)
    else:
        profit2 = -99999
        storage_cost_real = transport_to_storage = rev2 = 0

    rev3    = round(data.quantity_kg * 3.5, 2)
    profit3 = round(rev3 - 100, 2)

    profits     = {"option1": profit1, "option2": profit2, "option3": profit3}
    best_option = max(profits, key=profits.get)

    # STEP 5 — Schemes (instant, no API)
    schemes = suggest_schemes(risk_level, days_remaining,
                              data.quantity_kg, best_option,
                              data.current_price, best_day['predicted_price'])

    # STEP 6 — Groq explanation (with 10s timeout)
    best_labels = {
        "option1": f"aaj mandi mein ₹{profit1:.0f} mein bechna",
        "option2": f"{best_day['day']} din cold storage mein rakhke ₹{profit2:.0f} kamana",
        "option3": f"food industry ko ₹{profit3:.0f} mein bechna"
    }
    
    explanation = ""
    if groq_client:
        try:
            response = groq_client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[{"role": "user", "content": f"""
    Tu FasalSeva ka AI expert hai. Simple Hindi mein 4 sentences mein samjhao.
    Fasal: {data.crop}, {data.quantity_kg}kg, {data.temp}°C
    Sthiti: {risk_level} — {days_remaining} din safe
    Aaj bhav: ₹{data.current_price}/q, Best din: Day {best_day['day']} @ ₹{best_day['predicted_price']}/q
    Options: Aaj=₹{profit1:.0f}, Store=₹{profit2:.0f}, Industry=₹{profit3:.0f}
    Best: {best_labels[best_option]}
    {'Nearest: ' + nearest['name'] + ' ' + str(nearest['distance_km']) + 'km' if nearest else ''}
    Exact rupaye batao. Warm Hindi. 4 sentences max."""}],
                max_tokens=250,
                timeout=10
            )
            explanation = response.choices[0].message.content.strip()
        except Exception:
            pass
            
    if not explanation:
        explanation = f"Aapki {data.crop} {days_remaining} din safe hai. {best_labels[best_option]} sabse accha hai."

    return {
        "crop": data.crop, "quantity_kg": data.quantity_kg,
        "spoilage": {"days_remaining": days_remaining, "risk_level": risk_level, "storage_viable": storage_viable},
        "price": {"today": data.current_price, "after_15_days": price_15,
                  "trend": "↑ Rising" if price_15 > data.current_price else "↓ Falling",
                  "gain_15_days": round(price_15 - data.current_price, 2)},
        "best_selling_day": {"day": best_day['day'], "predicted_price": best_day['predicted_price'],
                             "net_profit": best_day['net_profit'], "storage_cost": best_day['storage_cost'],
                             "revenue": best_day['revenue']},
        "daily_breakdown": daily_results,
        "options": {
            "option1": {"action": "Sell Today at Mandi", "hindi": "आज मंडी में बेचें",
                        "revenue": rev1, "transport": 200, "net_profit": profit1},
            "option2": {"action": f"Store {best_day['day']} days → Sell", "hindi": f"{best_day['day']} दिन स्टोर करके बेचें",
                        "storage_days": best_day['day'], "storage_cost": storage_cost_real,
                        "transport_to_storage": transport_to_storage, "revenue": rev2,
                        "net_profit": profit2, "viable": storage_viable, "best_storage": nearest},
            "option3": {"action": "Sell to Food Industry", "hindi": "फूड इंडस्ट्री को बेचें",
                        "bulk_rate": "₹3.5/kg", "revenue": rev3, "transport": 100, "net_profit": profit3}
        },
        "best_option": best_option,
        "best_option_profit": profits[best_option],
        "explanation": explanation,
        "govt_schemes": schemes,
        "nearby_storage": storages[:3],
        "created_at": now.isoformat()
    }

@router.post("/predict/spoilage")
def predict_spoilage(data: SpoilageInput):
    crop_enc = crop_encoding.get(data.crop, 1)
    X = [[crop_enc, data.temp, data.humidity, data.days_stored]]

    days_remaining = float(spoilage_regressor.predict(X)[0])
    days_remaining = round(max(0, days_remaining), 1)

    risk_enc   = int(spoilage_classifier.predict(X)[0])
    risk_level = risk_decode.get(risk_enc, 'Green')

    return {
        "days_remaining": days_remaining,
        "risk_level": risk_level
    }

@router.post("/predict/price")
def predict_price(data: PriceInput):
    daily_prices = []
    for day in range(1, data.target_days + 1):
        price_for_day = predict_price_safe(
            data.crop, data.state,
            data.current_price,
            data.month, data.week,
            day
        )
        daily_prices.append({
            "day": day,
            "price": price_for_day
        })

    predicted = daily_prices[-1]["price"] if daily_prices else data.current_price
    gain  = round(predicted - data.current_price, 2)
    trend = "📈 Rising" if gain > 0 else "📉 Falling"
    
    return {
        "current_price":   data.current_price,
        "predicted_price": predicted,
        "target_days":     data.target_days,
        "trend":           trend,
        "expected_gain":   gain,
        "daily_prices":    daily_prices
    }

@router.post("/best-selling-day")
def best_selling_day(data: BestDayInput):
    now   = datetime.now()
    month = now.month
    week  = int(now.strftime("%W"))

    spoilage_days = max(1, int(data.days_remaining))
    daily_results = []

    for day in range(1, spoilage_days + 1):
        predicted_price = predict_price_safe(
            data.crop, data.state,
            data.current_price,
            month, week, day
        )
        crates       = max(1, data.quantity_kg / 50)
        storage_cost = round(crates * day * 2, 2)
        revenue      = round(data.quantity_kg * (predicted_price / 100), 2)
        profit       = round(revenue - storage_cost - 200, 2)

        daily_results.append({
            "day":             day,
            "predicted_price": predicted_price,
            "storage_cost":    storage_cost,
            "revenue":         revenue,
            "net_profit":      profit
        })

    best        = max(daily_results, key=lambda x: x['net_profit'])
    sell_today  = round(data.quantity_kg * (data.current_price / 100) - 200, 2)
    industry    = round(data.quantity_kg * 3.5 - 100, 2)

    overall_best = max(
        [("store",    best['net_profit']),
         ("today",    sell_today),
         ("industry", industry)],
        key=lambda x: x[1]
    )[0]

    return {
        "spoilage_days":     spoilage_days,
        "best_selling_day":  best['day'],
        "best_price":        best['predicted_price'],
        "best_profit":       best['net_profit'],
        "sell_today_profit": sell_today,
        "industry_profit":   industry,
        "overall_best":      overall_best,
        "daily_breakdown":   daily_results
    }

@router.post("/recommend")
def recommend(data: RecommendInput):
    qty = data.quantity_kg
    crates = max(1, qty / 50)
    storage_days = int(min(data.days_remaining, 15))

    # Get nearest verified cold storage for calculation
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM cold_storages')
    rows = c.fetchall()
    conn.close()

    best_storage = None
    best_storage_profit = -999999
    all_storage_options = []

    for row in rows:
        s = dict(row)
        dist = haversine(data.farmer_lat, data.farmer_lng, s['lat'], s['lng'])
        transport_to_storage = round(dist * 15, 0)
        price_per_crate_day  = s['price_per_crate_day']
        storage_cost         = round(crates * storage_days * price_per_crate_day, 2)
        revenue              = round(qty * (data.predicted_price / 100), 2)
        transport_to_mandi   = 200
        net_profit           = round(revenue - storage_cost - transport_to_storage - transport_to_mandi, 2)

        storage_option = {
            "storage_name":        s['name'],
            "distance_km":         dist,
            "transport_to_storage": transport_to_storage,
            "price_per_crate_day": price_per_crate_day,
            "storage_cost":        storage_cost,
            "storage_days":        storage_days,
            "revenue":             revenue,
            "net_profit":          net_profit,
            "phone":               s['phone'],
            "address":             s['address']
        }
        all_storage_options.append(storage_option)

        if net_profit > best_storage_profit:
            best_storage_profit = net_profit
            best_storage = storage_option

    # Sort storage options by profit (descending)
    all_storage_options.sort(key=lambda x: x['net_profit'], reverse=True)

    # Option 1 — Sell Today
    revenue1 = round(qty * (data.current_price / 100), 2)
    profit1  = round(revenue1 - data.transport_cost, 2)

    # Option 2 — Best cold storage
    profit2 = best_storage['net_profit'] if best_storage else 0

    # Option 3 — Food Industry
    revenue3 = round(qty * 3.5, 2)
    profit3  = round(revenue3 - (data.transport_cost * 0.5), 2)

    profits = {"option1": profit1, "option2": profit2, "option3": profit3}
    best    = max(profits, key=profits.get)

    return {
        "option1": {
            "action":     "Sell Today at Mandi",
            "revenue":    revenue1,
            "transport":  data.transport_cost,
            "net_profit": profit1
        },
        "option2": {
            "action":               f"Store at {best_storage['storage_name']} ({best_storage['distance_km']}km)" if best_storage else "Store at Cold Storage",
            "storage_name":         best_storage['storage_name'] if best_storage else "None",
            "storage_days":         storage_days,
            "storage_cost":         best_storage['storage_cost'] if best_storage else 0,
            "transport_to_storage": best_storage['transport_to_storage'] if best_storage else 0,
            "distance_km":          best_storage['distance_km'] if best_storage else 0,
            "revenue":              best_storage['revenue'] if best_storage else 0,
            "net_profit":           profit2,
            "phone":                best_storage['phone'] if best_storage else "",
            "address":              best_storage['address'] if best_storage else "",
            "all_storage_options":  all_storage_options[:3]
        },
        "option3": {
            "action":     "Sell to Food Industry",
            "bulk_rate":  "₹3.5/kg",
            "revenue":    revenue3,
            "transport":  round(data.transport_cost * 0.5, 2),
            "net_profit": profit3
        },
        "best_option":        best,
        "best_option_profit": profits[best]
    }

@router.post("/explain")
def explain(data: ExplainInput):
    best_label = {
        "option1": "aaj mandi mein bechna",
        "option2": "cold storage mein rakhna",
        "option3": "food industry ko bechna"
    }.get(data.best_option, "aaj bechna")
    best_profit = max(data.option1_profit, data.option2_profit, data.option3_profit)

    if data.language == "en":
        prompt = (
            f"You are FasalSeva's AI assistant helping an Indian farmer make the best decision for their harvest.\n\n"
            f"Situation:\n"
            f"- Crop: {data.crop}, Quantity: {data.quantity_kg}kg\n"
            f"- Storage temp: {data.temp}°C, Status: {data.risk_level} — {data.days_remaining} days safe\n"
            f"- Today's price: Rs.{data.current_price}/quintal, Predicted (15 days): Rs.{data.predicted_price}/quintal\n"
            f"- Sell today profit: Rs.{data.option1_profit}\n"
            f"- Store and sell profit: Rs.{data.option2_profit} (after {data.storage_days} days)\n"
            f"- Food industry profit: Rs.{data.option3_profit}\n\n"
            f"Give 3-4 warm, simple sentences:\n"
            f"1. Current crop status\n"
            f"2. Best option and why\n"
            f"3. Exact profit in rupees\n"
            f"4. Encouraging note if crop is at risk\n\n"
            f"Keep it warm, simple, and specific with numbers."
        )
    else:
        prompt = (
            f"Tu FasalSeva ka AI assistant hai. Tu ek samajhdar gaon ka bada bhai hai jo kisan bhai/behen ko "
            f"seedhi, pyaar bhari, aur asaan Hindi mein salah deta hai.\n\n"
            f"Kisan ki situation:\n"
            f"- Fasal: {data.crop}\n"
            f"- Matra: {data.quantity_kg} kg\n"
            f"- Storage temperature: {data.temp}°C\n"
            f"- Fasal ki sthiti: {data.risk_level} — {data.days_remaining} din aur surakshit hai\n"
            f"- Aaj ka mandi bhav: Rs.{data.current_price} per quintal\n"
            f"- 15 din baad predicted bhav: Rs.{data.predicted_price} per quintal\n\n"
            f"Teen options ka net faida:\n"
            f"- Aaj mandi mein becho: Rs.{data.option1_profit}\n"
            f"- Cold storage mein rakho ({data.storage_days} din): Rs.{data.option2_profit}\n"
            f"- Food industry ko becho: Rs.{data.option3_profit}\n\n"
            f"Sabse accha option: {best_label} jisme Rs.{best_profit:.0f} ka faida hai\n\n"
            f"Ab kisan ko 3-4 simple sentences mein samjhao:\n"
            f"1. Pehle unki fasal ki sthiti batao (ghabraao mat, seedha batao)\n"
            f"2. Phir sabse accha option batao aur kyun\n"
            f"3. Exact rupaye ka faida batao\n"
            f"4. Ek chhoti si himmat wali baat kaho agar fasal kharab hone wali ho\n\n"
            f"Rules:\n"
            f"- Bilkul simple Hindi — gaon ka kisan samjhe\n"
            f"- Aap use karo, respect ke saath\n"
            f"- Numbers zaroor batao\n"
            f"- 4 sentences se zyada mat likho\n"
            f"- Warm aur helpful tone rakho"
        )
    
    explanation = ""
    if groq_client:
        try:
            response = groq_client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                temperature=0.7
            )
            explanation = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Groq error: {e}")
            
    if not explanation:
        if data.language == "en":
            explanation = (f"Your {data.crop} crop is safe for {data.days_remaining} more days. "
                           f"The best option gives you a profit of Rs.{best_profit:.0f}. "
                           f"Act at the right time and earn well!")
        else:
            explanation = (f"Aapki {data.crop} ki fasal {data.days_remaining} din aur surakshit hai. "
                           f"Sabse achha vikalp chunkar aap Rs.{best_profit:.0f} kama sakte hain. "
                           f"Himmat rakhen, sahi faisla karen!")

    return {"explanation": explanation}


@router.post("/voice-explain")
def voice_explain(data: ExplainInput):
    result = explain(data)
    text = result["explanation"]
    text = text.replace("Rs.", "rupaye ").replace("%", " pratishat")
    return {"text": text, "language": data.language}
