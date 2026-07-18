import json
import urllib.request
import urllib.parse
import sys
import concurrent.futures

sys.stdout.reconfigure(encoding='utf-8')

def translate(text, target):
    if not text.strip(): return text
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" + target + "&dt=t&q=" + urllib.parse.quote(text)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        response = urllib.request.urlopen(req, timeout=10)
        res = json.loads(response.read().decode('utf-8'))
        return "".join([x[0] for x in res[0]])
    except Exception as e:
        return text

langs = ["gu", "pa", "bn", "ta", "te", "kn", "ml", "or", "as"]
src = "frontend/src/locales/en.json"

with open(src, "r", encoding="utf-8") as f:
    en_data = json.load(f)

keys = list(en_data.keys())
values = list(en_data.values())

def process_lang(lang):
    print(f"Starting {lang}...", flush=True)
    translated_data = {}
    
    # ThreadPool for faster execution
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(translate, v, lang): k for k, v in en_data.items()}
        for future in concurrent.futures.as_completed(futures):
            k = futures[future]
            try:
                translated_data[k] = future.result()
            except:
                translated_data[k] = en_data[k]
                
    dest = f"frontend/src/locales/{lang}.json"
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(translated_data, f, ensure_ascii=False, indent=2)
    print(f"Finished {lang}", flush=True)

with concurrent.futures.ThreadPoolExecutor(max_workers=9) as executor:
    executor.map(process_lang, langs)

print("All done!")
