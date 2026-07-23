from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth.routes import auth_router
from routers.analysis import router as analysis_router
from routers.chat import router as chat_router
from routers.data import router as data_router
from routers.locations import router as locations_router
from database import init_db
from auth.repository import init_auth_db

app = FastAPI(title="FasalSeva API")

# Initialize databases
init_db()
init_auth_db()

app.include_router(auth_router)
app.include_router(analysis_router)
app.include_router(chat_router)
app.include_router(data_router)
app.include_router(locations_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:3000",
        "http://localhost:5173",
        "https://fasalseva-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "FasalSeva API Running"}

@app.get("/healthz")
def healthz():
    return {"status": "ok"}