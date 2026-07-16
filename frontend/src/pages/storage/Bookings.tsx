import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { storageService } from "@/services/storageService";
import { useAuth } from "@/contexts/AuthContext";
import type { Booking } from "@/types";
import { CheckCircle2, XCircle, Eye } from "lucide-react";

export function StorageBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    storageService.getBookings(user?.id).then((data) => setBookings(data));
  }, [user?.id]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review and act on booking requests from farmers.</p>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-[0.25em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Farmer</th>
                <th className="px-4 py-3">Crop</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Expected Arrival</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No bookings yet.</td></tr>
              ) : bookings.map((booking) => (
                <tr key={booking.id} className="border-t border-border/60">
                  <td className="px-4 py-3 font-medium">Farmer</td>
                  <td className="px-4 py-3">{booking.crop}</td>
                  <td className="px-4 py-3">{booking.quantity_kg} kg</td>
                  <td className="px-4 py-3">{booking.duration_days}</td>
                  <td className="px-4 py-3">{new Date().toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3"><Badge>{booking.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline"><CheckCircle2 className="mr-1 h-4 w-4" /> Accept</Button>
                      <Button size="sm" variant="outline"><XCircle className="mr-1 h-4 w-4" /> Reject</Button>
                      <Button size="sm" variant="ghost"><Eye className="mr-1 h-4 w-4" /> View</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
