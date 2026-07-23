// Data shapes match the real FastAPI + trained ML models (see README/build prompt).
// crop is a string label on the wire (backend label-encodes internally).

export type CropName =
  | "Tomato"
  | "Potato"
  | "Onion"
  | "Banana"
  | "Mango"
  | "Cauliflower"
  | "Cabbage"
  | "Spinach"
  | "Grapes"
  | "Guava"
  | "Carrot"
  | "Brinjal"
  | "Wheat"
  | "Rice";

export type RiskLevel = "Green" | "Yellow" | "Red";
export type MarketTrend = "Increasing" | "Stable" | "Decreasing";

// ---- Model 1: Spoilage / shelf-life ----
export interface SpoilageInput {
  crop: CropName;
  temperature: number; // °C, 0–45
  humidity: number; // %, 40–100
  days_stored: number; // 0–30
}
export interface SpoilageOutput {
  days_remaining: number;
  risk_level: RiskLevel;
  storage_viable?: boolean;
}

export interface ShelfLifeInput {
  crop: CropName;
  temperature: number;
  humidity: number;
  days_stored: number;
}
export interface ShelfLifeOutput {
  days_remaining: number;
  confidence: number;
  risk_level: RiskLevel;
  recommendation: string;
}

// ---- Model 2: XGBoost mandi price forecast ----
export interface PriceInput {
  crop: CropName;
  state: string;
  current_price: number; // ₹/quintal
  month: number; // 1–12
  week: number; // 1–52
  target_days?: number;
}
export interface PriceOutput {
  price_after_15_days: number; // ₹/quintal
}

export interface PricePredictionInput {
  crop: CropName;
  state: string;
  current_price: number;
  month: number;
  week: number;
}
export interface PricePredictionOutput {
  current_price: number;
  price_after_15_days: number;
  difference: number;
  trend: MarketTrend;
  confidence: number;
  daily_prices?: { day: number; price: number }[];
}

// ---- Composite: full analysis (what the /analyze endpoint returns) ----
export interface AnalysisInput {
  crop: CropName;
  quantity_kg: number;
  harvest_date: string; // ISO
  state: string;
  district: string;
  current_price: number; // ₹/quintal
  temperature: number;
  humidity: number;
}

export interface AnalysisResult {
  id: string;
  crop: CropName;
  quantity_kg: number;
  created_at: string;
  spoilage: SpoilageOutput;
  price: {
    today: number; // ₹/quintal
    after_15_days: number; // ₹/quintal
    trend: MarketTrend;
  };
  recommendation: {
    action: "Sell Now" | "Store Crop" | "Sell to Processing";
    duration_days: number; // 0 if sell-now
    expected_profit: number; // ₹
    confidence: number; // 0–100
    reason: string;
  };
  profit_options: {
    sell_now: ProfitBreakdown;
    store: ProfitBreakdown;
    process: ProfitBreakdown;
  };
  govt_schemes?: any[];
  bestDay?: {
    spoilage_days: number;
    best_selling_day: number;
    best_price: number;
    best_profit: number;
    sell_today_profit: number;
    industry_profit: number;
    overall_best: string;
    daily_breakdown: Array<{
      day: number;
      predicted_price: number;
      storage_cost: number;
      revenue: number;
      net_profit: number;
    }>;
  };
}
export interface ProfitBreakdown {
  revenue: number;
  storage_cost: number;
  transport_cost: number;
  net_profit: number;
}

// ---- Cold storage ----
export interface StorageFacility {
  id: string;
  owner_id?: string;
  name: string;
  storage_type?: string;
  owner_name?: string;
  phone?: string;
  email?: string;
  address: string;
  state?: string;
  district?: string;
  pincode?: string;
  lat: number;
  lng: number;
  distance_km: number;
  capacity_tons: number;
  available_tons: number;
  occupied_tons?: number;
  cost_per_kg_day: number;
  cost_per_crate_day?: number;
  compatible_crops: CropName[];
  rating: number;
  image: string;
  amenities: string[];
  verification_status?: string;
  status?: "Active" | "Paused";
  temperature_range?: string;
  humidity_range?: string;
  facilities?: string[];
  total_capacity_kg?: number;
  occupied_capacity_kg?: number;
  available_capacity_kg?: number;
  max_daily_intake_kg?: number;
  max_capacity_per_booking_kg?: number;
  storage_chambers?: number;
  min_booking_days?: number;
  max_booking_days?: number;
  loading_charges?: number;
  unloading_charges?: number;
  packaging_charges?: number;
  security_deposit?: number;
  gst_included?: boolean;
  min_temperature?: number;
  max_temperature?: number;
  cooling_technology?: string;
  working_hours?: string;
  power_backup?: string;
  generator?: boolean;
  solar_backup?: boolean;
  insurance_available?: boolean;
  security_24x7?: boolean;
  cctv?: boolean;
  digital_weighing_machine?: boolean;
  forklift?: boolean;
  loading_dock?: boolean;
  parking?: boolean;
  images?: {
    front?: string;
    inside?: string;
    chambers?: string;
    office?: string;
    license?: string;
    registration?: string;
  };
}
export interface BookingInput {
  facility_id: string;
  crop: CropName;
  quantity_kg: number;
  duration_days: number;
}
export interface Booking extends BookingInput {
  id: string;
  status: "Pending" | "Confirmed" | "Rejected";
  created_at: string;
  facility_name: string;
  estimated_cost: number;
}

// ---- Weather ----
export interface WeatherReading {
  location: string;
  temperature: number;
  humidity: number;
  rain_next_48h_mm: number;
  heatwave_risk: "Low" | "Moderate" | "High";
  spoilage_alert: RiskLevel;
  forecast_summary: string;
}

// ---- Schemes ----
export interface Scheme {
  id: string;
  name: string;
  short_name?: string;
  category: "Subsidy" | "Insurance" | "Infrastructure" | "Market";
  eligibility: string;
  description: string;
  benefits: string[];
  link: string;
  crops?: CropName[];
}
