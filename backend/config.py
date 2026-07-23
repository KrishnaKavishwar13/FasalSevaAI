import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DATAGOV_API_KEY = os.getenv("DATAGOV_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
