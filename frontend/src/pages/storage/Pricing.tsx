import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { storageService } from "@/services/storageService";
import type { StorageFacility } from "@/types";
import { useEffect, useState } from "react";

export function StoragePricing() {
  const { user } = useAuth();
  const [storage, setStorage] = useState<StorageFacility[]>([]);

  useEffect(() => {
    storageService.getStorageByOwner(user?.id).then((data) => setStorage(data));
  }, [user?.id]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your public pricing and ancillary charges.
        </p>
      </div>
      {storage.map((facility) => (
        <Card key={facility.id} className="p-6">
          <h2 className="text-xl font-semibold">{facility.name}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <Label>Storage Cost Per KG Per Day</Label>
              <Input className="mt-1" value={facility.cost_per_kg_day} />
            </div>
            <div>
              <Label>Storage Cost Per Crate Per Day</Label>
              <Input className="mt-1" value={facility.cost_per_crate_day ?? 0} />
            </div>
            <div>
              <Label>Loading Charges</Label>
              <Input className="mt-1" value={facility.loading_charges ?? 0} />
            </div>
            <div>
              <Label>Packaging Charges</Label>
              <Input className="mt-1" value={facility.packaging_charges ?? 0} />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button className="gradient-primary text-primary-foreground">Save Pricing</Button>
            <Button variant="outline">Preview</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
