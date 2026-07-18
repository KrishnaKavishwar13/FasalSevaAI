import shutil
import os

langs = ["gu", "pa", "bn", "ta", "te", "kn", "ml", "or", "as"]
src = "frontend/src/locales/en.json"

for lang in langs:
    dest = f"frontend/src/locales/{lang}.json"
    if not os.path.exists(dest):
        shutil.copy(src, dest)
        print(f"Created {dest}")
