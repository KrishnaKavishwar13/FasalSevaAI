crop_encoding = {
    'Tomato':1,'Potato':2,'Onion':3,'Banana':4,
    'Mango':5,'Cauliflower':6,'Cabbage':7,'Spinach':8,
    'Grapes':9,'Guava':10,'Carrot':11,'Brinjal':12,
    'Wheat':13,'Rice':14
}

risk_decode = {0: 'Red', 1: 'Green', 2: 'Yellow'}

STORAGE_TEMP_OFFSET = 5
STORAGE_HUMIDITY_OFFSET = 8

GOVT_SCHEMES = [
    {
        "id": "pm_kisan",
        "name": "PM-KISAN Samman Nidhi",
        "hindi_name": "पीएम किसान सम्मान निधि",
        "benefit": "₹6,000 per year directly to bank account in 3 installments",
        "hindi_benefit": "साल में ₹6,000 सीधे बैंक खाते में — तीन किस्तों में",
        "eligibility": "Small and marginal landholding farmers",
        "apply_url": "https://pmkisan.gov.in",
        "tags": ["all_farmers", "small_farmer"]
    },
    {
        "id": "pmfby",
        "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        "hindi_name": "प्रधानमंत्री फसल बीमा योजना",
        "benefit": "Crop insurance — pay only 2% premium, government pays rest",
        "hindi_benefit": "फसल का बीमा — सिर्फ 2% प्रीमियम, बाकी सरकार देती है",
        "eligibility": "All farmers growing notified crops",
        "apply_url": "https://pmfby.gov.in",
        "tags": ["high_spoilage_risk", "red_risk", "yellow_risk", "all_farmers"]
    },
    {
        "id": "kcc",
        "name": "Kisan Credit Card (KCC)",
        "hindi_name": "किसान क्रेडिट कार्ड",
        "benefit": "Up to ₹3 lakh credit at just 4% interest for farming needs",
        "hindi_benefit": "खेती के लिए ₹3 लाख तक कर्ज — सिर्फ 4% ब्याज पर",
        "eligibility": "All farmers including sharecroppers and tenant farmers",
        "apply_url": "Nearest nationalized bank or cooperative bank",
        "tags": ["all_farmers", "needs_storage_finance", "small_farmer"]
    },
    {
        "id": "aif",
        "name": "Agricultural Infrastructure Fund (AIF)",
        "hindi_name": "कृषि अवसंरचना कोष",
        "benefit": "Subsidized loan for cold storage, warehouse at 3% interest subsidy",
        "hindi_benefit": "कोल्ड स्टोरेज और गोदाम बनाने के लिए 3% ब्याज सब्सिडी पर कर्ज",
        "eligibility": "Farmers, FPOs, cooperatives, agri-entrepreneurs",
        "apply_url": "https://agriinfra.dac.gov.in",
        "tags": ["needs_cold_storage", "large_quantity", "needs_storage_finance"]
    },
    {
        "id": "enam",
        "name": "e-NAM (National Agriculture Market)",
        "hindi_name": "ई-नाम राष्ट्रीय कृषि बाजार",
        "benefit": "Sell crop online to buyers across India — better price, no middlemen",
        "hindi_benefit": "पूरे भारत में ऑनलाइन फसल बेचें — बेहतर दाम, बिचौलिए नहीं",
        "eligibility": "All farmers in e-NAM registered mandis",
        "apply_url": "https://enam.gov.in",
        "tags": ["all_farmers", "low_mandi_price", "option1_best"]
    },
    {
        "id": "pm_sampada",
        "name": "PM Kisan Sampada Yojana",
        "hindi_name": "पीएम किसान संपदा योजना",
        "benefit": "Government subsidy for cold chain and food processing infrastructure",
        "hindi_benefit": "कोल्ड चेन और फूड प्रोसेसिंग के लिए सरकारी सब्सिडी",
        "eligibility": "Farmers and agri-entrepreneurs",
        "apply_url": "https://mofpi.gov.in",
        "tags": ["needs_cold_storage", "food_processing", "option3_best"]
    },
    {
        "id": "soil_health",
        "name": "Soil Health Card Scheme",
        "hindi_name": "मृदा स्वास्थ्य कार्ड योजना",
        "benefit": "Free soil test every 2 years with fertilizer recommendations",
        "hindi_benefit": "हर 2 साल में मुफ्त मिट्टी जांच और खाद की सलाह",
        "eligibility": "All farmers",
        "apply_url": "https://soilhealth.dac.gov.in",
        "tags": ["all_farmers"]
    },
    {
        "id": "pm_kmy",
        "name": "PM-KMY (Kisan Maan-Dhan Yojana)",
        "hindi_name": "पीएम किसान मानधन योजना",
        "benefit": "₹3,000/month pension after age 60 for small farmers",
        "hindi_benefit": "60 साल की उम्र के बाद ₹3,000 प्रति माह पेंशन",
        "eligibility": "Small/marginal farmers aged 18-40 years",
        "apply_url": "https://pmkmy.gov.in",
        "tags": ["small_farmer", "all_farmers"]
    }
]

MP_MANDIS = [
    {"name": "Indore Krishi Upaj Mandi", "lat": 22.7196, "lng": 75.8577, "address": "Choithram Mandi, Indore"},
    {"name": "Dewas APMC Mandi",          "lat": 22.9676, "lng": 76.0534, "address": "Dewas, MP"},
    {"name": "Ujjain Mandi Samiti",       "lat": 23.1793, "lng": 75.7849, "address": "Ujjain, MP"},
    {"name": "Shajapur Krishi Mandi",     "lat": 23.4273, "lng": 76.2716, "address": "Shajapur, MP"},
    {"name": "Bhopal Karond Mandi",       "lat": 23.2599, "lng": 77.4126, "address": "Karond, Bhopal"},
    {"name": "Ratlam Mandi Samiti",       "lat": 23.3315, "lng": 75.0367, "address": "Ratlam, MP"},
    {"name": "Mandsaur Krishi Mandi",     "lat": 24.0700, "lng": 75.0700, "address": "Mandsaur, MP"},
]
