import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { marketService, CROP_BASE_PRICE_PER_QUINTAL } from "@/services/marketService";
import { CROPS, STATES, STATE_DISTRICTS } from "@/constants/data";
import type { CropName } from "@/types";
import { Area, AreaChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, ArrowRight, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/api/client";
import { useTranslation } from "react-i18next";

export function Market() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [crop, setCrop] = useState<CropName>((user?.mainCrop as CropName) || "Tomato");
  const [state, setState] = useState(user?.state || "Madhya Pradesh");
  const [district, setDistrict] = useState("Indore");
  const [price, setPrice] = useState(CROP_BASE_PRICE_PER_QUINTAL[crop as CropName] || 1500);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceNote, setPriceNote] = useState("");

  // Auto-fetch price from Agmarknet
  useEffect(() => {
    if (crop && state) {
      setPriceLoading(true);
      apiClient.get(`/current-price?crop=${crop}&state=${state}`)
        .then(r => {
          if (r.data.found) {
            setPrice(r.data.current_price);
            if (r.data.is_fallback) {
              setPriceNote(t("market.price_fallback", "⚠️ Live price unavailable — using seasonal average. Please verify manually."));
            } else {
              setPriceNote(t("market.live_price", "✅ Live from Agmarknet — {{market}} ({{date}})", { market: r.data.market, date: r.data.date }));
            }
          }
        })
        .finally(() => setPriceLoading(false));
    }
  }, [crop, state]);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["market", crop, state, district, price],
    queryFn: () => marketService.getPriceForecast({
      crop, state, current_price: price,
      month: new Date().getMonth() + 1, week: Math.ceil((new Date().getDate() + 1) / 7),
    }),
  });

  const combined = data ? data.daily.map((d, i) => ({ day: d.day, local: d.price, regional: data.regional_avg[i]?.price })) : [];
  const trend = data ? (data.price_after_15_days > price * 1.03 ? "Increasing" : data.price_after_15_days < price * 0.97 ? "Decreasing" : "Stable") : "Stable";
  const TrendIcon = trend === "Increasing" ? ArrowUpRight : trend === "Decreasing" ? ArrowDownRight : ArrowRight;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("market.title", "Market intelligence")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("market.subtitle", "Live Agmarknet prices + 15-day AI mandi price forecast.")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 md:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><Label>{t("analysis.crop_label", "Crop")}</Label>
              <Select value={crop} onValueChange={(v) => setCrop(v as CropName)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CROPS.filter(c => c.priceModel).map(c => <SelectItem key={c.name} value={c.name}>{c.emoji} {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("analysis.state_label", "State")}</Label>
              <Select value={state} onValueChange={(v) => { setState(v); setDistrict(STATE_DISTRICTS[v][0]); }}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("market.district", "District")}</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STATE_DISTRICTS[state].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="relative"><Label>{t("market.todays_price", "Today's price (₹/qtl)")}</Label>
              <Input type="number" className="mt-1" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
              {priceLoading && <Loader2 className="absolute right-2 top-9 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </div>
          <Button className="mt-6 w-full sm:w-auto gradient-primary text-primary-foreground" onClick={() => refetch()} disabled={isFetching || priceLoading}>
            {isFetching ? t("market.loading", "Loading…") : t("market.update_forecast", "Update forecast")}
          </Button>
        </Card>

        {/* Large Prominent Today's Price Card */}
        <Card className="p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 flex flex-col justify-center">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-2"><MapPin className="h-4 w-4" /> {t("market.mandi", "{{state}} Mandi", { state })}</p>
          <p className="text-4xl font-bold text-green-700 dark:text-green-300 mt-2">₹{price}<span className="text-xl text-green-600/70">{t("market.per_qtl", "/qtl")}</span></p>
          <p className={`text-xs mt-2 ${priceNote.includes('⚠️') ? 'text-amber-600' : 'text-green-600'}`}>{priceNote}</p>
          <div className="mt-4 flex gap-4 text-sm text-green-700 dark:text-green-400">
            <div><span className="opacity-70">{t("market.min", "Min:")}</span> ₹{price - 150}</div>
            <div><span className="opacity-70">{t("market.max", "Max:")}</span> ₹{price + 200}</div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: t("market.day_5", "Day 5 Forecast"), value: data?.daily[5]?.price },
          { label: t("market.day_8", "Day 8 Forecast"), value: data?.daily[8]?.price },
          { label: t("market.day_15", "Day 15 Forecast"), value: data?.price_after_15_days },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">₹{s.value ?? "—"}<span className="text-sm font-medium text-muted-foreground">{t("market.per_qtl", "/qtl")}</span></p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t("market.chart_title", "15-Day Price Forecast")}</h3>
          <span className={cn("flex items-center gap-1 text-sm font-semibold",
            trend === "Increasing" ? "text-green-600" : trend === "Decreasing" ? "text-red-600" : "text-muted-foreground"
          )}><TrendIcon className="h-4 w-4" /> {trend}</span>
        </div>
        <div className="mt-4 h-72">
          <ResponsiveContainer>
            <AreaChart data={data?.daily ?? []}>
              <defs><linearGradient id="mc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} /><stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="day" tickFormatter={(v) => `D${v}`} axisLine={false} tickLine={false} />
              <YAxis width={60} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} formatter={(v: number) => [`₹${v}${t("market.per_qtl", "/qtl")}`, t("market.price", "Price")]} />
              <Area type="monotone" dataKey="price" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#mc)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
