/**
 * shelfLifeService.ts
 * Calls POST /predict/spoilage on our FastAPI backend.
 * Backend returns: { days_remaining, risk_level }
 * We add a confidence score and recommendation locally for UI compatibility.
 */
import { apiClient } from "@/api/client";
import type { ShelfLifeInput, ShelfLifeOutput, RiskLevel } from "@/types";

function getConfidence(riskLevel: RiskLevel): number {
  return riskLevel === "Green" ? 89 : riskLevel === "Yellow" ? 78 : 72;
}

function getRecommendation(riskLevel: RiskLevel, daysRemaining: number): string {
  if (riskLevel === "Green") return `Crop can safely be stored for another ${daysRemaining} days.`;
  if (riskLevel === "Yellow")
    return `Monitor storage closely; remaining life is limited to ${daysRemaining} days.`;
  return `Immediate action is recommended; spoilage risk is high within ${daysRemaining} days.`;
}

export const shelfLifeService = {
  async predict(input: ShelfLifeInput): Promise<ShelfLifeOutput> {
    const res = await apiClient.post("/predict/spoilage", {
      crop: input.crop,
      temp: input.temperature,
      humidity: input.humidity,
      days_stored: input.days_stored,
    });

    const { days_remaining, risk_level } = res.data as {
      days_remaining: number;
      risk_level: RiskLevel;
    };

    return {
      days_remaining,
      risk_level,
      confidence: getConfidence(risk_level),
      recommendation: getRecommendation(risk_level, days_remaining),
    };
  },
};
