import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Cloud, Droplets, Thermometer, TrendingUp, Sparkles, Wheat, MapPin, Search } from "lucide-react";
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

const GOVT_SCHEMES = [
  { hindi_name: "पीएम किसान सम्मान निधि", hindi_benefit: "₹6,000 प्रति वर्ष सीधे बैंक खाते में", apply_url: "#" },
  { hindi_name: "राष्ट्रीय कृषि विकास योजना", hindi_benefit: "कृषि इंफ्रास्ट्रक्चर के लिए सब्सिडी", apply_url: "#" },
  { hindi_name: "प्रधानमंत्री फसल बीमा योजना", hindi_benefit: "फसल नुकसान पर बीमा कवरेज", apply_url: "#" },
  { hindi_name: "पीएम कृषि सिंचाई योजना", hindi_benefit: "सिंचाई उपकरणों पर भारी छूट", apply_url: "#" },
  { hindi_name: "राष्ट्रीय बागवानी मिशन", hindi_benefit: "बागवानी फसलों पर सब्सिडी", apply_url: "#" },
  { hindi_name: "ई-नाम (e-NAM)", hindi_benefit: "देशभर की मंडियों में फसल बेचने की सुविधा", apply_url: "#" },
  { hindi_name: "कृषि अवसंरचना कोष (AIF)", hindi_benefit: "कोल्ड स्टोरेज/वेयरहाउस के लिए सस्ता लोन", apply_url: "#" },
  { hindi_name: "किसान क्रेडिट कार्ड (KCC)", hindi_benefit: "कम ब्याज दर पर कृषि ऋण", apply_url: "#" },
];

