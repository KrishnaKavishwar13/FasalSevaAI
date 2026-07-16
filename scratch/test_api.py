import requests
import os
from dotenv import load_dotenv

load_dotenv(r"D:\FasalSeva\backend\.env")

api_key = os.getenv("DATAGOV_API_KEY")
url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

# test 1: commodity and state.keyword
params = {
    "api-key": api_key,
    "format": "json",
    "filters[commodity]": "Tomato",
    "filters[state.keyword]": "Madhya Pradesh",
    "limit": 5
}
print("Test 1")
try:
    r = requests.get(url, params=params)
    print(r.json())
except Exception as e:
    print(e)

# test 2: commodity and state
params2 = {
    "api-key": api_key,
    "format": "json",
    "filters[commodity]": "Tomato",
    "filters[state]": "Madhya Pradesh",
    "limit": 5
}
print("\nTest 2")
try:
    r = requests.get(url, params=params2)
    print(r.json())
except Exception as e:
    print(e)

# test 3: commodity only
params3 = {
    "api-key": api_key,
    "format": "json",
    "filters[commodity]": "Tomato",
    "limit": 5
}
print("\nTest 3")
try:
    r = requests.get(url, params=params3)
    print(r.json())
except Exception as e:
    print(e)
