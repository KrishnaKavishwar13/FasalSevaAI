import type { WeatherReading, RiskLevel } from "@/types";

export const weatherService = {
  async getWeather(location: string = "Indore, MP", lat: number = 22.7196, lng: number = 75.8577): Promise<WeatherReading> {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation&hourly=precipitation&timezone=auto`);
      if (!res.ok) throw new Error("Failed to fetch weather");
      const data = await res.json();
      
      const temp = Math.round(data.current.temperature_2m);
      const hum = Math.round(data.current.relative_humidity_2m);
      const rain48 = data.hourly.precipitation.slice(0, 48).reduce((a: number, b: number) => a + b, 0);

      let alert: RiskLevel = "Green";
      let summary = "Good conditions for temporary storage.";
      
      if (temp > 35 || hum > 80) {
        alert = "Red";
        summary = "High risk of spoilage! Move perishables to cold storage immediately.";
      } else if (temp > 30 || hum > 65) {
        alert = "Yellow";
        summary = "Warm and humid. Monitor crops closely and prepare for storage.";
      }

      return {
        location,
        temperature: temp,
        humidity: hum,
        rain_next_48h_mm: Math.round(rain48),
        heatwave_risk: temp > 40 ? "High" : temp > 35 ? "Moderate" : "Low",
        spoilage_alert: alert,
        forecast_summary: summary,
      };
    } catch (e) {
      return {
        location,
        temperature: 32,
        humidity: 68,
        rain_next_48h_mm: 4,
        heatwave_risk: "Moderate",
        spoilage_alert: "Yellow",
        forecast_summary: "Warm and humid — perishables should be moved to controlled storage within 24 hours.",
      };
    }
  },
};
