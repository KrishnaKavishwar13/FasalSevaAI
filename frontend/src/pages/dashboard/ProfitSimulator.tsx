import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { analysisService } from "@/services/analysisService";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/utils/format";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function ProfitSimulator() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ["analysis", id], queryFn: () => analysisService.getById(id!), enabled: !!id });

  if (isLoading || !data) return <div className="mx-auto max-w-5xl"><Skeleton className="h-96" /></div>;

  const opts = [
    { key: "sell_now", label: t("profit.sell_today", "Sell Today"),              ...data.profit_options.sell_now },
    { key: "store",    label: t("profit.store_crop", "Store Crop"),              ...data.profit_options.store },
    { key: "process",  label: t("profit.sell_to_processing", "Sell to Processing"),      ...data.profit_options.process },
  ];
  const best = opts.reduce((a, b) => a.net_profit > b.net_profit ? a : b);

  const chartData = opts.map((o) => ({ name: o.label.split(" ")[0], profit: o.net_profit, fill: o.key === best.key ? "var(--color-primary)" : "var(--color-muted-foreground)" }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3"><Link to={`/dashboard/result/${id}`}><ChevronLeft className="mr-1 h-4 w-4" /> {t("profit.back_to_result", "Back to result")}</Link></Button>
        <h1 className="text-3xl font-bold tracking-tight">{t("profit.title", "Profit simulator")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("profit.subtitle", "Side-by-side comparison for {{crop}} · {{quantity}} kg.", { crop: data.crop, quantity: data.quantity_kg })}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {opts.map((o) => (
          <Card key={o.key} className={cn(
            "relative p-6 transition-all",
            o.key === best.key ? "border-primary shadow-card-hover md:scale-[1.02]" : "opacity-90",
          )}>
            {o.key === best.key && (
              <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                <CheckCircle2 className="h-3 w-3" /> {t("profit.recommended", "Recommended")}
              </span>
            )}
            <h3 className="text-lg font-semibold">{o.label}</h3>
            {o.key === "store" && data.spoilage.storage_viable === false ? (
              <div className="text-xs font-semibold text-red-500 mt-4 mb-2">
                  {t("profit.spoil_fast_warning", "⚠️ Crop spoils too fast — storage not recommended")}
              </div>
            ) : (
              <dl className="mt-4 space-y-2 text-sm">
                <Row label={t("profit.revenue", "Revenue")} v={o.revenue} />
                <Row label={t("profit.storage_cost", "Storage cost")} v={-o.storage_cost} />
                <Row label={t("profit.transport_cost", "Transport cost")} v={-o.transport_cost} />
                <div className="mt-3 border-t border-border/60 pt-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("profit.net_profit", "Net profit")}</p>
                  <p className={cn("mt-1 text-2xl font-bold", o.key === best.key ? "text-primary" : "")}>{formatINR(o.net_profit)}</p>
                </div>
              </dl>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("profit.net_profit_comparison", "Net profit comparison")}</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} width={80} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} formatter={(v: number) => [formatINR(v), t("profit.net_profit", "Net profit")]} />
              <Bar dataKey="profit" radius={[10, 10, 0, 0]}>
                {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium", v < 0 && "text-destructive")}>{v < 0 ? "−" : ""}{formatINR(Math.abs(v))}</dd>
    </div>
  );
}
