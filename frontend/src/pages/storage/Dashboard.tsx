import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { storageService } from "@/services/storageService";
import { useAuth } from "@/contexts/AuthContext";
import type { StorageFacility } from "@/types";
import { BarChart3, CalendarClock, Package, TrendingUp, Warehouse } from "lucide-react";

export function StorageOwnerDashboard() {
  const { user } = useAuth();
  const [storage, setStorage] = useState<StorageFacility[]>([]);

  useEffect(() => {
    storageService.getStorageByOwner(user?.id).then((data) => setStorage(data));
  }, [user?.id]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Storage Owner Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor bookings, capacity and facility visibility from one place.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Registered Storage</p><p className="text-2xl font-semibold">{storage.length}</p></div><Warehouse className="h-5 w-5 text-primary" /></div></Card>
        <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Live Capacity</p><p className="text-2xl font-semibold">{storage[0]?.available_tons ?? 0} tons</p></div><Package className="h-5 w-5 text-primary" /></div></Card>
        <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Quick Actions</p><p className="text-2xl font-semibold">Ready</p></div><BarChart3 className="h-5 w-5 text-primary" /></div></Card>
      </div>
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">My storage</p>
            <h2 className="mt-1 text-xl font-semibold">Your facilities</h2>
          </div>
          <Button asChild className="gradient-primary text-primary-foreground"><Link to="/storage/my-storage">Manage storage</Link></Button>
        </div>
        <div className="mt-6 space-y-3">
          {storage.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">No storage registered yet. Complete onboarding to list your facility.</div>
          ) : storage.map((facility) => (
            <div key={facility.id} className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{facility.name}</p>
                <p className="text-sm text-muted-foreground">{facility.address}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{facility.status ?? "Active"}</Badge>
                <Badge variant="outline">{facility.available_tons}/{facility.capacity_tons} tons free</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
