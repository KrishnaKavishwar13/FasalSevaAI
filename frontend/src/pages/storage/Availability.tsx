import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { storageService } from "@/services/storageService";
import type { StorageFacility } from "@/types";
import { useEffect, useState } from "react";

export function StorageAvailability() {
  const { user } = useAuth();
  const [storage, setStorage] = useState<StorageFacility[]>([]);

  useEffect(() => {
    storageService.getStorageByOwner(user?.id).then((data) => setStorage(data));
  }, [user?.id]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Availability</h1>
        <p className="mt-1 text-sm text-muted-foreground">Adjust capacity visibility and intake availability.</p>
      </div>
      {storage.map((facility) => (
        <Card key={facility.id} className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{facility.name}</h2>
              <p className="text-sm text-muted-foreground">{facility.address}</p>
            </div>
            <Button className="gradient-primary text-primary-foreground">Update Availability</Button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <Label>Available Capacity (KG)</Label>
              <Input className="mt-1" value={facility.available_tons * 1000} />
            </div>
            <div>
              <Label>Daily Intake Limit (KG)</Label>
              <Input className="mt-1" value={facility.max_daily_intake_kg ?? 0} />
            </div>
          </div>
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Occupancy status</p>
            <Progress value={Math.round(((facility.capacity_tons - facility.available_tons) / facility.capacity_tons) * 100)} />
          </div>
        </Card>
      ))}
    </div>
  );
}
