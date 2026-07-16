import os
import sys

# Append the new endpoints to backend/main.py
file_path = r'd:\FasalSeva\backend\main.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add DATAGOV_API_KEY
if 'DATAGOV_API_KEY' not in content:
    content = content.replace(
        'GROQ_API_KEY   = os.getenv("GROQ_API_KEY")',
        'GROQ_API_KEY   = os.getenv("GROQ_API_KEY")\nDATAGOV_API_KEY = os.getenv("DATAGOV_API_KEY")'
    )

# Add AnalyzeInput
analyze_input_str = """
class AnalyzeInput(BaseModel):
    crop: str
    state: str
    district: str
    quantity_kg: float
    current_price: float
    days_stored: int
    temp: float
    humidity: float
    farmer_lat: float = 22.7196
    farmer_lng: float = 75.8577
    language: str = "hi"
"""
if 'class AnalyzeInput' not in content:
    content = content.replace('class SpoilageInput(BaseModel):', analyze_input_str.strip() + '\n\nclass SpoilageInput(BaseModel):')

# Add the endpoints
endpoints_str = """
# 0. Current Price
@app.get("/current-price")
async def get_current_price(crop: str, state: str, district: str = ""):
    try:
        url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
        params = {
            "api-key":              DATAGOV_API_KEY,
            "format":               "json",
            "filters[commodity]":   crop,
            "filters[state.keyword]": state,
            "limit":                10
        }
        if district:
            params["filters[district]"] = district

        r       = requests.get(url, params=params, timeout=10)
        data    = r.json()
        records = data.get("records", [])

        if not records:
            # Try without district if no results
            params.pop("filters[district]", None)
            r       = requests.get(url, params=params, timeout=10)
            records = r.json().get("records", [])

        if records:
            # Get latest record
            latest = records[0]
            return {
                "found":         True,
                "current_price": float(latest.get("modal_price", 0)),
                "market":        latest.get("market", ""),
                "district":      latest.get("district", ""),
                "date":          latest.get("arrival_date", ""),
                "min_price":     float(latest.get("min_price", 0)),
                "max_price":     float(latest.get("max_price", 0)),
                "source":        "Agmarknet — Government of India"
            }

        return {
            "found":         False,
            "current_price": None,
            "message":       "No price data found for this crop/state. Please enter manually."
        }

    except Exception as e:
        return {
            "found":         False,
            "current_price": None,
            "error":         str(e)
        }

@app.post("/analyze")
async def analyze(data: AnalyzeInput):
    from datetime import datetime
    now   = datetime.now()
    month = now.month
    week  = int(now.strftime("%W"))

    # STEP 1 — Spoilage Prediction
    crop_enc  = crop_encoding.get(data.crop, 1)
    X_spoil   = [[crop_enc, data.temp, data.humidity, data.days_stored]]
    days_remaining = float(spoilage_regressor.predict(X_spoil)[0])
    days_remaining = round(max(0, days_remaining), 1)
    risk_enc       = int(spoilage_classifier.predict(X_spoil)[0])
    risk_level     = risk_decode.get(risk_enc, 'Green')

    # STEP 2 — Find best selling day within spoilage window
    spoilage_days = max(1, int(days_remaining))
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

    best_day = max(daily_results, key=lambda x: x['net_profit'])

    # STEP 3 — Also predict at day 15 for reference
    price_15 = predict_price_safe(
        data.crop, data.state,
        data.current_price,
        month, week, 15
    )

    # STEP 4 — Profit Calculator (3 options)
    sell_today_revenue = round(data.quantity_kg * (data.current_price / 100), 2)
    sell_today_profit  = round(sell_today_revenue - 200, 2)

    store_profit    = best_day['net_profit']
    industry_profit = round(data.quantity_kg * 3.5 - 100, 2)

    profits = {
        "option1": sell_today_profit,
        "option2": store_profit,
        "option3": industry_profit
    }
    best_option = max(profits, key=profits.get)

    # STEP 5 — Cold Storage nearest
    conn = sqlite3.connect(DB_PATH)
    c    = conn.cursor()
    c.execute('SELECT * FROM cold_storages WHERE verified = 1')
    rows = c.fetchall()
    cols = [d[0] for d in c.description]
    conn.close()

    storages = []
    for row in rows:
        s    = dict(zip(cols, row))
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
    nearest_storage = storages[0] if storages else None

    # STEP 6 — Groq Hindi/English Explanation
    best_label = {
        "option1": "aaj mandi mein bechna",
        "option2": f"cold storage mein {best_day['day']} din rakhke bechna",
        "option3": "food industry ko bechna"
    }.get(best_option, "aaj bechna")

    prompt = f\"\"\"
Tu FasalSeva ka AI assistant hai. Simple {'Hindi' if data.language == 'hi' else 'English'} mein samjhao.

Fasal: {data.crop}, Matra: {data.quantity_kg}kg
Temperature: {data.temp}°C, Sthiti: {risk_level} — {days_remaining} din surakshit
Aaj ka bhav: ₹{data.current_price}/quintal
Sabse achha din bechne ka: Din {best_day['day']} — ₹{best_day['predicted_price']}/quintal

Teen options:
- Aaj becho: ₹{sell_today_profit}
- Store karke becho (Din {best_day['day']}): ₹{store_profit}
- Food industry: ₹{industry_profit}

Sabse achha: {best_label}

3-4 simple sentences mein farmer ko samjhao. Numbers use karo. Warm tone rakho.
\"\"\"
    try:
        response = groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.7
        )
        explanation = response.choices[0].message.content.strip()
    except Exception:
        explanation = f"Aapki {data.crop} {days_remaining} din aur surakshit hai. Sabse accha option {best_label} hai jisme ₹{max(profits.values()):.0f} ka faida hoga."

    # FINAL RESPONSE
    return {
        "crop":          data.crop,
        "quantity_kg":   data.quantity_kg,

        "spoilage": {
            "days_remaining": days_remaining,
            "risk_level":     risk_level
        },

        "price": {
            "today":         data.current_price,
            "after_15_days": price_15,
            "trend":         "↑ Rising" if price_15 > data.current_price else "↓ Falling",
            "gain_15_days":  round(price_15 - data.current_price, 2)
        },

        "best_selling_day": {
            "day":             best_day['day'],
            "predicted_price": best_day['predicted_price'],
            "net_profit":      best_day['net_profit'],
            "storage_cost":    best_day['storage_cost']
        },

        "daily_breakdown": daily_results,

        "options": {
            "option1": {
                "action":     "Sell Today at Mandi",
                "revenue":    sell_today_revenue,
                "transport":  200,
                "net_profit": sell_today_profit
            },
            "option2": {
                "action":        f"Store {best_day['day']} days then Sell",
                "storage_days":  best_day['day'],
                "storage_cost":  best_day['storage_cost'],
                "revenue":       best_day['revenue'],
                "net_profit":    store_profit,
                "best_storage":  nearest_storage
            },
            "option3": {
                "action":     "Sell to Food Industry",
                "bulk_rate":  "₹3.5/kg",
                "revenue":    round(data.quantity_kg * 3.5, 2),
                "transport":  100,
                "net_profit": industry_profit
            }
        },

        "best_option":        best_option,
        "best_option_profit": profits[best_option],
        "explanation":        explanation,
        "nearby_storage":     storages[:3],
        "created_at":         now.isoformat()
    }
"""

if '@app.post("/analyze")' not in content:
    content = content.replace('# 1. Spoilage Prediction', endpoints_str.strip() + '\n\n# 1. Spoilage Prediction')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("backend updated")
