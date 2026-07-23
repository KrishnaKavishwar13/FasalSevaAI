import math
import requests
import logging
from constants import GOVT_SCHEMES

def haversine(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat/2)**2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(dlng/2)**2)
    return round(R * 2 * math.asin(math.sqrt(a)), 1)


def search_osm_cold_storage(lat: float, lng: float, radius: int = 50000):
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
        logging.error(f"OSM cold storage error: {e}")
        return []

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
        logging.error(f"OSM mandi error: {e}")
        return []

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
