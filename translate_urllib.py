import json
import urllib.request
import urllib.parse
import time
import sys

# Force utf-8 encoding for stdout
sys.stdout.reconfigure(encoding='utf-8')

def translate(text, target):
    if not text.strip(): return text
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" + target + "&dt=t&q=" + urllib.parse.quote(text)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        response = urllib.request.urlopen(req, timeout=5)
        res = json.loads(response.read().decode('utf-8'))
        return "".join([x[0] for x in res[0]])
    except Exception as e:
        print("err", end="", flush=True)
        return text

langs = ["gu", "pa", "bn", "ta", "te", "kn", "ml", "or", "as"]
src = "frontend/src/locales/en.json"

with open(src, "r", encoding="utf-8") as f:
    en_data = json.load(f)

keys = list(en_data.keys())
values = list(en_data.values())

for lang in langs:
    dest = f"frontend/src/locales/{lang}.json"
    print(f"\nTranslating for {lang}...", flush=True)
    
    translated_data = {}
    for k, v in en_data.items():
        translated_data[k] = translate(v, lang)
        
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(translated_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nFinished {lang}", flush=True)
