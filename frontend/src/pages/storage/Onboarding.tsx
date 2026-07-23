import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { storageService } from "@/services/storageService";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Warehouse,
  Camera,
  ShieldCheck,
} from "lucide-react";
import { CROPS } from "@/constants/data";

const STEPS = [
  "Basic Information",
  "Capacity Information",
  "Crop Compatibility",
  "Pricing",
  "Storage Conditions",
  "Upload",
];
const STORAGE_TYPES = ["Cold Storage", "Warehouse", "FPO Storage", "Private Storage"];
const FACILITY_OPTIONS = [
  "Generator",
  "Solar Backup",
  "Insurance",
  "24x7 Security",
  "CCTV",
  "Digital Weighing Machine",
  "Forklift",
  "Loading Dock",
  "Parking",
];

const initialState = {
  storageName: "",
  ownerName: "",
  phone: "",
  email: "",
  storageType: "Cold Storage",
  address: "",
  state: "Madhya Pradesh",
  district: "Indore",
  pincode: "",
  latitude: "22.7196",
  longitude: "75.8577",
  totalCapacityKg: "500000",
  occupiedCapacityKg: "120000",
  availableCapacityKg: "380000",
  maxDailyIntakeKg: "25000",
  maxCapacityPerBookingKg: "10000",
  storageChambers: "6",
  compatibleCrops: [] as string[],
  storageCostPerKgPerDay: "0.18",
  storageCostPerCratePerDay: "4.5",
  minimumBookingDays: "3",
  maximumBookingDays: "21",
  loadingCharges: "0",
  unloadingCharges: "0",
  packagingCharges: "0",
  securityDeposit: "5000",
  gstIncluded: true,
  minTemperature: "8",
  maxTemperature: "14",
  humidityRange: "70% - 85%",
  coolingTechnology: "Vapor Compression",
  workingHours: "24x7",
  powerBackup: "Generator",
  generator: true,
  solarBackup: true,
  insuranceAvailable: true,
  security24x7: true,
  cctv: true,
  digitalWeighingMachine: true,
  forklift: true,
  loadingDock: true,
  parking: true,
};

