import os
import math
import sqlite3
import warnings
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import requests
from groq import Groq
from dotenv import load_dotenv

# Suppress harmless pickle/version-mismatch warnings from XGBoost and sklearn
warnings.filterwarnings("ignore", category=UserWarning, module="xgboost")
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

load_dotenv()

app = FastAPI(title="FasalSeva API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:3000",
        "http://localhost:5173",
        "https://fasalseva-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
BASE   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(BASE, 'models')

spoilage_regressor  = joblib.load(os.path.join(MODELS, 'spoilage_regressor.pkl'))
spoilage_classifier = joblib.load(os.path.join(MODELS, 'spoilage_classifier.pkl'))
price_model         = joblib.load(os.path.join(MODELS, 'price_model_v2.pkl'))
risk_decode = {0: 'Red', 1: 'Green', 2: 'Yellow'}
le_crop_v2          = joblib.load(os.path.join(MODELS, 'le_crop_v2.pkl'))
le_state_v2         = joblib.load(os.path.join(MODELS, 'le_state_v2.pkl'))

def predict_price_safe(crop, state, current_price, month, week, target_days):
    crop_enc  = int(le_crop_v2.transform([crop])[0]) if crop in le_crop_v2.classes_ else 0
    state_enc = int(le_state_v2.transform([state])[0]) if state in le_state_v2.classes_ else 0
    X = [[crop_enc, state_enc, current_price, month, week, target_days]]
    return round(float(price_model.predict(X)[0]), 2)

crop_encoding = {
    'Tomato':1,'Potato':2,'Onion':3,'Banana':4,
    'Mango':5,'Cauliflower':6,'Cabbage':7,'Spinach':8,
    'Grapes':9,'Guava':10,'Carrot':11,'Brinjal':12,
    'Wheat':13,'Rice':14
}

GROQ_API_KEY   = os.getenv("GROQ_API_KEY")
DATAGOV_API_KEY = os.getenv("DATAGOV_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
groq_client    = Groq(api_key=GROQ_API_KEY)

GOVT_SCHEMES = [
    {
        "name": "PM-KISAN Samman Nidhi",
        "hindi_name": "पीएम किसान सम्मान निधि",
        "benefit": "₹6,000 per year directly to bank account in 3 installments",
        "hindi_benefit": "साल में ₹6,000 सीधे बैंक खाते में — तीन किस्तों में",
        "eligibility": "Small and marginal landholding farmers",
        "apply_url": "https://pmkisan.gov.in",
        "tags": ["all_farmers", "small_farmer"]
    },
    {
        "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        "hindi_name": "प्रधानमंत्री फसल बीमा योजना",
        "benefit": "Crop insurance — pay only 2% premium, government pays rest",
        "hindi_benefit": "फसल का बीमा — सिर्फ 2% प्रीमियम, बाकी सरकार देती है",
        "eligibility": "All farmers growing notified crops",
        "apply_url": "https://pmfby.gov.in",
        "tags": ["high_spoilage_risk", "red_risk", "yellow_risk", "all_farmers"]
    },
    {
        "name": "Kisan Credit Card (KCC)",
        "hindi_name": "किसान क्रेडिट कार्ड",
        "benefit": "Up to ₹3 lakh credit at just 4% interest for farming needs",
        "hindi_benefit": "खेती के लिए ₹3 लाख तक कर्ज — सिर्फ 4% ब्याज पर",
        "eligibility": "All farmers including sharecroppers and tenant farmers",
        "apply_url": "Nearest nationalized bank or cooperative bank",
        "tags": ["all_farmers", "needs_storage_finance", "small_farmer"]
    },
    {
        "name": "Agricultural Infrastructure Fund (AIF)",
        "hindi_name": "कृषि अवसंरचना कोष",
        "benefit": "Subsidized loan for cold storage, warehouse at 3% interest subsidy",
        "hindi_benefit": "कोल्ड स्टोरेज और गोदाम बनाने के लिए 3% ब्याज सब्सिडी पर कर्ज",
        "eligibility": "Farmers, FPOs, cooperatives, agri-entrepreneurs",
        "apply_url": "https://agriinfra.dac.gov.in",
        "tags": ["needs_cold_storage", "large_quantity", "needs_storage_finance"]
    },
    {
        "name": "e-NAM (National Agriculture Market)",
        "hindi_name": "ई-नाम राष्ट्रीय कृषि बाजार",
        "benefit": "Sell crop online to buyers across India — better price, no middlemen",
        "hindi_benefit": "पूरे भारत में ऑनलाइन फसल बेचें — बेहतर दाम, बिचौलिए नहीं",
        "eligibility": "All farmers in e-NAM registered mandis",
        "apply_url": "https://enam.gov.in",
        "tags": ["all_farmers", "low_mandi_price", "option1_best"]
    },
    {
        "name": "PM Kisan Sampada Yojana",
        "hindi_name": "पीएम किसान संपदा योजना",
        "benefit": "Government subsidy for cold chain and food processing infrastructure",
        "hindi_benefit": "कोल्ड चेन और फूड प्रोसेसिंग के लिए सरकारी सब्सिडी",
        "eligibility": "Farmers and agri-entrepreneurs",
        "apply_url": "https://mofpi.gov.in",
        "tags": ["needs_cold_storage", "food_processing", "option3_best"]
    },
    {
        "name": "Soil Health Card Scheme",
        "hindi_name": "मृदा स्वास्थ्य कार्ड योजना",
        "benefit": "Free soil test every 2 years with fertilizer recommendations",
        "hindi_benefit": "हर 2 साल में मुफ्त मिट्टी जांच और खाद की सलाह",
        "eligibility": "All farmers",
        "apply_url": "https://soilhealth.dac.gov.in",
        "tags": ["all_farmers"]
    },
    {
        "name": "PM-KMY (Kisan Maan-Dhan Yojana)",
        "hindi_name": "पीएम किसान मानधन योजना",
        "benefit": "₹3,000/month pension after age 60 for small farmers",
        "hindi_benefit": "60 साल की उम्र के बाद ₹3,000 प्रति माह पेंशन",
        "eligibility": "Small/marginal farmers aged 18-40 years",
        "apply_url": "https://pmkmy.gov.in",
        "tags": ["small_farmer", "all_farmers"]
    }
]

def suggest_schemes(risk_level: str, days_remaining: float,
                    quantity_kg: float, best_option: str,
                    current_price: float, predicted_price: float) -> list:
    tags = ["all_farmers", "small_farmer"]

    if risk_level == "Red":
        tags += ["high_spoilage_risk", "red_risk"]
    elif risk_level == "Yellow":
        tags += ["high_spoilage_risk", "yellow_risk"]

    if quantity_kg > 200:
        tags.append("large_quantity")

    if best_option == "option2":
        tags += ["needs_cold_storage", "needs_storage_finance"]

    if best_option == "option3":
        tags += ["food_processing", "option3_best"]

    if best_option == "option1":
        tags.append("option1_best")

    if current_price < predicted_price * 0.8:
        tags.append("low_mandi_price")

    seen = set()
    result = []
    for scheme in GOVT_SCHEMES:
        if any(t in scheme["tags"] for t in tags):
            if scheme["name"] not in seen:
                seen.add(scheme["name"])
                result.append(scheme)

    return result[:4]

# ─── Task 2: SQLite Cold Storage DB ────────────────────────────
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cold_storage.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Drop old table if schema is outdated (missing owner_name / available_crates)
    c.execute("PRAGMA table_info(cold_storages)")
    cols = [row[1] for row in c.fetchall()]
    if 'owner_name' not in cols:
        c.execute('DROP TABLE IF EXISTS cold_storages')

    c.execute('''CREATE TABLE IF NOT EXISTS cold_storages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        owner_name TEXT,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        address TEXT,
        phone TEXT,
        price_per_crate_day REAL DEFAULT 2.0,
        capacity_crates INTEGER DEFAULT 500,
        available_crates INTEGER DEFAULT 500,
        verified INTEGER DEFAULT 0,
        registered_at TEXT DEFAULT CURRENT_TIMESTAMP
    )''')

    # Pre-verified partner storages
    storages = [
        ('Shivam Cold Store',    'Ramesh Sharma',  22.7196, 75.8577, 'Dewas Naka, Indore', '9876543210', 2.0, 500,  400, 1),
        ('Rajdhani Cold Storage','Suresh Patel',   22.9676, 76.0534, 'Dewas, MP',          '9765432109', 1.8, 300,  250, 1),
        ('Krishi Bhandar FPO',   'Mahesh Verma',   23.1765, 76.5784, 'Shajapur, MP',       '9654321098', 1.5, 800,  600, 1),
        ('Kisan Cold Store',     'Dinesh Yadav',   22.6022, 75.5022, 'Mhow, Indore',       '9543210987', 2.2, 400,  300, 1),
        ('AgroFreeze Ujjain',    'Prakash Joshi',  23.1793, 75.7849, 'Ujjain, MP',         '9432109876', 1.6, 600,  500, 1),
        ('MP Agri Storage',      'Vijay Singh',    23.2599, 77.4126, 'Bhopal, MP',         '9321098765', 2.0, 1000, 800, 1),
        ('Narmada Cold Chain',   'Anil Gupta',     22.3072, 75.0434, 'Barwani, MP',        '9210987654', 1.9, 450,  350, 1),
    ]

    c.executemany('''INSERT OR IGNORE INTO cold_storages
        (name, owner_name, lat, lng, address, phone,
         price_per_crate_day, capacity_crates, available_crates, verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''', storages)
    conn.commit()
    conn.close()

init_db()

# ─── Haversine Distance Function ──────────────────────────────
def haversine(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat/2)**2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(dlng/2)**2)
    return round(R * 2 * math.asin(math.sqrt(a)), 1)


# ─── OSM Helper: Cold Storage Search ──────────────────────────
def search_osm_cold_storage(lat: float, lng: float, radius: int = 50000):
    """Search real cold storages near location using OpenStreetMap Overpass API"""
    query = f"""
    [out:json][timeout:10];
    (
      node["amenity"="cold_storage"](around:{radius},{lat},{lng});
      node["name"~"cold storage|cold store|refrigeration|sheetgrah|sheetal",i](around:{radius},{lat},{lng});
      node["building"="cold_storage"](around:{radius},{lat},{lng});
      way["name"~"cold storage|cold store|refrigeration",i](around:{radius},{lat},{lng});
      node["landuse"="cold_storage"](around:{radius},{lat},{lng});
    );
    out center body;
    """
    try:
        r = requests.post(
            "https://overpass-api.de/api/interpreter",
            data={"data": query},
            timeout=12
        )
        elements = r.json().get("elements", [])
        results = []
        for el in elements:
            tags = el.get("tags", {})
            elat = el.get("lat") or el.get("center", {}).get("lat", lat)
            elng = el.get("lon") or el.get("center", {}).get("lon", lng)
            dist = haversine(lat, lng, elat, elng)
            name = tags.get("name", "Cold Storage")
            results.append({
                "name":                name,
                "address":             tags.get("addr:full", tags.get("addr:city", tags.get("addr:street", "Address on map"))),
                "phone":               tags.get("phone", tags.get("contact:phone", "Call to confirm")),
                "price_per_crate_day": None,
                "available_crates":    None,
                "distance_km":         round(dist, 1),
                "transport_cost":      round(dist * 15, 0),
                "verified":            False,
                "badge":               "\U0001f50d Nearby (OpenStreetMap)",
                "maps_link":           f"https://www.openstreetmap.org/?mlat={elat}&mlon={elng}&zoom=16"
            })
        return sorted(results, key=lambda x: x["distance_km"])[:4]
    except Exception as e:
        print(f"OSM cold storage error: {e}")
        return []


# ─── OSM Helper: Mandi Search ─────────────────────────────────
def search_osm_mandi(lat: float, lng: float):
    query = f"""
    [out:json][timeout:10];
    (
      node["amenity"="marketplace"](around:50000,{lat},{lng});
      node["name"~"mandi|krishi|apmc|sabzi|market",i](around:50000,{lat},{lng});
      way["amenity"="marketplace"](around:50000,{lat},{lng});
    );
    out center body;
    """
    try:
        r = requests.post(
            "https://overpass-api.de/api/interpreter",
            data={"data": query},
            timeout=12
        )
        elements = r.json().get("elements", [])
        results = []
        for el in elements[:8]:
            tags = el.get("tags", {})
            elat = el.get("lat") or el.get("center", {}).get("lat", lat)
            elng = el.get("lon") or el.get("center", {}).get("lon", lng)
            dist = haversine(lat, lng, elat, elng)
            results.append({
                "name":        tags.get("name", "Agricultural Market"),
                "address":     tags.get("addr:full", tags.get("addr:city", "See on map")),
                "distance_km": round(dist, 1),
                "maps_link":   f"https://www.openstreetmap.org/?mlat={elat}&mlon={elng}&zoom=15"
            })
        return sorted(results, key=lambda x: x["distance_km"])[:4]
    except Exception as e:
        print(f"OSM mandi error: {e}")
        return []


# Static fallback mandis MP (sorted on request)
MP_MANDIS = [
    {"name": "Indore Krishi Upaj Mandi", "lat": 22.7196, "lng": 75.8577, "address": "Choithram Mandi, Indore"},
    {"name": "Dewas APMC Mandi",          "lat": 22.9676, "lng": 76.0534, "address": "Dewas, MP"},
    {"name": "Ujjain Mandi Samiti",       "lat": 23.1793, "lng": 75.7849, "address": "Ujjain, MP"},
    {"name": "Shajapur Krishi Mandi",     "lat": 23.4273, "lng": 76.2716, "address": "Shajapur, MP"},
    {"name": "Bhopal Karond Mandi",       "lat": 23.2599, "lng": 77.4126, "address": "Karond, Bhopal"},
    {"name": "Ratlam Mandi Samiti",       "lat": 23.3315, "lng": 75.0367, "address": "Ratlam, MP"},
    {"name": "Mandsaur Krishi Mandi",     "lat": 24.0700, "lng": 75.0700, "address": "Mandsaur, MP"},
]

# ─── Weather Standardization ────────────────────────────────────
STORAGE_TEMP_OFFSET     = 5   # outdoor + 5°C = storage temp
STORAGE_HUMIDITY_OFFSET = 8   # outdoor + 8% = storage humidity

@app.get("/weather-storage")
async def get_weather_storage(lat: float = Query(...), lng: float = Query(...)):
    """
    Fetches real outdoor weather via Open-Meteo (free, no API key)
    then applies storage standardization offsets
    """
    try:
        # Open-Meteo — completely free, no key needed
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude":        lat,
            "longitude":       lng,
            "current":         "temperature_2m,relative_humidity_2m",
            "forecast_days":   1
        }
        r    = requests.get(url, params=params, timeout=8)
        data = r.json()

        outdoor_temp     = data["current"]["temperature_2m"]
        outdoor_humidity = data["current"]["relative_humidity_2m"]

        # Apply storage standardization
        storage_temp     = round(outdoor_temp + STORAGE_TEMP_OFFSET, 1)
        storage_humidity = min(100, round(outdoor_humidity + STORAGE_HUMIDITY_OFFSET, 1))

        return {
            "outdoor": {
                "temp":     outdoor_temp,
                "humidity": outdoor_humidity
            },
            "storage": {
                "temp":     storage_temp,
                "humidity": storage_humidity,
                "note":     f"Storage estimate: outdoor +{STORAGE_TEMP_OFFSET}°C, +{STORAGE_HUMIDITY_OFFSET}% humidity"
            },
            "source": "Open-Meteo (free real-time weather)"
        }

    except Exception as e:
        return {
            "outdoor": {"temp": 28.0, "humidity": 70.0},
            "storage": {"temp": 33.0, "humidity": 78.0},
            "error":   str(e),
            "source":  "Fallback values (weather API failed)"
        }

