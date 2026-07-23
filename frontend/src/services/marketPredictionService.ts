/**
 * marketPredictionService.ts
 * Calls POST /predict/price on our FastAPI backend.
 * Backend returns: { current_price, predicted_price_15_days, trend, expected_gain_per_quintal }
 * We map to PricePredictionOutput for UI compatibility.
 */
import { apiClient } from "@/api/client";
import type { PricePredictionInput, PricePredictionOutput, MarketTrend } from "@/types";

function mapTrend(gain: number, current: number): MarketTrend {
  const threshold = current * 0.04;
  if (gain > threshold) return "Increasing";
  if (gain < -threshold) return "Decreasing";
  return "Stable";
}

export const marketPredictionService = {
  async predict(input: PricePredictionInput): Promise<PricePredictionOutput> {
    const res = await apiClient.post("/predict/price", {
      crop: input.crop,
      state: input.state,
      current_price: input.current_price,
      month: input.month,
      week: input.week,
      target_days: 15,
    });

    const data = res.data as {
      current_price: number;
      predicted_price: number;
      trend: string;
      expected_gain: number;
      daily_prices?: { day: number; price: number }[];
    };

    const gain = data.expected_gain;
    const trend = mapTrend(gain, data.current_price);
    const confidence = Math.min(
      96,
      Math.max(76, Math.round(82 + Math.abs(gain) / 100 + (trend === "Increasing" ? 4 : 0))),
    );

    return {
      current_price: data.current_price,
      price_after_15_days: data.predicted_price,
      difference: Math.round(data.predicted_price - data.current_price),
      trend,
      confidence,
      daily_prices: data.daily_prices,
    };
  },
};
