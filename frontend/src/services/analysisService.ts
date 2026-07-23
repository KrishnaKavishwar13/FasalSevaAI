import { apiClient } from "@/api/client";
import type { AnalysisInput, AnalysisResult, MarketTrend } from "@/types";

let HISTORY: AnalysisResult[] = [];

export const analysisService = {
  async runAnalysis(input: AnalysisInput): Promise<AnalysisResult> {
    const days_stored = Math.max(
      0,
      Math.floor((Date.now() - new Date(input.harvest_date).getTime()) / (1000 * 60 * 60 * 24)),
    );

    return this.runFull({
      crop: input.crop,
      quantity_kg: input.quantity_kg,
      state: input.state,
      district: input.district,
      current_price: input.current_price,
      days_stored: days_stored,
      temp: input.temperature,
      humidity: input.humidity,
      farmer_lat: 22.7196,
      farmer_lng: 75.8577,
    });
  },

  async runFull(input: {
    crop: string;
    quantity_kg: number;
    state: string;
    district: string;
    current_price: number;
    days_stored: number;
    temp: number;
    humidity: number;
    farmer_lat: number;
    farmer_lng: number;
  }): Promise<AnalysisResult> {
    const res = await apiClient.post("/analyze", {
      crop: input.crop,
      state: input.state,
      district: input.district || "",
      quantity_kg: input.quantity_kg,
      current_price: input.current_price,
      days_stored: input.days_stored,
      temp: input.temp,
      humidity: input.humidity,
      farmer_lat: input.farmer_lat,
      farmer_lng: input.farmer_lng,
      language: "hi",
    });

    const data = res.data;
    const trendStr = data.price.trend || "";
    let trend: MarketTrend = "Stable";
    if (trendStr.includes("Rising")) trend = "Increasing";
    else if (trendStr.includes("Falling")) trend = "Decreasing";

    let action: "Sell Now" | "Store Crop" | "Sell to Processing" = "Sell Now";
    if (data.best_option === "option2") action = "Store Crop";
    else if (data.best_option === "option3") action = "Sell to Processing";

    const mapped: AnalysisResult = {
      id: `an_${Date.now()}`,
      crop: data.crop as any,
      quantity_kg: data.quantity_kg,
      created_at: data.created_at,
      spoilage: {
        days_remaining: data.spoilage.days_remaining,
        risk_level: data.spoilage.risk_level,
        storage_viable: data.spoilage.storage_viable,
      },
      price: {
        today: data.price.today,
        after_15_days: data.price.after_15_days,
        trend: trend,
      },
      recommendation: {
        action: action,
        duration_days: data.options.option2.storage_days || 0,
        expected_profit: data.best_option_profit,
        confidence: 87,
        reason: data.explanation,
      },
      profit_options: {
        sell_now: {
          revenue: data.options.option1.revenue,
          storage_cost: 0,
          transport_cost: data.options.option1.transport,
          net_profit: data.options.option1.net_profit,
        },
        store: {
          revenue: data.options.option2.revenue,
          storage_cost: data.options.option2.storage_cost,
          transport_cost: data.options.option2.best_storage
            ? data.options.option2.best_storage.transport_cost
            : 200,
          net_profit: data.options.option2.net_profit,
        },
        process: {
          revenue: data.options.option3.revenue,
          storage_cost: 0,
          transport_cost: data.options.option3.transport,
          net_profit: data.options.option3.net_profit,
        },
      },
      bestDay: {
        spoilage_days: Math.max(1, Math.round(data.spoilage.days_remaining)),
        best_selling_day: data.best_selling_day.day,
        best_price: data.best_selling_day.predicted_price,
        best_profit: data.best_selling_day.net_profit,
        sell_today_profit: data.options.option1.net_profit,
        industry_profit: data.options.option3.net_profit,
        overall_best: data.best_option,
        daily_breakdown: data.daily_breakdown,
      },
      govt_schemes: data.govt_schemes,
    };

    HISTORY = [mapped, ...HISTORY].slice(0, 20);
    return mapped;
  },

  async getHistory(): Promise<AnalysisResult[]> {
    return [...HISTORY];
  },

  async getById(id: string): Promise<AnalysisResult | undefined> {
    return HISTORY.find((h) => h.id === id);
  },
};

export function interpolateDailyPrices(today: number, day15: number, days = 15) {
  const arr: { day: number; price: number }[] = [];
  for (let i = 0; i <= days; i++) {
    const t = i / days;
    const eased = t * t * (3 - 2 * t);
    const wobble = Math.sin(i * 0.9) * (Math.abs(day15 - today) * 0.02);
    arr.push({ day: i, price: Math.round(today + (day15 - today) * eased + wobble) });
  }
  return arr;
}

export function toQuintalPrice(perKg: number) {
  return perKg * 100;
}