# ─── Schemas ───────────────────────────────────────────────────
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

class SpoilageInput(BaseModel):
    crop: str
    temp: float
    humidity: float
    days_stored: int

class PriceInput(BaseModel):
    crop: str
    state: str
    current_price: float
    month: int
    week: int
    target_days: int = 15

class ColdStorageRegister(BaseModel):
    name: str
    owner_name: str
    address: str
    lat: float
    lng: float
    phone: str
    price_per_crate_day: float
    capacity_crates: int
    available_crates: int

class RecommendInput(BaseModel):
    crop: str
    quantity_kg: float
    current_price: float
    predicted_price: float
    days_remaining: float
    risk_level: str
    farmer_lat: float = 22.7196
    farmer_lng: float = 75.8577
    transport_cost: float = 200.0

class ExplainInput(BaseModel):
    crop: str
    quantity_kg: float
    temp: float
    risk_level: str
    days_remaining: float
    current_price: float
    predicted_price: float
    option1_profit: float
    option2_profit: float
    option3_profit: float
    best_option: str
    storage_days: int
    language: str = "hi"

# ─── Endpoints ─────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "FasalSeva API Running"}

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

# 0. Current Price
class ChatInput(BaseModel):
    message: str
    language: str = "hi"
    crop: str = ""
    context: str = ""

