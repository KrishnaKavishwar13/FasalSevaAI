import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analysisService, interpolateDailyPrices } from "@/services/analysisService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/RiskBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/utils/format";
import { ArrowUpRight, ArrowDownRight, ArrowRight, Timer, LineChart as LineIcon, Warehouse, CloudSun, Sparkles, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Area, AreaChart, BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function Result() {
  const { id } = useParams();
  const [lang, setLang] = useState<'hi' | 'en'>('hi');
  const { data, isLoading } = useQuery({ queryKey: ["analysis", id], queryFn: () => analysisService.getById(id!), enabled: !!id });

  if (isLoading) return <div className="mx-auto max-w-5xl space-y-4"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>;
  if (!data) return (
    <div className="mx-auto max-w-md text-center py-16">
      <p className="text-muted-foreground">Analysis not found.</p>
      <Button asChild className="mt-4"><Link to="/dashboard/new-analysis">Run one</Link></Button>
    </div>
  );

  const chart = interpolateDailyPrices(data.price.today, data.price.after_15_days);
  const TrendIcon = data.price.trend === "Increasing" ? ArrowUpRight : data.price.trend === "Decreasing" ? ArrowDownRight : ArrowRight;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3"><Link to="/dashboard"><ChevronLeft className="mr-1 h-4 w-4" /> Back</Link></Button>
          <h1 className="text-3xl font-bold tracking-tight">{data.crop} · {data.quantity_kg} kg</h1>
          <p className="mt-1 text-sm text-muted-foreground">Analyzed {new Date(data.created_at).toLocaleString("en-IN")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}>
          {lang === 'hi' ? 'Switch to English' : 'हिंदी में देखें'}
        </Button>
      </div>

      {/* Primary recommendation */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden border-primary/30">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Recommendation
              </span>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{data.recommendation.action}
                {data.recommendation.duration_days > 0 && <span className="text-muted-foreground"> · {data.recommendation.duration_days} days</span>}
              </h2>
              <div className="mt-5 p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 relative">
                <div className="absolute top-5 left-5">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                </div>
                <div className="pl-9">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/70 dark:text-amber-500/70 mb-1.5">
                    {lang === 'hi' ? 'AI स्पष्टीकरण' : 'AI Explanatory Note'}
                  </p>
                  <p className="text-sm font-medium leading-relaxed text-foreground/90">
                    {data.recommendation.reason}
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <Stat label="Expected profit" value={formatINR(data.recommendation.expected_profit)} tone="primary" />
                <Stat label="Shelf life" value={`${data.spoilage.days_remaining} days`} />
                <Stat label="Confidence" value={`${data.recommendation.confidence}%`} />
              </div>
            </div>
            <ConfidenceRing pct={data.recommendation.confidence} />
          </div>
        </Card>
      </motion.div>

      {/* Detail grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground"><Timer className="h-4 w-4" /> Shelf life</span>
            <RiskBadge risk={data.spoilage.risk_level} />
          </div>
          <p className="mt-3 text-3xl font-bold">{data.spoilage.days_remaining} days</p>
          <p className="mt-1 text-xs text-muted-foreground">Remaining safe storage</p>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground"><LineIcon className="h-4 w-4" /> Market trend</span>
            <span className={`flex items-center gap-1 text-sm font-semibold ${data.price.trend === "Increasing" ? "text-success" : data.price.trend === "Decreasing" ? "text-destructive" : "text-muted-foreground"}`}>
              <TrendIcon className="h-4 w-4" /> {data.price.trend}
            </span>
          </div>
          <div className="mt-3 flex items-end gap-6">
            <div><p className="text-xs text-muted-foreground">Today</p><p className="text-2xl font-bold">₹{data.price.today}<span className="text-sm font-medium text-muted-foreground">/qtl</span></p></div>
            <div><p className="text-xs text-muted-foreground">In 15 days</p><p className="text-2xl font-bold">₹{data.price.after_15_days}<span className="text-sm font-medium text-muted-foreground">/qtl</span></p></div>
          </div>
          <div className="mt-4 h-32">
            <ResponsiveContainer><AreaChart data={chart}>
              <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="day" hide /><YAxis hide />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} formatter={(v: number) => [`₹${v}/qtl`, "Price"]} />
              <Area type="monotone" dataKey="price" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#rg)" />
            </AreaChart></ResponsiveContainer>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Curve is interpolated between today and day-15 forecast for visualization.</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground"><Warehouse className="h-4 w-4" /> Storage</span>
          </div>
          <p className="mt-3 text-lg font-semibold">Malwa Cold Chain</p>
          <p className="text-xs text-muted-foreground">3.2 km · ₹0.18/kg/day</p>
          <Button asChild variant="link" className="mt-3 h-auto p-0"><Link to="/dashboard/cold-storage">View on map <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground"><CloudSun className="h-4 w-4" /> Weather</span>
          </div>
          <p className="mt-3 text-sm">Warm and humid — perishables should be moved to controlled storage within 24 hours.</p>
        </Card>

        {data.bestDay && (
          <Card className="p-6 lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              📅 Best Day to Sell
            </p>
            <p className="text-xl font-bold mb-4">
              Day {data.bestDay.best_selling_day} gives maximum profit of
              ₹{data.bestDay.best_profit.toLocaleString()}
            </p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.bestDay.daily_breakdown}>
                  <XAxis dataKey="day" tickFormatter={(d) => `D${d}`} tick={{ fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Net Profit']}
                    contentStyle={{ borderRadius: 12, border: 'none' }}
                  />
                  <Bar dataKey="net_profit" radius={[6,6,0,0]}>
                    {data.bestDay.daily_breakdown.map((entry: any, i: number) => (
                      <Cell
                        key={i}
                        fill={i + 1 === data.bestDay!.best_selling_day
                          ? 'var(--color-primary)'
                          : '#E5E7EB'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {data.govt_schemes && data.govt_schemes.length > 0 && (
        <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            📋 {lang === 'hi' ? 'आपके लिए सरकारी योजनाएँ' : 'Government Schemes for You'}
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {data.govt_schemes.map((scheme: any, i: number) => (
              <div key={i} className="rounded-2xl p-4 border border-border bg-muted/30">
                <p className="font-semibold text-sm">
                  {lang === 'hi' ? scheme.hindi_name : scheme.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {lang === 'hi' ? scheme.hindi_benefit : scheme.benefit}
                </p>
                <a href={scheme.apply_url}
                  target="_blank" rel="noreferrer"
                  className="text-xs font-semibold mt-2 inline-block text-primary hover:underline">
                  {lang === 'hi' ? 'आवेदन करें →' : 'Apply Now →'}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky action bar */}
      <div className="sticky bottom-4 z-20 flex flex-wrap gap-2 rounded-2xl border border-border bg-card/95 p-3 shadow-card-hover backdrop-blur">
        <Button asChild className="gradient-primary text-primary-foreground"><Link to={`/dashboard/profit/${data.id}`}>Profit simulator</Link></Button>
        <Button asChild variant="outline"><Link to="/dashboard/cold-storage">Find storage</Link></Button>
        <Button variant="ghost" onClick={() => { /* already in history */ }}>Save to history</Button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "primary" }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone === "primary" ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

function ConfidenceRing({ pct }: { pct: number }) {
  const r = 42, c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  return (
    <div className="relative mx-auto grid place-items-center">
      <svg width={120} height={120} className="-rotate-90">
        <circle cx={60} cy={60} r={r} stroke="var(--color-muted)" strokeWidth={10} fill="none" />
        <circle cx={60} cy={60} r={r} stroke="var(--color-primary)" strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold">{pct}%</p>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Confidence</p>
      </div>
    </div>
  );
}
