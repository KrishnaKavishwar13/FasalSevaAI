import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Leaf, TrendingUp, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export function NewAnalysis() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("analysis.new_title", "New analysis")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("analysis.new_subtitle", "Choose what you want to know about your crop.")}
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Card 1: Shelf Life */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="group relative h-full flex flex-col overflow-hidden border-border/60 bg-card/90 p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-background to-primary/10" />
            <div className="relative flex flex-col flex-grow">
              <div className="flex items-center justify-between gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/20">
                  <Leaf className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h2 className="mt-5 text-xl font-semibold">
                {t("analysis.shelf_life_title", "Shelf Life")}
              </h2>
              <p className="text-sm font-medium text-primary mt-1">
                {t("analysis.shelf_life_hindi_desc", "फसल कितने दिन सुरक्षित है?")}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground mb-4">
                {t(
                  "analysis.shelf_life_desc",
                  "Know exactly how many days your crop will stay fresh.",
                )}
              </p>

              <div className="mt-auto pt-4 flex flex-wrap items-center justify-between gap-3">
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Link to="/dashboard/new-analysis/spoilage">
                    {t("analysis.start", "Start")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground w-full justify-center mt-2">
                  <BrainCircuit className="h-3 w-3" /> {t("analysis.30_seconds", "30 seconds")}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Card 2: Price Forecast */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="group relative h-full flex flex-col overflow-hidden border-border/60 bg-card/90 p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-background to-primary/10" />
            <div className="relative flex flex-col flex-grow">
              <div className="flex items-center justify-between gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/20">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h2 className="mt-5 text-xl font-semibold">
                {t("analysis.price_forecast_title", "Price Forecast")}
              </h2>
              <p className="text-sm font-medium text-blue-600 mt-1">
                {t("analysis.price_forecast_hindi_desc", "मंडी भाव कब सबसे अच्छा होगा?")}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground mb-4">
                {t("analysis.price_forecast_desc", "See predicted mandi price for next 15 days.")}
              </p>

              <div className="mt-auto pt-4 flex flex-wrap items-center justify-between gap-3">
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Link to="/dashboard/new-analysis/price-prediction">
                    {t("analysis.start", "Start")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground w-full justify-center mt-2">
                  <BrainCircuit className="h-3 w-3" /> {t("analysis.30_seconds", "30 seconds")}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Card 3: Complete Analysis (RECOMMENDED) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="group relative h-full flex flex-col overflow-hidden border-border/60 bg-card/90 p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover ring-2 ring-amber-500">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-background to-primary/10" />
            <div className="relative flex flex-col flex-grow">
              <div className="flex items-center justify-between gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/20">
                  <Target className="h-6 w-6 text-amber-600" />
                </div>
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">
                  {t("analysis.recommended", "RECOMMENDED")}
                </Badge>
              </div>
              <h2 className="mt-5 text-xl font-semibold">
                {t("analysis.complete_title", "Complete Analysis")}
              </h2>
              <p className="text-sm font-medium text-amber-600 mt-1">
                {t("analysis.complete_hindi_desc", "पूरी सलाह एक जगह")}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground mb-4">
                {t(
                  "analysis.complete_desc",
                  "Shelf life + best selling day + cold storage + profit + AI advice.",
                )}
              </p>

              <div className="mt-auto pt-4 flex flex-wrap items-center justify-between gap-3">
                <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                  <Link to="/dashboard/new-analysis/complete">
                    {t("analysis.start_complete_flow", "Start Complete Flow")}{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground w-full justify-center mt-2">
                  <BrainCircuit className="h-3 w-3" /> {t("analysis.2_minutes", "2 minutes")}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