@app.post("/chat")
async def chat_webhook(data: ChatInput):
    try:
        webhook_url = "https://saksham2026.app.n8n.cloud/webhook/d82608f3-923a-4460-a935-c44c4c6b3fed/chat"
        payload = {
            "message":  data.message,
            "language": data.language,
            "crop":     data.crop,
            "context":  data.context
        }
        r    = requests.post(webhook_url, json=payload, timeout=15)
        resp = r.json()

        # Handle all possible n8n response formats
        answer = (
            resp.get("response") or
            resp.get("output") or
            resp.get("text") or
            resp.get("message") or
            resp.get("Answer") or
            resp.get("answer") or
            ""
        )

        explanation = resp.get("Explanation") or resp.get("explanation") or ""
        notes       = resp.get("Important Notes") or resp.get("notes") or ""

        # Combine into one clean Hindi response
        if explanation and notes:
            full = f"{answer}\n\n{explanation}\n\n📌 {notes}"
        elif explanation:
            full = f"{answer}\n\n{explanation}"
        else:
            full = answer

        return {"response": full.strip() or "Koi jawab nahi mila."}

    except Exception as e:
        return {
            "response": "Maafi chahta hoon, abhi seva uplabdh nahi hai. Thodi der baad try karein.",
            "error":    str(e)
        }

