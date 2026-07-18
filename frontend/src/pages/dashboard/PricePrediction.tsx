import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, ArrowDown, ArrowLeft, ArrowUp, BarChart3, Download, History, Loader2, RotateCcw, Share2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CROPS, STATES, STATE_DISTRICTS } from "@/constants/data";
import { apiClient } from "@/api/client";
import { marketPredictionService } from "@/services/marketPredictionService";
import type { PricePredictionInput, PricePredictionOutput } from "@/types";
import { toast } from "sonner";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";

type HistoryEntry = {
  id: string;
  createdAt: string;
  crop: string;
  current_price: number;
  price_after_15_days: number;
  difference: number;
  trend: string;
  confidence: number;
};

const STORAGE_KEY = "fasalseva_price_history";
const defaultForm: PricePredictionInput = {
  crop: "Tomato",
  state: "Maharashtra",
  district: "Pune",
  current_price: 500,
  month: new Date().getMonth() + 1,
  week: 1,
};

function trendBadgeClass(trend: string) {
  switch (trend) {
    case "Increasing":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-600";
    case "Stable":
      return "border-sky-400/30 bg-sky-500/10 text-sky-600";
    default:
      return "border-rose-400/30 bg-rose-500/10 text-rose-600";
  }
}

export function PricePrediction() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState<PricePredictionInput>(defaultForm);
  const [result, setResult] = useState<PricePredictionOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [priceSource, setPriceSource] = useState<string>("");

  useEffect(() => {
    async function fetchCurrentPrice() {
      if (!form.crop || !form.state) return;
      try {
        const res = await apiClient.get("/current-price", {
          params: { crop: form.crop, state: form.state, district: "" }
        });
        if (res.data.found && res.data.current_price > 0) {
          setForm(f => ({ ...f, current_price: res.data.current_price }));
          setPriceSource(t("price_prediction.live_agmarknet", "📡 Live from Agmarknet — {{market}} ({{date}})", { market: res.data.market, date: res.data.date }));
        } else {
          setPriceSource(t("price_prediction.price_not_found", "⚠️ Price not found — please enter manually"));
        }
      } catch {
        setPriceSource(t("price_prediction.could_not_fetch", "⚠️ Could not fetch price — enter manually"));
      }
    }
    fetchCurrentPrice();
  }, [form.crop, form.state]);

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

  const chartData = useMemo(() => {
    if (!result) return [];
    
    if (result.daily_prices && result.daily_prices.length > 0) {
      return result.daily_prices.map(d => ({
        label: `Day ${d.day}`,
        price: d.price
      }));
    }

    const points = [];
    const diff = result.price_after_15_days - result.current_price;
    for (let i = 0; i <= 15; i += 3) {
      const p = result.current_price + (diff * (i / 15));
      points.push({ label: `Day ${i}`, price: Math.round(p) });
    }
    return points;
  }, [result]);

  const recommendation = useMemo(() => {
    if (!result) return "";
    if (result.trend === "Increasing") return `Prices are expected to increase after 15 days. Delayed selling may increase profits.`;
    if (result.trend === "Stable") return `The market is expected to stay stable. A cautious selling strategy is recommended.`;
    return `Prices are expected to soften after 15 days. Selling sooner may help protect margins.`;
  }, [result]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
        const now   = new Date();
        const month = now.getMonth() + 1;
        const week  = Math.ceil(now.getDate() / 7);

        const res = await apiClient.post("/predict/price", {
            crop:          form.crop,
            state:         form.state,
            current_price: Number(form.current_price),
            month:         month,
            week:          week,
            target_days:   15
        });

        const data = res.data;
        // Map backend response to PricePredictionOutput
        const gain = data.expected_gain;
        const trendStr = gain > (form.current_price * 0.04) ? "Increasing" : gain < -(form.current_price * 0.04) ? "Decreasing" : "Stable";
        const confidence = Math.min(96, Math.max(76, Math.round(82 + Math.abs(gain) / 100 + (trendStr === "Increasing" ? 4 : 0))));

        const mappedResponse: PricePredictionOutput = {
            current_price: data.current_price,
            price_after_15_days: data.predicted_price,
            difference: Math.round(data.predicted_price - data.current_price),
            trend: trendStr as any,
            confidence: confidence,
            daily_prices: data.daily_prices,
        };

        setResult(mappedResponse);
        const entry: HistoryEntry = {
            id: `${Date.now()}`,
            createdAt: new Date().toISOString(),
            crop: form.crop,
            current_price: mappedResponse.current_price,
            price_after_15_days: mappedResponse.price_after_15_days,
            difference: mappedResponse.difference,
            trend: mappedResponse.trend,
            confidence: mappedResponse.confidence,
        };
        const nextHistory = [entry, ...history].slice(0, 6);
        setHistory(nextHistory);
        if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
        }
        toast.success("Price forecast ready");
    } catch (err: any) {
        console.error("Price prediction error:", err);
        setError("Forecast could not be generated. Please try again.");
        toast.error("Prediction failed");
    } finally {
        setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setForm(defaultForm);
  };

  const handleDownload = () => {
    if (!result) return;
    const payload = `Market Price Prediction\nCrop: ${form.crop}\nCurrent Price: ₹${result.current_price}\nPredicted Price: ₹${result.price_after_15_days}\nDifference: ₹${result.difference}\nTrend: ${result.trend}\nConfidence: ${result.confidence}%`;
    const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${form.crop.toLowerCase()}-price-forecast.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!result) return;
    const text = `FasalSeva AI price forecast for ${form.crop}: ₹${result.price_after_15_days} after 15 days.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Price forecast", text });
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
          <h1 className="text-3xl font-bold tracking-tight">{t("price_prediction.title", "Market Price Prediction")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("price_prediction.subtitle", "Predict mandi price after the next 15 days.")}</p>
        </div>
        <Badge className="border-primary/20 bg-primary/10 text-primary">AI Powered</Badge>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-amber-500/15 via-background to-primary/10 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">{t("price_prediction.data_driven", "Data-driven market outlook")}</p>
                <h2 className="mt-2 text-2xl font-semibold">{t("price_prediction.modern_forecasting", "Modern price forecasting")}</h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("price_prediction.plan_sale", "Plan your sale timing with a forward-looking mandi price forecast tailored to your crop and region.")}</p>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-background/80 shadow-card">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>{t("analysis.crop_label", "Crop")}</Label>
                <Select value={form.crop} onValueChange={(value) => setForm((prev) => ({ ...prev, crop: value as PricePredictionInput["crop"] }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={t("analysis.select_crop", "Select crop")} /></SelectTrigger>
                  <SelectContent>
                    {CROPS.map((crop) => (
                      <SelectItem key={crop.name} value={crop.name}>{crop.emoji} {crop.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("price_prediction.current_price", "Current price")}</Label>
                <Input className="mt-1" type="number" value={form.current_price} onChange={(event) => setForm((prev) => ({ ...prev, current_price: Number(event.target.value) }))} />
                {priceSource && (
                    <p className="text-xs mt-1" style={{ color: priceSource.includes('Live') ? 'var(--color-emerald-600)' : '#E8A020' }}>
                        {priceSource}
                    </p>
                )}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>{t("analysis.state_label", "State")}</Label>
                <Select value={form.state} onValueChange={(value) => setForm((prev) => ({ ...prev, state: value }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={t("analysis.select_state", "Select state")} /></SelectTrigger>
                  <SelectContent>{STATES.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}</SelectContent>
                </Select>
              </div>

            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>{t("price_prediction.month", "Month")}</Label>
                <Select value={`${form.month}`} onValueChange={(value) => setForm((prev) => ({ ...prev, month: Number(value) }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={t("price_prediction.select_month", "Select month")} /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <SelectItem key={month} value={`${month}`}>{new Date(2024, month - 1).toLocaleString("default", { month: "long" })}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("price_prediction.week", "Week")}</Label>
                <Select value={`${form.week}`} onValueChange={(value) => setForm((prev) => ({ ...prev, week: Number(value) }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={t("price_prediction.select_week", "Select week")} /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 52 }, (_, index) => index + 1).map((week) => <SelectItem key={week} value={`${week}`}>Week {week}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" className="gradient-primary text-primary-foreground" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("shelf_life.predicting", "Predicting...")}</> : t("price_prediction.predict_btn", "Predict Future Price")}
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" /> {t("price_prediction.reset", "Reset")}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">{t("price_prediction.forecast", "Forecast")}</p>
                <h3 className="mt-1 text-xl font-semibold">{t("price_prediction.live_market_outlook", "Live market outlook")}</h3>
              </div>
              {result && <Badge className={trendBadgeClass(result.trend)}>{result.trend}</Badge>}
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-amber-500/10 p-4">
                    <p className="text-sm text-muted-foreground">{t("price_prediction.todays_price", "Today’s Price")}</p>
                    <p className="mt-1 text-2xl font-semibold">₹{result.current_price}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500/10 to-primary/10 p-4">
                    <p className="text-sm text-muted-foreground">{t("price_prediction.predicted_price", "Predicted Price")}</p>
                    <p className="mt-1 text-2xl font-semibold">₹{result.price_after_15_days}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("price_prediction.expected_increase", "Expected Increase")}</p>
                    <p className="mt-1 text-lg font-semibold">₹{result.difference}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("price_prediction.confidence", "Confidence")}</p>
                    <p className="mt-1 text-lg font-semibold">{result.confidence}%</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("price_prediction.trend", "Trend")}</p>
                    <p className="mt-1 text-lg font-semibold">{result.trend}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> {t("price_prediction.recommendation", "Recommendation")}</div>
                  <p className="text-sm text-muted-foreground">{recommendation}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">{t("price_prediction.price_trend_chart", "Price trend line chart")}</p>
                    {result.trend === "Increasing" ? <ArrowUp className="h-4 w-4 text-emerald-600" /> : result.trend === "Decreasing" ? <ArrowDown className="h-4 w-4 text-rose-600" /> : <div className="h-4 w-4 rounded-full bg-sky-500" />}
                  </div>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 py-16 text-center text-sm text-muted-foreground">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("price_prediction.no_forecast", "No price forecast yet")}</p>
                  <p className="mt-1 max-w-[250px] text-xs leading-relaxed">{t("price_prediction.no_forecast_desc", "Submit the form to view a detailed projection of the future mandi price curve.")}</p>
                </div>
              </div>
            )}
          </Card>

          {result && (
            <Card className="p-6">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" /> {t("price_prediction.download_report", "Download report")}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" /> {t("price_prediction.share_result", "Share result")}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">{t("price_prediction.prediction_history", "Prediction history")}</p>
            <h3 className="mt-1 text-xl font-semibold">{t("price_prediction.recent_predictions", "Recent predictions")}</h3>
          </div>
          <div className="rounded-full bg-primary/10 p-2 text-primary"><History className="h-4 w-4" /></div>
        </div>
        <Separator className="my-4" />
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">{t("price_prediction.no_history", "No predictions yet. Run your first market forecast to build a trend history.")}</div>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{entry.crop}</p>
                  <p className="text-sm text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={trendBadgeClass(entry.trend)}>{entry.trend}</Badge>
                  <span className="text-sm text-muted-foreground">₹{entry.price_after_15_days} • {entry.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
