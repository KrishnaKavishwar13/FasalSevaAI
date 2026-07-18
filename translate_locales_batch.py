import json
import time
from deep_translator import GoogleTranslator

langs = ["gu", "pa", "bn", "ta", "te", "kn", "ml", "or", "as"]
src = "frontend/src/locales/en.json"

with open(src, "r", encoding="utf-8") as f:
    en_data = json.load(f)

keys = list(en_data.keys())
values = list(en_data.values())

def translate_batch(texts, target_lang):
    translator = GoogleTranslator(source='en', target=target_lang)
    translated = []
    batch_size = 50
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        try:
            res = translator.translate_batch(batch)
            translated.extend(res)
        except Exception as e:
            # Fallback
            for text in batch:
                try:
                    translated.append(translator.translate(text))
                except:
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
