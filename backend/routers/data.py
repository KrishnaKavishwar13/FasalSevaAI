import requests
from fastapi import APIRouter, Query
from constants import STORAGE_TEMP_OFFSET, STORAGE_HUMIDITY_OFFSET
from config import DATAGOV_API_KEY

router = APIRouter(tags=["Data"])

@router.get("/weather-storage")
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

@router.get("/current-price")
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