export function DashboardHome() {
  const { user, setUser } = useAuth();
  
  // Onboarding State
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [lat, setLat] = useState<number>();
  const [lng, setLng] = useState<number>();
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedState, setSelectedState] = useState("Madhya Pradesh");

  // Dashboard Data State
  const [weather, setWeather] = useState<{temp: number, humidity: number, rain: number} | null>(null);
  const [nearestStorage, setNearestStorage] = useState<any>(null);
  const [storageCount, setStorageCount] = useState(0);
  const [todayPrice, setTodayPrice] = useState<number | null>(null);
  const [schemeOfDay, setSchemeOfDay] = useState<any>(null);

  const { data: history, isLoading: historyLoading } = useQuery({ queryKey: ["history"], queryFn: () => analysisService.getHistory() });
  const latest = history?.[0];
  const chartData = latest ? interpolateDailyPrices(latest.price.today, latest.price.after_15_days) : [];

  const captureGPS = async () => {
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
      setOnboardingStep(2);
    } catch {
      // Fallback
      setLat(22.7196);
      setLng(75.8577);
      setOnboardingStep(2);
      toast.error("GPS blocked. Using default location (Indore).");
    }
  };

  const finishOnboarding = () => {
    if (!user) return;
    const updatedUser: AuthUser = {
      ...user,
      onboarded: true,
      mainCrop: selectedCrop,
      state: selectedState,
      lat, lng
    };
    authService.updateCurrentUser(updatedUser);
    setUser(updatedUser);
    toast.success("Profile saved!");
  };

  useEffect(() => {
    if (user?.onboarded) {
      loadDashboardData();
    }
  }, [user?.onboarded]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    // 1. GPS -> Weather
    let clat = user.lat || 22.7196;
    let clng = user.lng || 75.8577;
    
    try {
      const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${clat}&longitude=${clng}&current=temperature_2m,relative_humidity_2m,precipitation&forecast_days=1`).then(r => r.json());
      setWeather({
        temp: w.current.temperature_2m,
        humidity: w.current.relative_humidity_2m,
        rain: w.current.precipitation
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
              <motion.div key="step1" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">नमस्ते {user.name.split(" ")[0]} जी! 🌾</h2>
                  <p className="mt-2 text-muted-foreground text-sm">FasalSeva आपको सबसे सही सलाह देगा।</p>
                  <p className="mt-1 text-muted-foreground text-sm">शुरुआत करने के लिए, अपनी लोकेशन दें:</p>
                </div>
                <Button onClick={captureGPS} className="w-full h-12 text-lg"><MapPin className="mr-2" /> मेरी लोकेशन दें</Button>
              </motion.div>
            )}

            {onboardingStep === 2 && (
              <motion.div key="step2" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">आपकी मुख्य फसल क्या है?</h2>
                  <p className="mt-2 text-muted-foreground text-sm">हम आपको इसी फसल के बाज़ार भाव दिखाएंगे।</p>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 pb-2">
                  {CROPS.map(c => (
                    <button key={c.name} onClick={() => { setSelectedCrop(c.name); setOnboardingStep(3); }}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2 hover:bg-muted transition ${selectedCrop===c.name?'border-primary bg-primary/5':''}`}>
                      <span className="text-xl">{c.emoji}</span> <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {onboardingStep === 3 && (
              <motion.div key="step3" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">आप किस राज्य में हैं?</h2>
                  <p className="mt-2 text-muted-foreground text-sm">बाज़ार भाव राज्य पर निर्भर करते हैं।</p>
                </div>
                <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="w-full p-3 rounded-xl border bg-background">
                  <option>Madhya Pradesh</option>
                  <option>Maharashtra</option>
                  <option>Gujarat</option>
                  <option>Uttar Pradesh</option>
                </select>
                <Button onClick={finishOnboarding} className="w-full h-12 text-lg">डैशबोर्ड पर जाएं <ArrowRight className="ml-2" /></Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Namaste, {user?.name?.split(" ")[0] ?? "Farmer"} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's a quick look at your farm today.</p>
        </div>
        <Button asChild className="gradient-primary text-primary-foreground">
          <Link to="/dashboard/new-analysis">New analysis <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Weather */}
        <Card className="p-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/10 text-blue-500"><Cloud className="h-6 w-6" /></div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Aaj ka Mausam</p>
            {weather ? (
              <>
                <p className="text-lg font-bold">{weather.temp}°C | {weather.humidity}% Nami</p>
                {weather.rain > 0 && <p className="text-xs text-blue-500 font-medium mt-0.5">🌧️ Baarish ki sambhavna</p>}
              </>
            ) : <Skeleton className="h-6 w-24 mt-1" />}
          </div>
        </Card>

        {/* Card 2: Today's Price */}
        <Card className="p-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-green-500/10 text-green-500"><TrendingUp className="h-6 w-6" /></div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{user?.mainCrop || 'Crop'} ka Bhav</p>
            {todayPrice !== null ? (
              <>
                <p className="text-lg font-bold text-green-600">₹{todayPrice}/q</p>
                <p className="text-xs text-muted-foreground mt-0.5">Agmarknet se live</p>
              </>
            ) : <Skeleton className="h-6 w-24 mt-1" />}
          </div>
        </Card>

        {/* Card 3: Nearest Storage */}
        <Card className="p-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500/10 text-amber-500"><Wheat className="h-6 w-6" /></div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Nazdiki Storage</p>
            {nearestStorage ? (
              <>
                <p className="text-sm font-bold truncate">{nearestStorage.name}</p>
                <p className="text-xs text-amber-600 font-medium mt-0.5">{nearestStorage.distance_km} km door ({storageCount} total)</p>
              </>
            ) : <Skeleton className="h-6 w-24 mt-1" />}
          </div>
        </Card>

        {/* Card 4: Scheme of Day */}
        <Card className="p-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-purple-500/10 text-purple-500"><Sparkles className="h-6 w-6" /></div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Aaj ki Yojana</p>
            {schemeOfDay ? (
              <>
                <p className="text-sm font-bold truncate">{schemeOfDay.hindi_name}</p>
                <a href={schemeOfDay.apply_url} className="text-xs text-purple-500 hover:underline mt-0.5 block truncate">{schemeOfDay.hindi_benefit}</a>
              </>
            ) : <Skeleton className="h-6 w-24 mt-1" />}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Price trend (illustrative)</p>
              <h3 className="mt-1 text-xl font-semibold">
                {latest ? `${latest.crop} — ₹${latest.price.today}/qtl → ₹${latest.price.after_15_days}/qtl` : "Run an analysis to see forecasts"}
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
                  <YAxis tickLine={false} axisLine={false} fontSize={11} width={50} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} formatter={(v: number) => [`₹${v}/qtl`, "Price"]} />
                  <Area type="monotone" dataKey="price" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">No price trend data</p>
                  <p className="mt-1 max-w-xs text-xs">Run a price or shelf-life analysis to unlock AI-powered market forecasts.</p>
                </div>
                <Button asChild className="gradient-primary mt-2 shadow-card" size="sm">
                  <Link to="/dashboard/new-analysis">
                    <Sparkles className="mr-2 h-4 w-4" /> Start analysis
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent analyses</h3>
            <Button asChild variant="ghost" size="sm"><Link to="/dashboard/history">View all</Link></Button>
          </div>
          {historyLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (history?.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No analyses yet. <Link to="/dashboard/new-analysis" className="text-primary underline">Run your first</Link>.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {history!.slice(0, 5).map((h) => (
                <Link key={h.id} to={`/dashboard/result/${h.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{h.crop} · {h.quantity_kg} kg</p>
                    <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("en-IN")}</p>
                  </div>
                  <RiskBadge risk={h.spoilage.risk_level} className="hidden sm:inline-flex" />
                  <span className="hidden text-sm font-medium sm:inline">{h.recommendation.action}</span>
                  <span className="text-sm font-semibold text-primary">{formatINR(h.recommendation.expected_profit)}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
