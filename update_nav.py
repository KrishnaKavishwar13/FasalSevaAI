import json
import os

updates = {
    'en': {
        "nav.dashboard": "Dashboard",
        "nav.new_analysis": "New Analysis",
        "nav.history": "History",
        "nav.market": "Market",
        "nav.cold_storage": "Cold Storage",
        "nav.weather": "Weather",
        "nav.schemes": "Gov Schemes",
        "nav.profile": "Profile",
        "nav.settings": "Settings",
        "nav.logout": "Log out"
    },
    'hi': {
        "nav.dashboard": "डैशबोर्ड",
        "nav.new_analysis": "नया विश्लेषण",
        "nav.history": "इतिहास",
        "nav.market": "बाज़ार",
        "nav.cold_storage": "कोल्ड स्टोरेज",
        "nav.weather": "मौसम",
        "nav.schemes": "सरकारी योजनाएँ",
        "nav.profile": "प्रोफ़ाइल",
        "nav.settings": "सेटिंग्स",
        "nav.logout": "लॉग आउट"
    },
    'mr': {
        "nav.dashboard": "डॅशबोर्ड",
        "nav.new_analysis": "नवीन विश्लेषण",
        "nav.history": "इतिहास",
        "nav.market": "बाजार",
        "nav.cold_storage": "कोल्ड स्टोरेज",
        "nav.weather": "हवामान",
        "nav.schemes": "शासकीय योजना",
        "nav.profile": "प्रोफाइल",
        "nav.settings": "सेटिंग्ज",
        "nav.logout": "लॉग आउट"
    }
}

for lang, data in updates.items():
    filepath = f"frontend/src/locales/{lang}.json"
    with open(filepath, 'r', encoding='utf-8') as f:
        content = json.load(f)
    
    # Update content
    for k, v in data.items():
        content[k] = v
        
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(content, f, ensure_ascii=False, indent=2)

print("Updates complete.")
