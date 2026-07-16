import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function StorageAnalytics() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track occupancy, booking trends and pricing performance.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-muted-foreground">Occupancy</p><p className="mt-2 text-3xl font-semibold">74%</p></Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground">Bookings</p><p className="mt-2 text-3xl font-semibold">18</p></Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground">Revenue</p><p className="mt-2 text-3xl font-semibold">₹1.2L</p></Card>
      </div>
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Performance Snapshot</h2>
          <Badge className="border-primary/20 bg-primary/10 text-primary">Live</Badge>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">This screen is ready for later API integration and can be expanded into a full analytics suite.</p>
      </Card>
    </div>
  );
}
