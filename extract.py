import os, re, json

keys = {}

for root, _, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                matches = re.findall(r't\("([^"]+)",\s*"([^"]+)"', content)
                for k, v in matches:
                    keys[k] = v

# Read existing keys to keep them
if os.path.exists('frontend/src/locales/en.json'):
    with open('frontend/src/locales/en.json', 'r', encoding='utf-8') as f:
        existing = json.load(f)
        for k, v in existing.items():
            if k not in keys:
                keys[k] = v

with open('frontend/src/locales/en.json', 'w', encoding='utf-8') as f:
    json.dump(keys, f, indent=2, ensure_ascii=False)

print(f'Extracted {len(keys)} keys')
