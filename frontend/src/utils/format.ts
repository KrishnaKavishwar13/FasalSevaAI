export const formatINR = (v: number, opts: { compact?: boolean } = {}) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: opts.compact ? "compact" : "standard",
  }).format(v);

export const formatNumber = (v: number) => new Intl.NumberFormat("en-IN").format(v);
