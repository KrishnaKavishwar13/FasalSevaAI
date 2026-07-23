import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storageService, setFarmerLocation } from "@/services/storageService";
import type { CropName, StorageFacility } from "@/types";
import { CROPS } from "@/constants/data";
import { Link } from "react-router-dom";

const MapComponent = lazy(() => import("@/components/MapComponent"));
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Star,
  MapPin,
  IndianRupee,
  Package,
  ShieldCheck,
  ArrowRight,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export function ColdStorage() {
  const { t } = useTranslation();
  const [crop, setCrop] = useState<CropName | "all">("all");
  const [maxDistance, setMaxDistance] = useState(20);
  const [locationReady, setLocationReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Get farmer GPS on mount → update storageService location → trigger query
  useEffect(() => {
    setIsMounted(true);
    if (!navigator.geolocation) {
      setLocationReady(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFarmerLocation(pos.coords.latitude, pos.coords.longitude);
        setLocationReady(true);
      },
      () => {
        // GPS denied — use default Indore location
        setLocationReady(true);
      },
      { timeout: 5000 },
    );
  }, []);

  const { data: facilities, isLoading } = useQuery({
    queryKey: ["facilities", crop, maxDistance, locationReady],
    queryFn: () =>
      storageService.getFacilities({ crop: crop === "all" ? undefined : crop, maxDistance: 500 }),
    enabled: locationReady,
  });

  const nearbyStorages = useMemo(() => {
    if (!facilities) return [];
    return facilities
      .filter((f) => f.distance_km <= maxDistance)
      .sort((a, b) => a.distance_km - b.distance_km);
  }, [facilities, maxDistance]);

  return (
    <div className="mx-auto max-w-7xl space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("storage.title", "Cold storage near you")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("storage.subtitle", "Live availability, crop compatibility, and 1-click booking.")}
        </p>
      </div>

      {/* SECTION 1: Nearby Storages */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Building2 className="text-amber-500" />{" "}
            {t("storage.nearby", "Aapke Paas ke Cold Storage")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("storage.nearby_desc", "GPS se {{distance}}km ke andar", { distance: maxDistance })}
          </p>
        </div>

        <Card className="p-4 sm:p-6 bg-muted/30">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>{t("storage.crop_compatibility", "Crop compatibility")}</Label>
              <Select value={crop} onValueChange={(v) => setCrop(v as CropName | "all")}>
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("storage.any_crop", "Any crop")}</SelectItem>
                  {CROPS.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.emoji} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>
                {t("storage.search_radius", "Search radius: {{distance}} km", {
                  distance: maxDistance,
                })}
              </Label>
              <Slider
                className="mt-3"
                min={2}
                max={100}
                step={1}
                value={[maxDistance]}
                onValueChange={(v) => setMaxDistance(v[0])}
              />
            </div>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="relative z-0 h-[420px] overflow-hidden lg:col-span-3">
            {isMounted && (
              <Suspense fallback={<Skeleton className="h-full w-full" />}>
                <MapComponent facilities={nearbyStorages || []} />
              </Suspense>
            )}
          </Card>
          <div className="space-y-3 lg:col-span-2 max-h-[420px] overflow-y-auto pr-2">
            {isLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)
            ) : nearbyStorages.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                {t(
                  "storage.no_facilities",
                  "No facilities match your filters within {{distance}}km.",
                  { distance: maxDistance },
                )}
              </Card>
            ) : (
              nearbyStorages.map((f) => <FacilityCard key={f.id} f={f} t={t} />)
            )}
          </div>
        </div>
      </section>

      {/* SECTION 2: All Verified Partners */}
      <section className="space-y-6 pt-6 border-t">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            {t("storage.verified_partners", "✅ Verified Partner Storages")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "storage.verified_desc",
              "FasalSeva ke saath registered trusted cold storages across MP",
            )}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? [1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-64" />)
            : facilities?.map((f) => <FacilityCard key={f.id} f={f} t={t} />)}
        </div>
      </section>

      {/* SECTION 3: Storage Owner CTA */}
      <section className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-8 border border-emerald-100 dark:border-emerald-900/30">
        <div className="max-w-3xl">
          <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-400">
            {t("storage.owner_cta_title", "🏭 Cold Storage Owner Hain?")}
          </h3>
          <p className="mt-2 text-emerald-800/80 dark:text-emerald-400/80 text-lg">
            {t(
              "storage.owner_cta_desc",
              "FasalSeva partner banein — lakho farmers tak pahunchein aur apni storage efficiency badhayein.",
            )}
          </p>
          <Button
            asChild
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            size="lg"
          >
            <Link to="/storage/login">
              {t("storage.portal_link", "Cold Storage Portal")}{" "}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function FacilityCard({ f, t }: { f: StorageFacility; t: any }) {
  return (
    <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
      <img src={f.image} alt="" className="h-32 w-full object-cover" loading="lazy" />
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold">{f.name}</p>
            <p className="text-xs text-muted-foreground">
              <MapPin className="mr-1 inline h-3 w-3" />
              {f.distance_km} km · {f.address}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent-foreground">
            <Star className="h-3 w-3 fill-current" /> {f.rating}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <Package className="mr-1 inline h-3.5 w-3.5 text-muted-foreground" />
            {f.available_tons}/{f.capacity_tons} {t("storage.tons_free", "tons free")}
          </div>
          <div>
            <IndianRupee className="mr-1 inline h-3.5 w-3.5 text-muted-foreground" />₹
            {f.cost_per_kg_day}/kg/day
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {f.compatible_crops.slice(0, 4).map((c) => (
            <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
              {c}
            </span>
          ))}
          {f.compatible_crops.length > 4 && (
            <span className="text-[10px] text-muted-foreground">
              +{f.compatible_crops.length - 4}
            </span>
          )}
        </div>
        <div className="mt-auto pt-4 flex gap-2">
          <DetailsDialog f={f} t={t} />
          <BookDialog f={f} t={t} />
        </div>
      </div>
    </Card>
  );
}

