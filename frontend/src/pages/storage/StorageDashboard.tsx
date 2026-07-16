import { Card } from "@/components/ui/card";
import { Package, IndianRupee, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function StorageDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome, {user?.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's the overview of your cold storage business.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-100 text-emerald-600"><Package className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available Capacity</p>
              <h2 className="text-2xl font-bold">120 / 500 Tons</h2>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-100 text-blue-600"><Users className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Bookings</p>
              <h2 className="text-2xl font-bold">14 Farmers</h2>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-amber-600"><IndianRupee className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
              <h2 className="text-2xl font-bold">₹45,200</h2>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4">Recent Inquiries</h3>
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          You have no new inquiries today.
        </div>
      </Card>
    </div>
  );
}
