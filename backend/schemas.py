from pydantic import BaseModel

class AnalyzeInput(BaseModel):
    crop: str
    state: str
    district: str = ""
    quantity_kg: float
    current_price: float
    days_stored: int
    temp: float
    humidity: float
    farmer_lat: float = 22.7196
    farmer_lng: float = 75.8577
    language: str = "hi"

class SpoilageInput(BaseModel):
    crop: str
    temp: float
    humidity: float
    days_stored: int

class PriceInput(BaseModel):
    crop: str
    state: str
    current_price: float
    month: int
    week: int
    target_days: int = 15

class ColdStorageRegister(BaseModel):
    name: str
    owner_name: str
    address: str
    lat: float
    lng: float
    phone: str
    price_per_crate_day: float
    capacity_crates: int
    available_crates: int

class RecommendInput(BaseModel):
    crop: str
    quantity_kg: float
    current_price: float
    predicted_price: float
    days_remaining: float
    risk_level: str
    farmer_lat: float = 22.7196
    farmer_lng: float = 75.8577
    transport_cost: float = 200.0

class ExplainInput(BaseModel):
    crop: str
    quantity_kg: float
    temp: float
    risk_level: str
    days_remaining: float
    current_price: float
    predicted_price: float
    option1_profit: float
    option2_profit: float
    option3_profit: float
    best_option: str
    storage_days: int
    language: str = "hi"

class ChatInput(BaseModel):
    message: str
    language: str = "hi"
    crop: str = ""
    context: str = ""

class BestDayInput(BaseModel):
    crop: str
    state: str
    quantity_kg: float
    current_price: float
    days_remaining: float