function DetailsDialog({ f, t }: { f: StorageFacility; t: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1">
          {t("storage.details", "Details")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{f.name}</DialogTitle>
        </DialogHeader>
        <img src={f.image} alt="" className="h-40 w-full rounded-lg object-cover" />
        <div className="grid gap-2 text-sm">
          <p>
            <MapPin className="mr-1 inline h-4 w-4 text-muted-foreground" />
            {f.address}
          </p>
          <p>
            <Package className="mr-1 inline h-4 w-4 text-muted-foreground" />
            {f.available_tons}{" "}
            {t("storage.available_capacity", "of {{capacity}} tons available", {
              capacity: f.capacity_tons,
            })}
          </p>
          <p>
            <IndianRupee className="mr-1 inline h-4 w-4 text-muted-foreground" />₹
            {f.cost_per_kg_day} {t("storage.per_kg_day", "per kg per day")}
          </p>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
              {t("storage.amenities", "Amenities")}
            </p>
            <div className="flex flex-wrap gap-1">
              {f.amenities.map((a) => (
                <span key={a} className="rounded-full bg-muted px-2 py-1 text-xs">
                  <ShieldCheck className="mr-1 inline h-3 w-3" />
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BookDialog({ f, t }: { f: StorageFacility; t: any }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(100);
  const [days, setDays] = useState(10);
  const [crop, setCrop] = useState<CropName>(f.compatible_crops[0]);

  const mutation = useMutation({
    mutationFn: () =>
      storageService.bookStorage({
        facility_id: f.id,
        crop,
        quantity_kg: qty,
        duration_days: days,
      }),
    onSuccess: (b) => {
      toast.success(`${t("storage.booking_confirmed", "Booking confirmed")} · ${b.facility_name}`, {
        description: `${t("storage.estimated_cost", "Estimated cost")} ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(b.estimated_cost)}`,
      });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      setOpen(false);
    },
  });
  const estimate = useMemo(
    () => Math.round(qty * f.cost_per_kg_day * days),
    [qty, days, f.cost_per_kg_day],
  );
  const overCap = f.available_tons * 1000 < qty;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="flex-1 gradient-primary text-primary-foreground"
          disabled={f.available_tons === 0}
        >
          {f.available_tons === 0 ? t("storage.full", "Full") : t("storage.book", "Book")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("storage.book", "Book")} {f.name}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label>{t("analysis.crop_label", "Crop")}</Label>
            <Select value={crop} onValueChange={(v) => setCrop(v as CropName)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {f.compatible_crops.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("storage.quantity", "Quantity (kg)")}</Label>
              <Input
                type="number"
                className="mt-1"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>{t("storage.duration", "Duration (days)")}</Label>
              <Input
                type="number"
                className="mt-1"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              />
            </div>
          </div>
          {overCap && (
            <p className="text-xs text-destructive">
              {t("storage.quantity_exceeds", "Quantity exceeds available capacity.")}
            </p>
          )}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p>
              {t("storage.estimated_cost", "Estimated cost")}{" "}
              <b className="float-right">
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(estimate)}
              </b>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || overCap}
            className="gradient-primary text-primary-foreground"
          >
            {mutation.isPending
              ? t("storage.booking", "Booking…")
              : t("storage.confirm_booking", "Confirm booking")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
