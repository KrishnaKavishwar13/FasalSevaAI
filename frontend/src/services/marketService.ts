import { mockDelay } from "@/api/client";
import type { CropName, PriceInput, PriceOutput } from "@/types";
import { interpolateDailyPrices } from "@/services/analysisService";

export const marketService = {
  async getPriceForecast(input: PriceInput): Promise<
    PriceOutput & {
      daily: { day: number; price: number }[];
      regional_avg: { day: number; price: number }[];
    }
  > {
    const bias = input.crop.length % 3;
    const factor = bias === 0 ? 1.12 : bias === 1 ? 0.94 : 1.05;
    const price_after_15_days = Math.round(input.current_price * factor);
    const daily = interpolateDailyPrices(input.current_price, price_after_15_days);
    const regional_avg = daily.map((d) => ({
      day: d.day,
      price: Math.round(d.price * (0.94 + Math.sin(d.day) * 0.03)),
    }));
    return mockDelay({ price_after_15_days, daily, regional_avg }, 500);
  },
};

export const CROP_BASE_PRICE_PER_QUINTAL: Record<CropName, number> = {
  Tomato: 2200,
  Potato: 1400,
  Onion: 1900,
  Banana: 1800,
  Mango: 4500,
  Cauliflower: 1600,
  Cabbage: 1200,
  Spinach: 1100,
  Grapes: 5200,
  Guava: 3200,
  Carrot: 2000,
  Brinjal: 1500,
  Wheat: 2400,
  Rice: 2800,
};
