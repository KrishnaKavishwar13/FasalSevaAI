import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { storageService } from "@/services/storageService";
import type { StorageFacility } from "@/types";
import { Edit3, Package, ShieldCheck, Thermometer, Droplets, MapPin, Trash2 } from "lucide-react";

export function StorageMyStorage() {
  const { user } = useAuth();
  const [storage, setStorage] = useState<StorageFacility[]>([]);

  useEffect(() => {
    storageService.getStorageByOwner(user?.id).then((data) => setStorage(data));
  }, [user?.id]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Storage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage your registered cold storage facility.
        </p>
      </div>
      {storage.length === 0 ? (
        <Card className="p-8 text-sm text-muted-foreground">No storage registered yet.</Card>
      ) : (
        storage.map((facility) => (
          <Card key={facility.id} className="overflow-hidden p-0">
            <img src={facility.image} alt="" className="h-48 w-full object-cover" />
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{facility.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <MapPin className="mr-1 inline h-4 w-4" />
                    {facility.address}
                  </p>
                </div>
                <Badge className="border-primary/20 bg-primary/10 text-primary">
                  {facility.verification_status ?? "Pending"}
                </Badge>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="mt-2 font-semibold">
                    {facility.available_tons}/{facility.capacity_tons} tons free
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-sm text-muted-foreground">Storage Cost</p>
                  <p className="mt-2 font-semibold">₹{facility.cost_per_kg_day}/kg/day</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-sm text-muted-foreground">Supported Crops</p>
                  <p className="mt-2 text-sm">{facility.compatible_crops.slice(0, 4).join(", ")}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
                  <Thermometer className="h-4 w-4" /> {facility.temperature_range ?? "N/A"}
                </div>
                <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
                  <Droplets className="h-4 w-4" /> {facility.humidity_range ?? "N/A"}
                </div>
                <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
                  <ShieldCheck className="h-4 w-4" /> {facility.facilities?.join(", ") || "Basic"}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="outline">
                  <Edit3 className="mr-2 h-4 w-4" /> Edit Storage
                </Button>
                <Button variant="outline">
                  <Package className="mr-2 h-4 w-4" /> Update Capacity
                </Button>
                <Button variant="outline">
                  <Package className="mr-2 h-4 w-4" /> Update Pricing
                </Button>
                <Button variant="outline">
                  <Package className="mr-2 h-4 w-4" /> Pause Listing
                </Button>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Listing
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
