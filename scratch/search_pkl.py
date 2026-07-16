import os

def search():
    print("Starting search...")
    for root, dirs, files in os.walk("D:\\"):
        # Skip system or large folders to be fast
        if any(p in root.lower() for p in ["$recycle.bin", "program files", "windows", "node_modules", "venv", ".git"]):
            continue
        for f in files:
            if "v2.pkl" in f or "price_model" in f or "le_crop" in f:
                print(os.path.join(root, f))
    print("Search completed.")

if __name__ == "__main__":
    search()
