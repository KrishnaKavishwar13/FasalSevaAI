import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function StorageSettings() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control notification and visibility preferences.
        </p>
      </div>
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-border/70 p-4">
          <div>
            <p className="font-medium">New booking notifications</p>
            <p className="text-sm text-muted-foreground">
              Receive alerts whenever a farmer requests storage.
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border/70 p-4">
          <div>
            <p className="font-medium">Public listing visibility</p>
            <p className="text-sm text-muted-foreground">
              Allow farmers to discover your storage from the public marketplace.
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="mt-6">
          <Button className="gradient-primary text-primary-foreground">Save preferences</Button>
        </div>
      </Card>
    </div>
  );
}
