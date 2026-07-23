import type { RiskLevel } from "@/types";
import { cn } from "@/lib/utils";
import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";

// Normalize backend synonyms (Low/Medium/High) to the canonical Green/Yellow/Red.
export function normalizeRisk(input: string): RiskLevel {
  const v = input.toLowerCase();
  if (v === "green" || v === "low") return "Green";
  if (v === "yellow" || v === "medium" || v === "moderate") return "Yellow";
  return "Red";
}

const map: Record<RiskLevel, { label: string; cls: string; Icon: typeof ShieldCheck }> = {
  Green: {
    label: "Low risk",
    cls: "bg-success/15 text-success border-success/30",
    Icon: ShieldCheck,
  },
  Yellow: {
    label: "Moderate risk",
    cls: "bg-warning/15 text-warning border-warning/30",
    Icon: AlertTriangle,
  },
  Red: {
    label: "High risk",
    cls: "bg-destructive/15 text-destructive border-destructive/30",
    Icon: ShieldAlert,
  },
};

export function RiskBadge({
  risk,
  className,
  showIcon = true,
}: {
  risk: RiskLevel | string;
  className?: string;
  showIcon?: boolean;
}) {
  const r = typeof risk === "string" ? normalizeRisk(risk) : risk;
  const cfg = map[r];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        cfg.cls,
        className,
      )}
    >
      {showIcon && <cfg.Icon className="h-3.5 w-3.5" />} {cfg.label}
    </span>
  );
}
