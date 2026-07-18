import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Leaf } from "lucide-react";
import heroImg from "@/assets/hero-farmer.jpg";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/config/languages";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Login() {
  const { t, i18n } = useTranslation();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const nav = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  async function handleResend() {
    setLoading(true);
    try {
      await authService.login(phone);
      setCountdown(60);
      toast.success(t("auth.otp_resent", "OTP has been resent via FasalSeva Gateway"));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (step === "phone") {
        if (!/^\d{10}$/.test(phone)) {
          toast.error(t("auth.login_error_phone", "Enter a 10-digit phone number"));
          setLoading(false);
          return;
        }
        await authService.login(phone);
        setStep("otp");
        setCountdown(60);
        toast.success(t("auth.login_toast_otp_sent", "OTP sent to your phone"));
      } else {
        if (otp.length < 4) {
          toast.error(t("auth.login_error_otp", "Enter the 6-digit OTP"));
          setLoading(false);
          return;
        }
        const user = await authService.verifyOtp(phone, otp);
        setUser(user);
        toast.success(t("auth.login_toast_welcome", "Welcome back"));
        nav(user.role === "storage_owner" ? (user.hasStorage ? "/storage/dashboard" : "/storage/onboarding") : "/dashboard");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Authentication failed. Please check your credentials.");
    } finally { setLoading(false); }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden md:block">
        <img src={heroImg} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm relative">
          <div className="absolute right-0 top-0">
            <Select value={i18n.language} onValueChange={(val) => i18n.changeLanguage(val)}>
              <SelectTrigger className="w-[120px] h-8 text-xs bg-background">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code} className="text-xs">
                    {lang.native}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link to="/" className="mb-8 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-lg font-bold">FasalSeva AI</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{t("auth.login_title", "Welcome back")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("auth.login_subtitle", "Log in with your phone to continue.")}</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label>{t("auth.phone_number_label", "Phone number")}</Label>
              <div className="flex">
                <span className="grid place-items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">+91</span>
                <Input inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="rounded-l-none" placeholder="9876543210" disabled={step === "otp"} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("auth.enter_real_phone", "Enter your phone number to receive an OTP.")}
              </p>
            </div>
            {step === "otp" && (
              <div className="space-y-2">
                <Label>{t("auth.otp_label", "OTP")}</Label>
                <Input inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder={t("auth.otp_placeholder", "Enter OTP")} />
                <p className="text-xs text-muted-foreground mt-1">
                {countdown > 0 ? (
                  <span className="text-muted-foreground">{t("auth.resend_in", "Resend OTP in")} {countdown}s</span>
                ) : (
                  <button type="button" onClick={handleResend} className="text-primary hover:underline font-medium">
                    {t("auth.resend_otp", "Resend OTP")}
                  </button>
                )}
                </p>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground">
              {loading ? "…" : step === "phone" ? t("auth.send_otp", "Send OTP") : t("auth.verify_login", "Verify & log in")}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.new_here", "New here?")} <Link to="/signup" className="font-semibold text-primary hover:underline">{t("auth.create_account", "Create account")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
