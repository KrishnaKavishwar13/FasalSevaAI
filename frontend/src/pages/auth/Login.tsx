import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Leaf } from "lucide-react";
import heroImg from "@/assets/hero-farmer.jpg";

export function Login() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { setUser } = useAuth();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (step === "phone") {
        const activePhone = phone || "9876543210";
        if (!/^\d{10}$/.test(activePhone)) {
          toast.error("Enter a 10-digit phone number");
          return;
        }
        if (!phone) {
          setPhone("9876543210");
        }
        await authService.login(activePhone);
        setStep("otp");
        toast.success("OTP sent (any 4-6 digits will work in demo)");
      } else {
        const activeOtp = otp || "123456";
        if (activeOtp.length < 4) {
          toast.error("Enter the OTP");
          return;
        }
        if (!otp) {
          setOtp("123456");
        }
        const user = await authService.verifyOtp(phone || "9876543210", activeOtp);
        setUser(user);
        toast.success("Welcome back");
        nav(user.role === "storage_owner" ? (user.hasStorage ? "/storage/dashboard" : "/storage/onboarding") : "/dashboard");
      }
    } finally { setLoading(false); }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden md:block">
        <img src={heroImg} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-lg font-bold">FasalSeva AI</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Log in with your phone to continue.</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label>Phone number</Label>
              <div className="flex">
                <span className="grid place-items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">+91</span>
                <Input inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="rounded-l-none" placeholder="9876543210" disabled={step === "otp"} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Demo: Enter any 10-digit number or click "Send OTP" to auto-fill.
              </p>
            </div>
            {step === "otp" && (
              <div className="space-y-2">
                <Label>OTP</Label>
                <Input inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="Enter OTP" />
                <p className="text-xs text-muted-foreground mt-1">
                  Demo: Any 4-6 digits work (e.g. 123456).
                </p>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground">
              {loading ? "…" : step === "phone" ? "Send OTP" : "Verify & log in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here? <Link to="/signup" className="font-semibold text-primary hover:underline">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
