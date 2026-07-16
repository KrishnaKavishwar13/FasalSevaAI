import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Thermometer, Droplets, CloudRain, ShieldAlert, Navigation, Home, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/RiskBadge";
import { apiClient } from "@/api/client";
import { motion } from "framer-motion";

export function Weather() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [impact, setImpact] = useState<any>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        let lat = user?.lat || 22.7196;
        let lng = user?.lng || 75.8577;

        if (!user?.lat) {
          try {
            const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          } catch {
            toast.error("GPS blocked. Using default location (Indore).");
          }
        }

        const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation&forecast_days=1`).then(r => r.json());
        
        const temp = w.current.temperature_2m;
        const hum = w.current.relative_humidity_2m;
        const rain = w.current.precipitation;
        
        const storageTemp = Math.round((temp + 5) * 10) / 10;
        const storageHum = Math.min(100, Math.round(hum + 8));

        setWeather({ temp, hum, rain, storageTemp, storageHum });

        if (user?.mainCrop) {
          const res = await apiClient.post('/predict/spoilage', {
            crop: user.mainCrop,
            temp: storageTemp,
            humidity: storageHum,
            days_stored: 0
          });
          setImpact(res.data);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load weather data.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeather();
  }, [user]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Weather & Storage Conditions</h1>
        <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1"><Navigation className="h-4 w-4" /> Live from GPS coordinates</p>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : weather ? (
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Outdoor Weather */}
          <Card className="p-6 relative overflow-hidden bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-200/50 dark:bg-sky-900/50 rounded-bl-full blur-2xl" />
            <h2 className="text-xl font-bold flex items-center gap-2 text-sky-900 dark:text-sky-300"><CloudRain className="h-6 w-6" /> Outdoor Weather</h2>
            <p className="text-sm text-sky-700/80 dark:text-sky-400/80 mb-6">Current conditions at your farm</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/60 dark:bg-slate-900/60 p-4 rounded-2xl flex flex-col items-center justify-center border border-sky-100 dark:border-sky-800">
                <Thermometer className="h-6 w-6 text-sky-600 dark:text-sky-400 mb-2" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Temp</p>
                <p className="text-2xl font-bold text-sky-950 dark:text-sky-100">{weather.temp}°C</p>
              </div>
              <div className="bg-white/60 dark:bg-slate-900/60 p-4 rounded-2xl flex flex-col items-center justify-center border border-sky-100 dark:border-sky-800">
                <Droplets className="h-6 w-6 text-sky-600 dark:text-sky-400 mb-2" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Humidity</p>
                <p className="text-2xl font-bold text-sky-950 dark:text-sky-100">{weather.hum}%</p>
              </div>
            </div>
          </Card>

          {/* Indoor Storage */}
          <Card className="p-6 relative overflow-hidden bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/50 dark:bg-amber-900/50 rounded-bl-full blur-2xl" />
            <h2 className="text-xl font-bold flex items-center gap-2 text-amber-900 dark:text-amber-400"><Home className="h-6 w-6" /> Storage Conditions</h2>
            <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mb-6">Estimated indoor ambient conditions</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/60 dark:bg-slate-900/60 p-4 rounded-2xl flex flex-col items-center justify-center border border-amber-100 dark:border-amber-800">
                <Thermometer className="h-6 w-6 text-amber-600 dark:text-amber-400 mb-2" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Temp (+5°C)</p>
                <p className="text-2xl font-bold text-amber-950 dark:text-amber-100">{weather.storageTemp}°C</p>
              </div>
              <div className="bg-white/60 dark:bg-slate-900/60 p-4 rounded-2xl flex flex-col items-center justify-center border border-amber-100 dark:border-amber-800">
                <Droplets className="h-6 w-6 text-amber-600 dark:text-amber-400 mb-2" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Humidity (+8%)</p>
                <p className="text-2xl font-bold text-amber-950 dark:text-amber-100">{weather.storageHum}%</p>
              </div>
            </div>
          </Card>

        </div>
      ) : null}

      {/* Crop Impact */}
      {user?.mainCrop && weather && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-6 mt-6 border-emerald-200 dark:border-emerald-900/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Target className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">How this affects your {user.mainCrop}</h3>
                <p className="text-sm text-muted-foreground">Based on the current storage conditions calculated above.</p>
              </div>
            </div>

            {impact ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-muted/40 flex items-center justify-between">
                  <span className="text-sm font-medium">Expected Safe Shelf Life</span>
                  <span className="text-xl font-bold">{impact.days_remaining} days</span>
                </div>
                <div className="p-4 rounded-2xl bg-muted/40 flex items-center justify-between">
                  <span className="text-sm font-medium">Current Spoilage Risk</span>
                  <RiskBadge risk={impact.risk_level} />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted/30 rounded-2xl">
                <ShieldAlert className="h-4 w-4" /> Spoilage model analysis failed to load.
              </div>
            )}
          </Card>
        </motion.div>
      )}

    </div>
  );
}