export function StorageOnboarding() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const progress = ((step + 1) / STEPS.length) * 100;
  const occupancyPct = useMemo(() => {
    const total = Number(form.totalCapacityKg || 0);
    const occupied = Number(form.occupiedCapacityKg || 0);
    if (!total) return 0;
    return Math.round((occupied / total) * 100);
  }, [form.totalCapacityKg, form.occupiedCapacityKg]);
  const availablePct = 100 - occupancyPct;

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCrop = (crop: string) => {
    setForm((prev) => ({
      ...prev,
      compatibleCrops: prev.compatibleCrops.includes(crop)
        ? prev.compatibleCrops.filter((item) => item !== crop)
        : [...prev.compatibleCrops, crop],
    }));
  };

  const next = () => setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  const back = () => setStep((prev) => Math.max(prev - 1, 0));

  const submit = async () => {
    setLoading(true);
    try {
      const payload = {
        name: form.storageName,
        owner_name: form.ownerName,
        address: form.address,
        lat: Number(form.latitude),
        lng: Number(form.longitude),
        phone: form.phone,
        price_per_crate_day: Number(form.storageCostPerCratePerDay),
        capacity_crates: Math.floor(Number(form.totalCapacityKg) / 20),
        available_crates: Math.floor(Number(form.availableCapacityKg) / 20),
      };
      await storageService.registerStorage(payload);
      if (user) {
        setUser({ ...user, hasStorage: true });
      }
      toast.success("Registration completed");
      navigate("/storage/dashboard");
    } catch {
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" className="mb-3 -ml-3" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Register Your Cold Storage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete your cold storage profile so farmers can discover and book your storage facility.
        </p>
      </motion.div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Onboarding wizard
            </p>
            <h2 className="mt-1 text-xl font-semibold">{STEPS[step]}</h2>
          </div>
          <Badge className="border-primary/20 bg-primary/10 text-primary">
            Step {step + 1} of {STEPS.length}
          </Badge>
        </div>
        <Progress value={progress} className="mt-4" />
      </Card>

      {step === 0 && (
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Storage Name</Label>
              <Input
                value={form.storageName}
                onChange={(e) => handleChange("storageName", e.target.value)}
                placeholder="Green Valley Cold Storage"
              />
            </div>
            <div className="space-y-2">
              <Label>Owner Name</Label>
              <Input
                value={form.ownerName}
                onChange={(e) => handleChange("ownerName", e.target.value)}
                placeholder="Aarav Sharma"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="9876543210"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="owner@storage.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Storage Type</Label>
              <Select
                value={form.storageType}
                onValueChange={(value) => handleChange("storageType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STORAGE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Plot 12, Industrial Area"
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={form.state} onChange={(e) => handleChange("state", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>District</Label>
              <Input
                value={form.district}
                onChange={(e) => handleChange("district", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Pincode</Label>
              <Input
                value={form.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input
                value={form.latitude}
                onChange={(e) => handleChange("latitude", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input
                value={form.longitude}
                onChange={(e) => handleChange("longitude", e.target.value)}
              />
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-primary" /> Map picker placeholder
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Your exact coordinates will be used later for farmer discovery and booking flow.
            </p>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Total Storage Capacity (KG)</Label>
              <Input
                type="number"
                value={form.totalCapacityKg}
                onChange={(e) => handleChange("totalCapacityKg", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Current Occupied Capacity (KG)</Label>
              <Input
                type="number"
                value={form.occupiedCapacityKg}
                onChange={(e) => handleChange("occupiedCapacityKg", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Available Capacity (KG)</Label>
              <Input
                type="number"
                value={form.availableCapacityKg}
                onChange={(e) => handleChange("availableCapacityKg", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Daily Intake (KG)</Label>
              <Input
                type="number"
                value={form.maxDailyIntakeKg}
                onChange={(e) => handleChange("maxDailyIntakeKg", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Capacity Per Booking (KG)</Label>
              <Input
                type="number"
                value={form.maxCapacityPerBookingKg}
                onChange={(e) => handleChange("maxCapacityPerBookingKg", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Number of Storage Chambers</Label>
              <Input
                type="number"
                value={form.storageChambers}
                onChange={(e) => handleChange("storageChambers", e.target.value)}
              />
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span>Occupancy %</span>
              <span className="font-semibold">{occupancyPct}%</span>
            </div>
            <Progress value={occupancyPct} className="h-2" />
            <div className="mt-3 flex items-center justify-between text-sm">
              <span>Available %</span>
              <span className="font-semibold">{availablePct}%</span>
            </div>
            <Progress value={availablePct} className="mt-2 h-2" />
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6">
          <div className="flex flex-wrap gap-2">
            {CROPS.map((crop) => (
              <button
                key={crop.name}
                type="button"
                onClick={() => toggleCrop(crop.name)}
                className={`rounded-full border px-3 py-2 text-sm transition-all ${form.compatibleCrops.includes(crop.name) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
              >
                {crop.emoji} {crop.name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Storage Cost Per KG Per Day</Label>
              <Input
                type="number"
                step="0.01"
                value={form.storageCostPerKgPerDay}
                onChange={(e) => handleChange("storageCostPerKgPerDay", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Storage Cost Per Crate Per Day</Label>
              <Input
                type="number"
                step="0.01"
                value={form.storageCostPerCratePerDay}
                onChange={(e) => handleChange("storageCostPerCratePerDay", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Minimum Booking Days</Label>
              <Input
                type="number"
                value={form.minimumBookingDays}
                onChange={(e) => handleChange("minimumBookingDays", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Booking Days</Label>
              <Input
                type="number"
                value={form.maximumBookingDays}
                onChange={(e) => handleChange("maximumBookingDays", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Loading Charges</Label>
              <Input
                type="number"
                value={form.loadingCharges}
                onChange={(e) => handleChange("loadingCharges", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Unloading Charges</Label>
              <Input
                type="number"
                value={form.unloadingCharges}
                onChange={(e) => handleChange("unloadingCharges", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Packaging Charges</Label>
              <Input
                type="number"
                value={form.packagingCharges}
                onChange={(e) => handleChange("packagingCharges", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Security Deposit</Label>
              <Input
                type="number"
                value={form.securityDeposit}
                onChange={(e) => handleChange("securityDeposit", e.target.value)}
              />
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" /> Pricing preview
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Estimated storage cost ₹{Number(form.storageCostPerKgPerDay).toFixed(2)}/kg/day with
              GST {form.gstIncluded ? "included" : "excluded"}.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Checkbox
              checked={form.gstIncluded}
              onCheckedChange={(checked) => handleChange("gstIncluded", checked === true)}
            />
            <Label>GST Included</Label>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Minimum Temperature</Label>
              <Input
                type="number"
                value={form.minTemperature}
                onChange={(e) => handleChange("minTemperature", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Temperature</Label>
              <Input
                type="number"
                value={form.maxTemperature}
                onChange={(e) => handleChange("maxTemperature", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Humidity Range</Label>
              <Input
                value={form.humidityRange}
                onChange={(e) => handleChange("humidityRange", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cooling Technology</Label>
              <Input
                value={form.coolingTechnology}
                onChange={(e) => handleChange("coolingTechnology", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Working Hours</Label>
              <Input
                value={form.workingHours}
                onChange={(e) => handleChange("workingHours", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Power Backup</Label>
              <Input
                value={form.powerBackup}
                onChange={(e) => handleChange("powerBackup", e.target.value)}
              />
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              ["generator", "Generator"],
              ["solarBackup", "Solar Backup"],
              ["insuranceAvailable", "Insurance Available"],
              ["security24x7", "24x7 Security"],
              ["cctv", "CCTV"],
              ["digitalWeighingMachine", "Digital Weighing Machine"],
              ["forklift", "Forklift"],
              ["loadingDock", "Loading Dock"],
              ["parking", "Parking"],
            ].map(([field, label]) => (
              <div
                key={field}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2"
              >
                <Checkbox
                  checked={Boolean(form[field as keyof typeof form])}
                  onCheckedChange={(checked) => handleChange(field, checked === true)}
                />
                <Label>{label}</Label>
              </div>
            ))}
          </div>
        </Card>
      )}

      {step === 5 && (
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: "Storage Front Image", field: "front" },
              { label: "Inside Image", field: "inside" },
              { label: "Storage Chambers", field: "chambers" },
              { label: "Office", field: "office" },
            ].map((item) => (
              <div
                key={item.field}
                className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4"
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Camera className="h-4 w-4 text-primary" /> {item.label}
                </div>
                <div className="mt-4 rounded-xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                  Upload placeholder · preview will render here later.
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Warehouse className="h-4 w-4 text-primary" /> License
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload your licensing documents for faster verification.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" /> Government Registration
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Registration documents can be attached here.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap justify-between gap-3">
        <Button variant="outline" onClick={back} disabled={step === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} className="gradient-primary text-primary-foreground">
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={submit}
            className="gradient-primary text-primary-foreground"
            disabled={loading}
          >
            {loading ? "Saving..." : "Complete Registration"}
          </Button>
        )}
      </div>
    </div>
  );
}
