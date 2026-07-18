import json
import time
from deep_translator import GoogleTranslator
import sys

# Force utf-8 encoding for stdout
sys.stdout.reconfigure(encoding='utf-8')

langs = ["gu", "pa", "bn", "ta", "te", "kn", "ml", "or", "as"]
src = "frontend/src/locales/en.json"

with open(src, "r", encoding="utf-8") as f:
    en_data = json.load(f)

keys = list(en_data.keys())
values = list(en_data.values())

def translate_batch(texts, target_lang):
    translator = GoogleTranslator(source='en', target=target_lang)
    translated = []
    # Translate individually to avoid batch issues
    for i, text in enumerate(texts):
        try:
            res = translator.translate(text)
            translated.append(res)
        except Exception as e:
            translated.append(text)
    return translated

for lang in langs:
    dest = f"frontend/src/locales/{lang}.json"
    print(f"Translating for {lang}...")
    start_time = time.time()
    
    translated_values = translate_batch(values, lang)
    
    translated_data = {}
    for i in range(len(keys)):
        val = translated_values[i] if i < len(translated_values) and translated_values[i] else values[i]
        translated_data[keys[i]] = val
        
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(translated_data, f, ensure_ascii=False, indent=2)
    
    print(f"Finished {lang} in {time.time() - start_time:.2f}s")
