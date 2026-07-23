from fastapi import APIRouter
import requests
from schemas import ChatInput

router = APIRouter(tags=["Chat"])

@router.post("/chat")
async def chat_webhook(data: ChatInput):
    try:
        webhook_url = "https://saksham2026.app.n8n.cloud/webhook/d82608f3-923a-4460-a935-c44c4c6b3fed/chat"
        payload = {
            "message":  data.message,
            "language": data.language,
            "crop":     data.crop,
            "context":  data.context
        }
        r    = requests.post(webhook_url, json=payload, timeout=15)
        resp = r.json()

        # Handle all possible n8n response formats
        answer = (
            resp.get("response") or
            resp.get("output") or
            resp.get("text") or
            resp.get("message") or
            resp.get("Answer") or
            resp.get("answer") or
            ""
        )

        explanation = resp.get("Explanation") or resp.get("explanation") or ""
        notes       = resp.get("Important Notes") or resp.get("notes") or ""

        # Combine into one clean Hindi response
        if explanation and notes:
            full = f"{answer}\n\n{explanation}\n\n📌 {notes}"
        elif explanation:
            full = f"{answer}\n\n{explanation}"
        else:
            full = answer

        return {"response": full.strip() or "Koi jawab nahi mila."}

    except Exception as e:
        return {
            "response": "Maafi chahta hoon, abhi seva uplabdh nahi hai. Thodi der baad try karein.",
            "error":    str(e)
        }
