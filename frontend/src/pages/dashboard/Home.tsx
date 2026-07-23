import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowRight,
  Cloud,
  Droplets,
  Thermometer,
  TrendingUp,
  Sparkles,
  Wheat,
  MapPin,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/RiskBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { formatINR } from "@/utils/format";
import { apiClient } from "@/api/client";
import { authService, type AuthUser } from "@/services/authService";
import { CROPS } from "@/constants/data";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { analysisService, interpolateDailyPrices } from "@/services/analysisService";
import { useTranslation } from "react-i18next";

const GOVT_SCHEMES = [
  { id: "pm_kisan", apply_url: "https://pmkisan.gov.in" },
  { id: "pmfby", apply_url: "https://pmfby.gov.in" },
  { id: "kcc", apply_url: "#" },
  { id: "aif", apply_url: "https://agriinfra.dac.gov.in" },
  { id: "enam", apply_url: "https://enam.gov.in" },
  { id: "pm_sampada", apply_url: "https://mofpi.gov.in" },
  { id: "soil_health", apply_url: "https://soilhealth.dac.gov.in" },
  { id: "pm_kmy", apply_url: "https://pmkmy.gov.in" },
];

export function DashboardHome() {
  const { user, setUser } = useAuth();
  const { t } = useTranslation();

  // Onboarding State
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [lat, setLat] = useState<number>();
  const [lng, setLng] = useState<number>();
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedState, setSelectedState] = useState("Madhya Pradesh");

  // Dashboard Data State
  const [weather, setWeather] = useState<{ temp: number; humidity: number; rain: number } | null>(
    null,
  );
  const [nearestStorage, setNearestStorage] = useState<any>(null);
  const [storageCount, setStorageCount] = useState(0);
  const [todayPrice, setTodayPrice] = useState<number | null>(null);
  const [schemeOfDay, setSchemeOfDay] = useState<any>(null);

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => analysisService.getHistory(),
  });
  const latest = history?.[0];
  const chartData = latest
    ? interpolateDailyPrices(latest.price.today, latest.price.after_15_days)
    : [];

  const captureGPS = async () => {
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }),
      );
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
      setOnboardingStep(2);
    } catch {
      // Fallback
      setLat(22.7196);
      setLng(75.8577);
      setOnboardingStep(2);
      toast.error(t("dashboard.gps_blocked", "GPS blocked. Using default location (Indore)."));
    }
  };

  const finishOnboarding = (crop?: string) => {
    if (!user) return;
    const finalCrop = crop || selectedCrop;
    const updatedUser: AuthUser = {
      ...user,
      onboarded: true,
      mainCrop: finalCrop,
      state: selectedState,
      lat,
      lng,
    };
    authService.updateCurrentUser(updatedUser);
    setUser(updatedUser);
    toast.success(t("dashboard.profile_saved", "Profile saved!"));
  };

  useEffect(() => {
    if (user?.onboarded) {
      loadDashboardData();
    }
  }, [user?.onboarded]);

  const loadDashboardData = async () => {
    if (!user) return;

    // 1. GPS -> Weather
    const clat = user.lat || 22.7196;
    const clng = user.lng || 75.8577;

    try {
      const w = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${clat}&longitude=${clng}&current=temperature_2m,relative_humidity_2m,precipitation&forecast_days=1`,
      ).then((r) => r.json());
      setWeather({
        temp: w.current.temperature_2m,
        humidity: w.current.relative_humidity_2m,
        rain: w.current.precipitation,
      });
    } catch (e) {
      console.error(e);
    }

    // 2. Nearest Storage
    try {
      const s = await apiClient.get(`/storage?lat=${clat}&lng=${clng}`);
      setStorageCount(s.data.results.length);
      setNearestStorage(s.data.results[0]);
    } catch (e) {
      console.error(e);
    }

    // 3. Today's Price
    if (user.mainCrop && user.state) {
      try {
        const p = await apiClient.get(`/current-price?crop=${user.mainCrop}&state=${user.state}`);
        if (p.data.found) setTodayPrice(p.data.current_price);
      } catch (e) {
        console.error(e);
      }
    }

    // 4. Scheme of Day
    const schemeIndex = new Date().getDate() % GOVT_SCHEMES.length;
    setSchemeOfDay(GOVT_SCHEMES[schemeIndex]);
  };

  if (user && !user.onboarded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <Card className="w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

          <AnimatePresence mode="wait">
            {onboardingStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold">
                    {t("onboarding.greeting", "Namaste {{name}} ji! 🌾", {
                      name: user.name.split(" ")[0],
                    })}
                  </h2>
                  <p className="mt-2 text-muted-foreground text-sm">
                    {t("onboarding.subtitle1", "FasalSeva will give you the right advice.")}
                  </p>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {t("onboarding.subtitle2", "To start, provide your location:")}
                  </p>
                </div>
                <Button onClick={captureGPS} className="w-full h-12 text-lg">
                  <MapPin className="mr-2" /> {t("onboarding.give_location", "Give my location")}
                </Button>
              </motion.div>
            )}

            {onboardingStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold">
                    {t("onboarding.step2_title", "What is your main crop?")}
                  </h2>
                  <p className="mt-2 text-muted-foreground text-sm">
                    {t(
                      "onboarding.step2_subtitle",
                      "We will show you market prices for this crop.",
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 pb-2">
                  {CROPS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => finishOnboarding(c.name)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2 hover:bg-muted transition ${selectedCrop === c.name ? "border-primary bg-primary/5" : ""}`}
                    >
                      <span className="text-xl">{c.emoji}</span> <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-2 md:flex-row md:items-end"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("dashboard.greeting", "Namaste, {{name}} 👋", {
              name: user?.name?.split(" ")[0] ?? t("dashboard.farmer", "Farmer"),
            })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.quick_look", "Here's a quick look at your farm today.")}
          </p>
        </div>
        <Button asChild className="gradient-primary text-primary-foreground">
          <Link to="/dashboard/new-analysis">
            {t("dashboard.new_analysis", "New analysis")} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Weather */}
        <Card className="p-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
            <Cloud className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {t("dashboard.weather_title", "Today's Weather")}
            </p>
            {weather ? (
              <>
                <p className="text-lg font-bold">
                  {weather.temp}°C | {weather.humidity}% {t("dashboard.humidity", "Humidity")}
                </p>
                {weather.rain > 0 && (
                  <p className="text-xs text-blue-500 font-medium mt-0.5">
                    🌧️ {t("dashboard.rain_chance", "Chance of rain")}
                  </p>
                )}
              </>
            ) : (
              <Skeleton className="h-6 w-24 mt-1" />
            )}
          </div>
        </Card>

        {/* Card 2: Today's Price */}
        <Card className="p-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-green-500/10 text-green-500">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {t("dashboard.crop_price_title", "{{crop}}'s Price", {
                crop: user?.mainCrop || t("dashboard.crop", "Crop"),
              })}
            </p>
            {todayPrice !== null ? (
              <>
                <p className="text-lg font-bold text-green-600">₹{todayPrice}/q</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("dashboard.live_from_agmarknet", "Live from Agmarknet")}
                </p>
              </>
            ) : (
              <Skeleton className="h-6 w-24 mt-1" />
            )}
          </div>
        </Card>

        {/* Card 3: Nearest Storage */}
        <Card className="p-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
            <Wheat className="h-6 w-6" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {t("dashboard.nearest_storage", "Nearest Storage")}
            </p>
            {nearestStorage ? (
              <>
                <p className="text-sm font-bold truncate">{nearestStorage.name}</p>
                <p className="text-xs text-amber-600 font-medium mt-0.5">
                  {t("dashboard.storage_dist", "{{dist}} km away ({{count}} total)", {
                    dist: nearestStorage.distance_km,
                    count: storageCount,
                  })}
                </p>
              </>
            ) : (
              <Skeleton className="h-6 w-24 mt-1" />
            )}
          </div>
        </Card>

        {/* Card 4: Scheme of Day */}
        <Card className="p-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-purple-500/10 text-purple-500">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {t("dashboard.scheme_of_day", "Scheme of the Day")}
            </p>
            {schemeOfDay ? (
              <>
                <p className="text-sm font-bold truncate">{t(`schemes.${schemeOfDay.id}.name`)}</p>
                <a
                  href={schemeOfDay.apply_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-purple-500 hover:underline mt-0.5 block truncate"
                >
                  {t(`schemes.${schemeOfDay.id}.benefit`)}
                </a>
              </>
            ) : (
              <Skeleton className="h-6 w-24 mt-1" />
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("dashboard.price_trend_title", "Price trend (illustrative)")}
              </p>
              <h3 className="mt-1 text-xl font-semibold">
                {latest
                  ? `${latest.crop} — ₹${latest.price.today}/qtl → ₹${latest.price.after_15_days}/qtl`
                  : t("dashboard.run_analysis_forecasts", "Run an analysis to see forecasts")}
              </h3>
            </div>
            {latest && <RiskBadge risk={latest.spoilage.risk_level} />}
          </div>
          <div className="mt-4 h-56">
            {latest ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    width={50}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }}
                    formatter={(v: number) => [`₹${v}/qtl`, "Price"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    fill="url(#g1)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {t("dashboard.no_price_data", "No price trend data")}
                  </p>
                  <p className="mt-1 max-w-xs text-xs">
                    {t(
                      "dashboard.run_analysis_unlock",
                      "Run a price or shelf-life analysis to unlock AI-powered market forecasts.",
                    )}
                  </p>
                </div>
                <Button asChild className="gradient-primary mt-2 shadow-card" size="sm">
                  <Link to="/dashboard/new-analysis">
                    <Sparkles className="mr-2 h-4 w-4" />{" "}
                    {t("dashboard.start_analysis", "Start analysis")}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {t("dashboard.recent_analyses", "Recent analyses")}
            </h3>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/history">{t("dashboard.view_all", "View all")}</Link>
            </Button>
          </div>
          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (history?.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t("dashboard.no_analyses_yet", "No analyses yet.")}{" "}
              <Link to="/dashboard/new-analysis" className="text-primary underline">
                {t("dashboard.run_your_first", "Run your first")}
              </Link>
              .
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {history!.slice(0, 5).map((h) => (
                <Link
                  key={h.id}
                  to={`/dashboard/result/${h.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {h.crop} · {h.quantity_kg} kg
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <RiskBadge risk={h.spoilage.risk_level} className="hidden sm:inline-flex" />
                  <span className="hidden text-sm font-medium sm:inline">
                    {h.recommendation.action}
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    {formatINR(h.recommendation.expected_profit)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
