import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, MapPin, Target, Thermometer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CROPS } from "@/constants/data";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CROP_BASE_PRICE_PER_QUINTAL } from "@/services/marketService";
import type { CropName } from "@/types";
import { analysisService } from "@/services/analysisService";
import { useTranslation } from "react-i18next";

export function CompleteAnalysis() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    crop: "Tomato",
    quantity: "100",
    days_stored: "0",
    state: "Madhya Pradesh",
    district: "Indore",
    price: CROP_BASE_PRICE_PER_QUINTAL["Tomato"].toString(),
    temp: "",
    humidity: ""
  });
  const [lat, setLat] = useState<number>(22.7196);
  const [lng, setLng] = useState<number>(75.8577);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceNote, setPriceNote] = useState("Auto-fetched from Agmarknet");

  // Auto-capture GPS + Weather on mount
  useEffect(() => {
    const fetchGPSAndWeather = async () => {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
        const cLat = pos.coords.latitude;
        const cLng = pos.coords.longitude;
        setLat(cLat);
        setLng(cLng);
        
        const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${cLat}&longitude=${cLng}&current=temperature_2m,relative_humidity_2m&forecast_days=1`).then(r => r.json());
        setForm(f => ({
          ...f,
          temp: Math.round((w.current.temperature_2m + 5) * 10) / 10 + "",
          humidity: Math.min(100, Math.round(w.current.relative_humidity_2m + 8)) + ""
        }));
        toast.success(t("analysis.gps_weather_loaded", "GPS and Weather data loaded!"));
      } catch {
        // Fallbacks
        setForm(f => ({ ...f, temp: "33", humidity: "78" }));
        toast.error(t("analysis.gps_weather_failed", "Could not fetch GPS/Weather. Using default values."));
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchGPSAndWeather();
  }, []);

  // Auto-fetch price when crop or state changes
  useEffect(() => {
    if (form.crop && form.state) {
      setPriceLoading(true);
      apiClient.get(`/current-price?crop=${form.crop}&state=${form.state}`)
        .then(r => {
          if (r.data.found) {
            setForm(f => ({ ...f, price: r.data.current_price.toString() }));
            if (r.data.is_fallback) {
                setPriceNote(t("analysis.price_unavailable_seasonal", "⚠️ Live price unavailable — using seasonal average. Please verify manually."));
            } else {
                setPriceNote(t("analysis.live_from_agmarknet_market", "✅ Live from Agmarknet — {{market}} ({{date}})", { market: r.data.market, date: r.data.date }));
            }
          } else {
            const fallback = CROP_BASE_PRICE_PER_QUINTAL[form.crop as CropName] || 1500;
            setForm(f => ({ ...f, price: fallback.toString() }));
            setPriceNote(t("analysis.price_unavailable_seasonal", "⚠️ Live price unavailable — using seasonal average. Please verify manually."));
            toast.info(t("analysis.approx_market_price", "Using approximate market price for {{crop}}", { crop: form.crop }));
          }
        })
        .catch(() => {
          const fallback = CROP_BASE_PRICE_PER_QUINTAL[form.crop as CropName] || 1500;
          setForm(f => ({ ...f, price: fallback.toString() }));
          setPriceNote(t("analysis.price_unavailable_seasonal", "⚠️ Live price unavailable — using seasonal average. Please verify manually."));
          toast.error(t("analysis.price_fetch_failed", "Could not fetch live price. Using approximate price."));
        })
        .finally(() => setPriceLoading(false));
    }
  }, [form.crop, form.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.price || !form.temp || !form.humidity) {
      return toast.error(t("analysis.fill_auto_fields", "Please fill in all auto-fetched fields if they failed to load."));
    }

    setLoading(true);
    try {
      const res = await analysisService.runFull({
        crop: form.crop,
        state: form.state,
        district: form.district,
        quantity_kg: Number(form.quantity),
        current_price: Number(form.price),
        days_stored: Number(form.days_stored),
        temp: Number(form.temp),
        humidity: Number(form.humidity),
        farmer_lat: lat,
        farmer_lng: lng,
      });
      
      // Wait for 500ms to mimic complex processing for UX
      await new Promise(r => setTimeout(r, 500));
      
      navigate(`/dashboard/result/${res.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(t("analysis.analysis_failed", "Analysis failed. ") + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="mb-3 -ml-3" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("analysis.back", "Back")}
          </Button>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Target className="text-amber-500 h-8 w-8" /> {t("analysis.complete_title", "Complete Analysis")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("analysis.complete_desc_engine", "End-to-end post harvest decision engine.")}</p>
        </div>
      </motion.div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label>{t("analysis.crop_label", "Crop")}</Label>
              <Select value={form.crop} onValueChange={(value) => setForm(f => ({ ...f, crop: value }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t("analysis.select_crop", "Select crop")} /></SelectTrigger>
                <SelectContent>
                  {CROPS.map((crop) => (
                    <SelectItem key={crop.name} value={crop.name}>{crop.emoji} {crop.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("analysis.quantity_label", "Quantity (kg)")}</Label>
              <Input className="mt-1" type="number" min="1" value={form.quantity} onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))} required />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label>{t("analysis.state_label", "State")}</Label>
              <Select value={form.state} onValueChange={(value) => setForm(f => ({ ...f, state: value }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t("analysis.select_state", "Select state")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                  <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                  <SelectItem value="Gujarat">Gujarat</SelectItem>
                  <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("analysis.district_label", "District")}</Label>
              <Input className="mt-1" placeholder="e.g. Indore" value={form.district} onChange={(e) => setForm(f => ({ ...f, district: e.target.value }))} required />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <Label>{t("analysis.days_stored_label", "Days stored since harvest")}</Label>
              <Input className="mt-1" type="number" min="0" value={form.days_stored} onChange={(e) => setForm(f => ({ ...f, days_stored: e.target.value }))} required />
            </div>
            
            <div className="relative">
              <Label>{t("analysis.today_price_label", "Today's Price (₹/quintal)")}</Label>
              <Input className="mt-1" type="number" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} required />
              {priceLoading && <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-muted-foreground" />}
              <p className={`text-xs mt-1 ${priceNote.includes('⚠️') ? 'text-amber-600' : 'text-green-600'}`}>{priceNote}</p>
            </div>

            <div className="relative">
              <Label>{t("analysis.storage_temp_label", "Storage Temp (°C)")}</Label>
              <div className="relative">
                <Thermometer className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input className="mt-1 pl-9" type="number" step="0.1" value={form.temp} onChange={(e) => setForm(f => ({ ...f, temp: e.target.value }))} required />
                {weatherLoading && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {t("analysis.auto_from_gps", "Auto from GPS")}</p>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white text-lg" disabled={loading || weatherLoading || priceLoading}>
            {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("analysis.analyzing", "Analyzing...")}</> : t("analysis.run_complete_analysis", "Run Complete AI Analysis")}
          </Button>

        </form>
      </Card>
    </div>
  );
}
