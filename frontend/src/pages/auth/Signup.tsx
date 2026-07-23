import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Leaf } from "lucide-react";
import droneImg from "@/assets/drone-fields.jpg";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/config/languages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Signup() {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"farmer" | "storage_owner">("farmer");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
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
      if (step === "form") {
        if (!name.trim()) {
          toast.error(t("auth.signup_error_name", "Enter your name"));
          setLoading(false);
          return;
        }
        if (!/^[6-9]\d{9}$/.test(phone)) {
          toast.error(t("auth.signup_error_phone", "Enter a valid indian mobile number"));
          setLoading(false);
          return;
        }
        await authService.signup(name, phone, role);
        setStep("otp");
        setCountdown(60);
        toast.success(t("auth.signup_toast_otp_sent", "OTP sent to your phone"));
      } else {
        if (otp.length < 4) {
          toast.error(t("auth.login_error_otp", "Enter the OTP"));
          setLoading(false);
          return;
        }
        const user = await authService.verifyOtp(phone, otp, name);
        setUser(user);
        toast.success(t("auth.signup_toast_created", "Account created"));
        nav(
          user.role === "storage_owner"
            ? user.hasStorage
              ? "/storage/dashboard"
              : "/storage/onboarding"
            : "/dashboard",
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Action failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
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
          <h1 className="text-3xl font-bold tracking-tight">
            {t("auth.signup_title", "Create your account")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.signup_subtitle", "Free during beta. No credit card.")}
          </p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            {step === "form" && (
              <>
                <div className="space-y-2">
                  <Label>{t("auth.name_label", "Name")}</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("auth.name_placeholder", "Ramesh Patel")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("auth.phone_number_label", "Phone")}</Label>
                  <div className="flex">
                    <span className="grid place-items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                      +91
                    </span>
                    <Input
                      className="rounded-l-none"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("auth.role_label", "I am a")}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["farmer", "storage_owner"] as const).map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={cn(
                          "rounded-lg border p-3 text-left text-sm transition-all",
                          role === r
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        <span className="font-semibold capitalize">
                          {r === "farmer"
                            ? t("auth.role_farmer", "Farmer")
                            : t("auth.role_storage", "Storage owner")}
                        </span>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {r === "farmer"
                            ? t("auth.role_farmer_desc", "I grow & sell crops")
                            : t("auth.role_storage_desc", "I run a cold storage")}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {step === "otp" && (
              <div className="space-y-2">
                <Label>{t("auth.otp_label_enter", "Enter OTP")}</Label>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
                <p className="text-xs text-muted-foreground">
                  {countdown > 0 ? (
                    <span className="text-muted-foreground">
                      {t("auth.resend_in", "Resend OTP in")} {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-primary hover:underline font-medium"
                    >
                      {t("auth.resend_otp", "Resend OTP")}
                    </button>
                  )}
                </p>
              </div>
            )}
            <Button disabled={loading} className="w-full gradient-primary text-primary-foreground">
              {loading
                ? "…"
                : step === "form"
                  ? t("auth.send_otp", "Send OTP")
                  : t("auth.verify_continue", "Verify & continue")}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.already_have_account", "Already have an account?")}{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              {t("auth.log_in", "Log in")}
            </Link>
          </p>
        </div>
      </div>
      <div className="hidden md:block">
        <img src={droneImg} alt="" className="h-full w-full object-cover" />
      </div>
    </div>
  );
}