@app.get("/current-price")
async def get_current_price(crop: str, state: str, district: str = ""):
    try:
        url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
        params = {
            "api-key":                DATAGOV_API_KEY,
            "format":                 "json",
            "filters[commodity]":     crop,
            "filters[state.keyword]": state,
            "limit":                  5
        }
        # Short timeout — fail fast
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        r       = requests.get(url, params=params, headers=headers, timeout=5)
        records = r.json().get("records", [])

        # Try without state if empty
        if not records:
            params2 = {"api-key": DATAGOV_API_KEY, "format": "json",
                       "filters[commodity]": crop, "limit": 5}
            r       = requests.get(url, params=params2, headers=headers, timeout=5)
            records = r.json().get("records", [])

        if records:
            latest = records[0]
            price  = float(latest.get("modal_price") or latest.get("Modal_x0020_Price") or 0)
            return {
                "found": price > 0, "current_price": price,
                "market": latest.get("market", ""), "date": latest.get("arrival_date", ""),
                "source": "Agmarknet"
            }
    except Exception:
        pass

    # Instant fallback prices (seasonal averages)
    FALLBACK_PRICES = {
        "Tomato": 1200, "Potato": 800, "Onion": 1500,
        "Banana": 2000, "Mango": 3000, "Cauliflower": 1000,
        "Cabbage": 600, "Spinach": 800, "Grapes": 4000,
        "Guava": 1500, "Carrot": 900, "Brinjal": 700, "Wheat": 2400, "Rice": 2800
    }
    fallback = FALLBACK_PRICES.get(crop, 1000)
    return {
        "found": True,
        "current_price": fallback,
        "source": "Seasonal average (Agmarknet unavailable)",
        "is_fallback": True
    }

