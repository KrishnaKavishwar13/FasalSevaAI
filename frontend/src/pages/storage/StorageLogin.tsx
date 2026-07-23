import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Building2, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function StorageLogin() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    setLoading(true);
    try {
      await authService.login(phone);
      setCountdown(60);
      toast.success("OTP has been resent via FasalSeva Gateway");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === "storage_owner") {
    return <Navigate to="/storage/dashboard" replace />;
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!/^[6-9]\d{9}$/.test(phone)) {
        toast.error("Enter a valid indian mobile number");
        setLoading(false);
        return;
      }
      localStorage.setItem("fasalseva.pending", JSON.stringify({ role: "storage_owner" }));
      await authService.login(phone);
      setStep(2);
      setCountdown(60);
      toast.success("OTP sent to your number");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (otp.length < 6) {
        toast.error("Enter the 6-digit OTP");
        setLoading(false);
        return;
      }
      const loggedInUser = await authService.verifyOtp(phone, otp, "Storage Admin");
      setUser(loggedInUser);
      toast.success("Welcome back!");
      navigate(loggedInUser.hasStorage ? "/storage/dashboard" : "/storage/onboarding");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-emerald-600 shadow-lg mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-400">Storage Portal</h1>
          <p className="text-emerald-700/80 dark:text-emerald-400/80 mt-2">Manage your cold storage business</p>
        </div>

        <Card className="p-6 sm:p-8 shadow-xl">
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <Label>Mobile Number</Label>
                <Input 
                  className="mt-2 h-12 text-lg" 
                  placeholder="Enter your registered number" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-lg" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <>Send OTP <ArrowRight className="ml-2 h-5 w-5" /></>}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <Label>Enter OTP</Label>
                <Input 
                  className="mt-2 h-12 text-lg text-center tracking-widest" 
                  placeholder="• • • • • •" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)} 
                  required 
                />
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  {countdown > 0 ? (
                    <span className="text-muted-foreground">Resend OTP in {countdown}s</span>
                  ) : (
                    <button type="button" onClick={handleResend} className="text-emerald-600 hover:underline font-medium">
                      Resend OTP
                    </button>
                  )}
                </p>
              </div>
              <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-lg" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Verify & Login"}
              </Button>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
