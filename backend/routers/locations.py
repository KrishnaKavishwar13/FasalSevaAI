from fastapi import APIRouter, Query
from schemas import ColdStorageRegister
from database import get_db_connection
from utils import haversine, search_osm_cold_storage, search_osm_mandi
from constants import MP_MANDIS

router = APIRouter(tags=["Locations"])

@router.get("/storage")
def get_storage(lat: float = Query(...), lng: float = Query(...)):
    # SOURCE 1: Our verified partners
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM cold_storages WHERE verified = 1')
    rows = c.fetchall()
    conn.close()

    verified = []
    for row in rows:
        s    = dict(row)
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

@router.post("/storage/register")
def register_storage(data: ColdStorageRegister):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''INSERT INTO cold_storages
        (name, owner_name, lat, lng, address, phone,
         price_per_crate_day, capacity_crates, available_crates, verified)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 0) RETURNING id''',
        (data.name, data.owner_name, data.lat, data.lng,
         data.address, data.phone, data.price_per_crate_day,
         data.capacity_crates, data.available_crates))
    
    storage_id = c.fetchone()[0]
    conn.commit()
    conn.close()
    return {"message": "Registration successful. Verification pending.", "id": storage_id}

@router.get("/storage/all")
def get_all_storages():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM cold_storages ORDER BY verified DESC')
    rows = c.fetchall()
    conn.close()
    return {"storages": [dict(row) for row in rows]}

@router.get("/mandi")
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

@router.get("/industry")
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
