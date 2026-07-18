import json
import time
from deep_translator import GoogleTranslator

langs = ["gu", "pa", "bn", "ta", "te", "kn", "ml", "or", "as"]
src = "frontend/src/locales/en.json"

with open(src, "r", encoding="utf-8") as f:
    en_data = json.load(f)

keys = list(en_data.keys())
values = list(en_data.values())

# Batch translation function to respect limits and avoid API errors
def translate_batch(texts, target_lang):
    translator = GoogleTranslator(source='en', target=target_lang)
    translated = []
    # batch size of 50 to avoid payload too large
    batch_size = 50
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        try:
            res = translator.translate_batch(batch)
            translated.extend(res)
        except Exception as e:
            print(f"Error translating batch for {target_lang}: {e}")
            # fallback to individual translation
            for text in batch:
                try:
                    res = translator.translate(text)
                    translated.append(res)
                except:
                    translated.append(text)
        time.sleep(1) # sleep to avoid rate limits
    return translated

for lang in langs:
    dest = f"frontend/src/locales/{lang}.json"
    print(f"Translating for {lang}...")
    
    # We map 'or' to 'or' - Google translate uses 'or' for Odia, 'as' for Assamese. 
    # Just to be safe, deep-translator handles it.
    
    translated_values = translate_batch(values, lang)
    
    # Reconstruct dictionary
    translated_data = {}
    for i in range(len(keys)):
        # fallback to english if translation failed or returned None
        val = translated_values[i] if i < len(translated_values) and translated_values[i] else values[i]
        translated_data[keys[i]] = val
        
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(translated_data, f, ensure_ascii=False, indent=2)
    
    print(f"Finished {lang}")
