import { Link } from "react-router-dom";
import { Leaf, Twitter, Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2 max-w-sm">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </span>
              <span className="text-lg font-bold">FasalSeva AI</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              AI-powered post-harvest decisions for Indian farmers — shelf life, mandi prices, storage and profit in one place.
            </p>
            <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); toast.success("Subscribed"); }}>
              <Input type="email" placeholder="your@email.com" className="max-w-xs" required />
              <Button className="gradient-primary text-primary-foreground">Subscribe</Button>
            </form>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Quick links</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
              <li><Link to="/dashboard/cold-storage" className="hover:text-foreground">Cold Storage</Link></li>
              <li><Link to="/schemes" className="hover:text-foreground">Government Schemes</Link></li>
              <li><Link to="/login" className="hover:text-foreground">Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Contact</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +91 9111946697</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@fasalseva.ai</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Indore, Madhya Pradesh</li>
              <li className="text-xs">Available in English &amp; हिंदी</li>
            </ul>
            <div className="mt-3 flex gap-2">
              <Button size="icon" variant="outline" className="h-8 w-8"><Twitter className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" className="h-8 w-8"><Facebook className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" className="h-8 w-8"><Instagram className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} FasalSeva AI. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="#" className="hover:text-foreground">Privacy</Link>
            <Link to="#" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
