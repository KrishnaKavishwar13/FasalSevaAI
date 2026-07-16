import requests

url = "https://saksham2026.app.n8n.cloud/webhook/d82608f3-923a-4460-a935-c44c4c6b3fed/chat"
res = requests.post(url, json={"chatInput": "hello"})
print(res.status_code)
print(res.text)