class AnalyzeInput(BaseModel):
    crop: str
    state: str
    district: str = ""
    quantity_kg: float
    current_price: float
    days_stored: int
    temp: float
    humidity: float
    farmer_lat: float = 22.7196
    farmer_lng: float = 75.8577
    language: str = "hi"

@app.post("/analyze")
async def analyze(data: AnalyzeInput):
    from datetime import datetime
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

    # STEP 3 — SQLite only (NO OSM call — too slow)
    conn = sqlite3.connect('cold_storage.db')
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

# 1. Spoilage Prediction
@app.post("/predict/spoilage")
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

# 2. Price Prediction
@app.post("/predict/price")
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

class BestDayInput(BaseModel):
    crop: str
    state: str
    quantity_kg: float
    current_price: float
    days_remaining: float

@app.post("/best-selling-day")
def best_selling_day(data: BestDayInput):
    from datetime import datetime
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

# 3. Profit Recommendation — Task 5: Full calculation engine
@app.post("/recommend")
def recommend(data: RecommendInput):
    qty = data.quantity_kg
    crates = max(1, qty / 50)
    storage_days = int(min(data.days_remaining, 15))

    # Get nearest verified cold storage for calculation
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT * FROM cold_storages')
    rows = c.fetchall()
    conn.close()

    best_storage = None
    best_storage_profit = -999999
    all_storage_options = []

    for row in rows:
        dist = haversine(data.farmer_lat, data.farmer_lng, row[2], row[3])
        transport_to_storage = round(dist * 15, 0)
        price_per_crate_day  = row[4]
        storage_cost         = round(crates * storage_days * price_per_crate_day, 2)
        revenue              = round(qty * (data.predicted_price / 100), 2)
        transport_to_mandi   = 200
        net_profit           = round(revenue - storage_cost - transport_to_storage - transport_to_mandi, 2)

        storage_option = {
            "storage_name":        row[1],
            "distance_km":         dist,
            "transport_to_storage": transport_to_storage,
            "price_per_crate_day": price_per_crate_day,
            "storage_cost":        storage_cost,
            "storage_days":        storage_days,
            "revenue":             revenue,
            "net_profit":          net_profit,
            "phone":               row[6],
            "address":             row[7]
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
            "action":               f"Store at {best_storage['storage_name']} ({best_storage['distance_km']}km)",
            "storage_name":         best_storage['storage_name'],
            "storage_days":         storage_days,
            "storage_cost":         best_storage['storage_cost'],
            "transport_to_storage": best_storage['transport_to_storage'],
            "distance_km":          best_storage['distance_km'],
            "revenue":              best_storage['revenue'],
            "net_profit":           profit2,
            "phone":                best_storage['phone'],
            "address":              best_storage['address'],
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

# 4. Bilingual Explanation
@app.post("/explain")
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
        if data.language == "en":
            explanation = (f"Your {data.crop} crop is safe for {data.days_remaining} more days. "
                           f"The best option gives you a profit of Rs.{best_profit:.0f}. "
                           f"Act at the right time and earn well!")
        else:
            explanation = (f"Aapki {data.crop} ki fasal {data.days_remaining} din aur surakshit hai. "
                           f"Sabse achha vikalp chunkar aap Rs.{best_profit:.0f} kama sakte hain. "
                           f"Himmat rakhen, sahi faisla karen!")

    return {"explanation": explanation}


# 4b. Voice-ready text endpoint
@app.post("/voice-explain")
def voice_explain(data: ExplainInput):
    result = explain(data)
    text = result["explanation"]
    text = text.replace("Rs.", "rupaye ").replace("%", " pratishat")
    return {"text": text, "language": data.language}

# 5. Hybrid Cold Storage — Verified SQLite Partners + OSM
@app.get("/storage")
def get_storage(lat: float = Query(...), lng: float = Query(...)):
    # SOURCE 1: Our verified SQLite partners
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT * FROM cold_storages WHERE verified = 1')
    rows = c.fetchall()
    cols = [d[0] for d in c.description]
    conn.close()

    verified = []
    for row in rows:
        s    = dict(zip(cols, row))
        dist = haversine(lat, lng, s['lat'], s['lng'])
        verified.append({
            "name":                s['name'],
            "owner_name":          s['owner_name'],
            "address":             s['address'],
            "phone":               s['phone'],
            "price_per_crate_day": s['price_per_crate_day'],
            "available_crates":    s['available_crates'],
            "distance_km":         round(dist, 1),
            "transport_cost":      round(dist * 15, 0),
            "verified":            True,
            "badge":               "\u2705 Verified Partner",
            "maps_link":           f"https://www.google.com/maps?q={s['lat']},{s['lng']}"
        })
    verified.sort(key=lambda x: x['distance_km'])

    # SOURCE 2: OpenStreetMap real nearby storages
    osm_results = search_osm_cold_storage(lat, lng)

    # Remove OSM duplicates that match verified partner names
    verified_names = {v['name'].lower() for v in verified}
    osm_filtered = [
        o for o in osm_results
        if o['name'].lower() not in verified_names
    ]

    # MERGE: Verified first (nearest 3) + OSM nearby (nearest 3)
    final = verified[:3] + osm_filtered[:3]

    return {
        "verified_count": len(verified),
        "osm_count":      len(osm_filtered),
        "results":        final
    }


# Storage registration endpoint
@app.post("/storage/register")
def register_storage(data: ColdStorageRegister):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''INSERT INTO cold_storages
        (name, owner_name, lat, lng, address, phone,
         price_per_crate_day, capacity_crates, available_crates, verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)''',
        (data.name, data.owner_name, data.lat, data.lng,
         data.address, data.phone, data.price_per_crate_day,
         data.capacity_crates, data.available_crates))
    conn.commit()
    storage_id = c.lastrowid
    conn.close()
    return {"message": "Registration successful. Verification pending.", "id": storage_id}


@app.get("/storage/all")
def get_all_storages():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT * FROM cold_storages ORDER BY verified DESC')
    rows = c.fetchall()
    cols = [d[0] for d in c.description]
    conn.close()
    return {"storages": [dict(zip(cols, row)) for row in rows]}


# 6. Nearby Mandi — OSM-first, static MP fallback
@app.get("/mandi")
def get_mandi(lat: float = Query(...), lng: float = Query(...)):
    # Try OSM first
    osm = search_osm_mandi(lat, lng)

    # Build static fallback with distance
    static = []
    for m in MP_MANDIS:
        dist = haversine(lat, lng, m['lat'], m['lng'])
        static.append({
            "name":        m['name'],
            "address":     m['address'],
            "distance_km": round(dist, 1),
            "maps_link":   f"https://www.google.com/maps?q={m['lat']},{m['lng']}"
        })
    static.sort(key=lambda x: x['distance_km'])

    # OSM results first if available, else static
    final = osm[:3] if osm else static[:3]
    return {"results": final}


# 7. Nearby Food Industry — hardcoded MP units
@app.get("/industry")
def get_industry(lat: float = Query(...), lng: float = Query(...)):
    industries = [
        {"name": "Hindustan Tomato Products", "lat": 22.6500, "lng": 75.9000, "address": "Sanwer Road, Indore",  "accepts": "Tomato, Onion",         "rate": "\u20b93.5/kg"},
        {"name": "MP Agro Juice Factory",     "lat": 23.1000, "lng": 76.1000, "address": "Dewas, MP",           "accepts": "Mango, Banana, Guava",  "rate": "\u20b94/kg"},
        {"name": "Ruchi Soya Industries",     "lat": 22.7500, "lng": 75.8000, "address": "Pithampur, Indore",   "accepts": "All vegetables",        "rate": "\u20b93/kg"},
        {"name": "Priya Foods Dehydration",   "lat": 23.2000, "lng": 75.9000, "address": "Ujjain Road, MP",     "accepts": "Onion, Garlic, Carrot", "rate": "\u20b93.8/kg"},
        {"name": "Mother Dairy Processing",   "lat": 22.8000, "lng": 75.9500, "address": "AB Road, Indore",     "accepts": "Potato, Tomato",        "rate": "\u20b93.2/kg"},
    ]
    results = []
    for i in industries:
        dist = haversine(lat, lng, i['lat'], i['lng'])
        results.append({
            "name":        i['name'],
            "address":     i['address'],
            "accepts":     i['accepts'],
            "bulk_rate":   i['rate'],
            "distance_km": dist,
            "maps_link":   f"https://www.google.com/maps?q={i['lat']},{i['lng']}"
        })
    results.sort(key=lambda x: x['distance_km'])
    return {"results": results[:3]}