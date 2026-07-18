import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Clock3, Download, Droplets, History, Leaf, Loader2, RotateCcw, Share2, Sparkles, Thermometer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { CROPS } from "@/constants/data";
import { shelfLifeService } from "@/services/shelfLifeService";
import { apiClient } from "@/api/client";
import type { ShelfLifeInput, ShelfLifeOutput } from "@/types";
import { toast } from "sonner";
import { ResponsiveContainer, RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";
import { useTranslation } from "react-i18next";

type HistoryEntry = {
  id: string;
  createdAt: string;
  crop: string;
  days_remaining: number;
  confidence: number;
  risk_level: string;
  recommendation: string;
};

const STORAGE_KEY = "fasalseva_shelf_history";
const defaultForm: ShelfLifeInput = {
  crop: "Tomato",
  temperature: 24,
  humidity: 72,
  days_stored: 3,
};

function riskBadgeClass(risk: string) {
  switch (risk) {
    case "Green":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-600";
    case "Yellow":
      return "border-amber-400/30 bg-amber-500/10 text-amber-600";
    default:
      return "border-rose-400/30 bg-rose-500/10 text-rose-600";
  }
}

export function ShelfLifePrediction() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState<ShelfLifeInput>(defaultForm);
  const [result, setResult] = useState<ShelfLifeOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherSource, setWeatherSource] = useState("");

  const getRealTimeWeather = async () => {
    setWeatherLoading(true)
    setWeatherSource("")
    try {
        let lat = 22.7196  // Indore default
        let lng = 75.8577
        let locationSource = "default"

        // Layer 1: Try browser GPS
        try {
            const pos = await new Promise<GeolocationPosition>((res, rej) => {
                navigator.geolocation.getCurrentPosition(res, rej, {
                    timeout: 5000,
                    maximumAge: 60000
                })
            })
            lat = pos.coords.latitude
            lng = pos.coords.longitude
            locationSource = "gps"
        } catch {
            // Layer 2: Try IP-based location (no key needed)
            try {
                const ipRes = await fetch("https://ipapi.co/json/")
                const ipData = await ipRes.json()
                if (ipData.latitude) {
                    lat = ipData.latitude
                    lng = ipData.longitude
                    locationSource = "ip"
                }
            } catch {
                // Layer 3: Use default Indore coordinates
                locationSource = "default"
            }
        }

        // Now fetch weather from Open-Meteo (free, no key)
        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m&forecast_days=1`
        )
        const weatherData = await weatherRes.json()

        const outdoorTemp     = weatherData.current.temperature_2m
        const outdoorHumidity = weatherData.current.relative_humidity_2m

        // Apply storage standardization
        const storageTemp     = Math.round((outdoorTemp + 5) * 10) / 10
        const storageHumidity = Math.min(100, Math.round(outdoorHumidity + 8))

        // Update form fields
        setForm((f: any) => ({
            ...f,
            temperature: storageTemp,
            humidity: storageHumidity
        }))

        const sourceLabel = locationSource === "gps" ? "GPS" :
                           locationSource === "ip"  ? "IP location" : "Indore (default)"

        setWeatherSource(
            `✅ Live weather (${sourceLabel}): Outdoor ${outdoorTemp}°C → Storage ~${storageTemp}°C | ${outdoorHumidity}% → ~${storageHumidity}%`
        )

    } catch (err) {
        // Complete fallback — set reasonable defaults
        setForm((f: any) => ({
            ...f,
            temperature: 33,
            humidity: 78
        }))
        setWeatherSource("⚠️ Weather API failed. Using seasonal average: 33°C, 78%")
    } finally {
        setWeatherLoading(false)
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const gaugeData = useMemo(() => {
    if (!result) {
      return [{ name: "risk", value: 0, fill: "#16a34a" }];
    }
    const value = Math.min(100, Math.max(0, result.confidence));
    const fill = result.risk_level === "Green" ? "#16a34a" : result.risk_level === "Yellow" ? "#ea580c" : "#dc2626";
    return [{ name: "risk", value, fill }];
  }, [result]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // ADD THIS — check what we're sending
    const payload = {
        crop:        form.crop,
        temp:        Number(form.temperature),
        humidity:    Number(form.humidity),
        days_stored: Number(form.days_stored)
    }
    console.log("Sending to /predict/spoilage:", payload)

    try {
        const res = await apiClient.post("/predict/spoilage", payload)
        console.log("Response:", res.data)
        
        const response: ShelfLifeOutput = {
            days_remaining: res.data.days_remaining,
            risk_level: res.data.risk_level as any,
            confidence: 85, // Mapped locally
            recommendation: res.data.risk_level === 'Green' ? 'Store safely' : 'Sell quickly' // default mapping
        };

        setResult(response);
        const entry: HistoryEntry = {
            id: `${Date.now()}`,
            createdAt: new Date().toISOString(),
            crop: form.crop,
            days_remaining: response.days_remaining,
            confidence: response.confidence,
            risk_level: response.risk_level,
            recommendation: response.recommendation,
        };
        const nextHistory = [entry, ...history].slice(0, 6);
        setHistory(nextHistory);
        if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
        }
        toast.success("Shelf-life prediction ready");
    } catch (err: any) {
        console.error("Spoilage error:", err.response?.data || err.message)
        setError("Prediction could not be generated. Please try again.")
        toast.error("Prediction failed");
    } finally {
        setLoading(false)
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setForm(defaultForm);
  };

  const handleDownload = () => {
    if (!result) return;
    const payload = `Shelf-Life Prediction\nCrop: ${form.crop}\nDays Remaining: ${result.days_remaining}\nConfidence: ${result.confidence}%\nRisk Level: ${result.risk_level}\nRecommendation: ${result.recommendation}`;
    const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${form.crop.toLowerCase()}-shelf-life-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!result) return;
    const text = `FasalSeva AI shelf-life prediction for ${form.crop}: ${result.days_remaining} days remaining.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Shelf-life prediction", text });
        return;
      } catch {
        // Ignore share cancellation
      }
    }
    await navigator.clipboard.writeText(text);
    toast.success("Result copied to clipboard");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="mb-3 -ml-3" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("analysis.back", "Back")}
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{t("shelf_life.title", "Shelf-Life Prediction")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("shelf_life.subtitle", "Predict the remaining safe storage duration of harvested crops.")}</p>
        </div>
        <Badge className="border-primary/20 bg-primary/10 text-primary">AI Powered</Badge>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-border/60 bg-card/90 p-6 shadow-card">
          <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-emerald-500/15 via-background to-primary/10 p-6">
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">{t("shelf_life.smart_storage", "Smart storage planning")}</p>
                <h2 className="mt-2 text-2xl font-semibold">{t("shelf_life.premium_analysis", "Premium shelf-life analysis")}</h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("shelf_life.analysis_desc", "Use AI-guided predictions to decide when to sell, store, or process your harvest safely.")}</p>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-background/80 shadow-card">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>{t("analysis.crop_label", "Crop")}</Label>
                <Select value={form.crop} onValueChange={(value) => setForm((prev) => ({ ...prev, crop: value as ShelfLifeInput["crop"] }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={t("analysis.select_crop", "Select crop")} /></SelectTrigger>
                  <SelectContent>
                    {CROPS.map((crop) => (
                      <SelectItem key={crop.name} value={crop.name}>{crop.emoji} {crop.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("shelf_life.days_stored", "Days stored")}</Label>
                <Input className="mt-1" type="number" min="0" value={form.days_stored} onChange={(event) => setForm((prev) => ({ ...prev, days_stored: Number(event.target.value) }))} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>{t("shelf_life.temp_label", "Temperature (°C)")}</Label>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
                  <Thermometer className="h-4 w-4 text-primary" />
                  <Input type="number" className="border-0 bg-transparent px-0 shadow-none" value={form.temperature} onChange={(event) => setForm((prev) => ({ ...prev, temperature: Number(event.target.value) }))} />
                </div>
                <p className="text-xs text-soil/40 mt-1">
                    {t("shelf_life.temp_hint", "💡 Storage temperature = outdoor temp + 5°C (auto-calculated)")}
                </p>
              </div>
              <div>
                <Label>{t("shelf_life.humidity_label", "Humidity (%)")}</Label>
                <div className="mt-2 space-y-3 rounded-lg border border-border/60 bg-background/60 p-3">
                  <Slider value={[form.humidity]} max={100} min={40} step={1} onValueChange={([value]) => setForm((prev) => ({ ...prev, humidity: value }))} />
                  <Input type="number" min="40" max="100" value={form.humidity} onChange={(event) => setForm((prev) => ({ ...prev, humidity: Number(event.target.value) }))} />
                </div>
                <p className="text-xs text-soil/40 mt-1">
                    {t("shelf_life.humidity_hint", "💡 Storage humidity = outdoor humidity + 8% (auto-calculated)")}
                </p>
              </div>
            </div>

            <div>
              <button
                  type="button"
                  onClick={getRealTimeWeather}
                  disabled={weatherLoading}
                  className="w-full py-2 rounded-xl border-2 border-dashed font-medium text-sm transition hover:bg-leaf/5"
                  style={{ borderColor: 'var(--leaf)', color: 'var(--leaf)' }}>
                  {weatherLoading
                      ? t("shelf_life.getting_weather", "📡 Getting real-time weather...")
                      : t("shelf_life.get_real_time", "🌡️ Get Real-Time Temperature & Humidity")}
              </button>

              {weatherSource && (
                  <p className="text-xs mt-1 text-center"
                      style={{ color: weatherSource.includes('⚠️') ? '#E8A020' : 'var(--leaf)' }}>
                      {weatherSource}
                  </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" className="gradient-primary text-primary-foreground" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("shelf_life.predicting", "Predicting...")}</> : t("shelf_life.predict_btn", "Predict Shelf Life")}
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" /> {t("shelf_life.reset", "Reset")}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">{t("shelf_life.result", "Result")}</p>
                <h3 className="mt-1 text-xl font-semibold">{t("shelf_life.live_prediction", "Live prediction")}</h3>
              </div>
              {result && <Badge className={riskBadgeClass(result.risk_level)}>{result.risk_level}</Badge>}
            </div>

            {loading ? (
              <div className="mt-6 space-y-4">
                <div className="h-24 animate-pulse rounded-2xl bg-muted" />
                <div className="h-24 animate-pulse rounded-2xl bg-muted" />
              </div>
            ) : error ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>
              </div>
            ) : result ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500/10 to-primary/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("shelf_life.remaining_safe_days", "Remaining Safe Days")}</p>
                      <p className="text-4xl font-semibold">{result.days_remaining} <span className="text-base font-medium">{t("shelf_life.days", "Days")}</span></p>
                    </div>
                    <div className="rounded-2xl bg-background/70 p-3 shadow-card">
                      <Clock3 className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/50 bg-background/70 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("shelf_life.confidence", "Confidence")}</p>
                      <p className="mt-1 text-lg font-semibold">{result.confidence}%</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-background/70 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("shelf_life.risk_level", "Risk Level")}</p>
                      <p className="mt-1 text-lg font-semibold">{result.risk_level}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> {t("shelf_life.recommendation", "Recommendation")}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{result.recommendation}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{t("shelf_life.risk_indicator", "Risk indicator")}</p>
                    <Badge className={riskBadgeClass(result.risk_level)}>{result.risk_level}</Badge>
                  </div>
                  <div className="mt-4 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart innerRadius="70%" outerRadius="100%" data={gaugeData} startAngle={180} endAngle={0}>
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar background clockWise dataKey="value" cornerRadius={12} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">{t("shelf_life.confidence_score", "Confidence score")} {result.confidence}%</p>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 py-16 text-center text-sm text-muted-foreground">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10">
                  <Leaf className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("shelf_life.no_analysis", "No analysis yet")}</p>
                  <p className="mt-1 max-w-[250px] text-xs leading-relaxed">{t("shelf_life.no_analysis_desc", "Submit the form to generate a premium AI shelf-life report tailored to your live crop conditions.")}</p>
                </div>
              </div>
            )}
          </Card>

          {result && (
            <Card className="p-6">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" /> {t("shelf_life.download_report", "Download report")}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" /> {t("shelf_life.share_result", "Share result")}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">{t("shelf_life.history", "Prediction history")}</p>
            <h3 className="mt-1 text-xl font-semibold">{t("shelf_life.recent_predictions", "Recent predictions")}</h3>
          </div>
          <div className="rounded-full bg-primary/10 p-2 text-primary"><History className="h-4 w-4" /></div>
        </div>
        <Separator className="my-4" />
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">{t("shelf_life.no_history", "No predictions yet. Run your first analysis to build a storage history.")}</div>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{entry.crop}</p>
                  <p className="text-sm text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={riskBadgeClass(entry.risk_level)}>{entry.risk_level}</Badge>
                  <span className="text-sm text-muted-foreground">{entry.days_remaining} days • {entry.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
