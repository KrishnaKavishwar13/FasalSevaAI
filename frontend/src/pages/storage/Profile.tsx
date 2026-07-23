import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StorageProfile() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your storage owner profile and account details.
        </p>
      </div>
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input className="mt-1" placeholder="Owner name" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input className="mt-1" placeholder="Phone number" />
          </div>
          <div>
            <Label>Email</Label>
            <Input className="mt-1" placeholder="Email" />
          </div>
          <div>
            <Label>Company</Label>
            <Input className="mt-1" placeholder="Storage company" />
          </div>
        </div>
        <div className="mt-6">
          <Button className="gradient-primary text-primary-foreground">Save changes</Button>
        </div>
      </Card>
    </div>
  );
}
