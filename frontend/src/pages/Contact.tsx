import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export function Contact() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent successfully! Our team will contact you soon.");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Get in touch</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Contact FasalSeva</h1>
        <p className="mt-4 text-muted-foreground">
          Have questions about our AI decision engine? Want to partner as a cold storage facility? We're here to help.
        </p>
      </motion.div>

      <div className="mt-16 grid gap-8 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-8 shadow-card">
            <h3 className="text-xl font-semibold">Send us a message</h3>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">First name</Label>
                  <Input id="name" required placeholder="Ramesh" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastname">Last name</Label>
                  <Input id="lastname" placeholder="Patel" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email or Phone</Label>
                <Input id="email" required placeholder="ramesh@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" required placeholder="How can we help you?" className="min-h-[120px]" />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground">
                <Send className="mr-2 h-4 w-4" /> Send message
              </Button>
            </form>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-8 lg:pl-10">
          <div>
            <h3 className="text-xl font-semibold">Contact Information</h3>
            <p className="mt-2 text-muted-foreground">Reach out to us directly through any of these channels.</p>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Phone</p>
                <p className="text-sm text-muted-foreground">+91 1800-FASAL-SEVA</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Email</p>
                <p className="text-sm text-muted-foreground">support@fasalseva.com</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Office</p>
                <p className="text-sm text-muted-foreground">Indore, Madhya Pradesh, India</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
