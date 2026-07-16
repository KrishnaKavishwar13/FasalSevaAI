import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function Profile() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Profile</h1></div>
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Name</Label><Input className="mt-1" defaultValue={user?.name} /></div>
          <div><Label>Phone</Label><Input className="mt-1" defaultValue={user?.phone} /></div>
        </div>
        <Button className="mt-6 gradient-primary text-primary-foreground" onClick={() => toast.success("Profile saved")}>Save changes</Button>
      </Card>
    </div>
  );
}

export function Settings() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Settings</h1></div>
      <Card className="p-6 space-y-4">
        <SettingRow title="SMS alerts" desc="Get shelf-life warnings via SMS." />
        <SettingRow title="Weather alerts" desc="Notify on adverse conditions for your crops." defaultOn />
        <SettingRow title="Price movement alerts" desc="When forecast changes by more than 10%." defaultOn />
        <SettingRow title="Marketing emails" desc="Occasional product updates." />
      </Card>
    </div>
  );
}

function SettingRow({ title, desc, defaultOn }: { title: string; desc: string; defaultOn?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4 last:border-0 last:pb-0">
      <div><p className="font-medium">{title}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
      <Switch defaultChecked={defaultOn} />
    </div>
  );
}
