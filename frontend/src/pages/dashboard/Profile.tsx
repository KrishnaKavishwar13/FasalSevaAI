import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/config/languages";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">{t("nav.profile", "Profile")}</h1></div>
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>{t("profile.name", "Name")}</Label><Input className="mt-1" value={user?.name || ""} readOnly disabled /></div>
          <div><Label>{t("profile.phone", "Phone")}</Label><Input className="mt-1" value={user?.phone || ""} readOnly disabled /></div>
          <div className="md:col-span-2"><Label>{t("profile.location", "Location")}</Label><Input className="mt-1" value={user?.state || t("profile.location_unknown", "Unknown")} readOnly disabled /></div>
        </div>
      </Card>
    </div>
  );
}

export function Settings() {
  const { t, i18n } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">{t("nav.settings", "Settings")}</h1></div>
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div><p className="font-medium">{t("settings.language", "Language")}</p><p className="text-xs text-muted-foreground">{t("settings.language_desc", "Choose your preferred language")}</p></div>
          <Select value={i18n.language} onValueChange={(val) => i18n.changeLanguage(val)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.native}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <SettingRow title={t("settings.sms_alerts", "SMS alerts")} desc={t("settings.sms_alerts_desc", "Get shelf-life warnings via SMS.")} />
        <SettingRow title={t("settings.weather_alerts", "Weather alerts")} desc={t("settings.weather_alerts_desc", "Notify on adverse conditions for your crops.")} defaultOn />
        <SettingRow title={t("settings.price_alerts", "Price movement alerts")} desc={t("settings.price_alerts_desc", "When forecast changes by more than 10%.")} defaultOn />
        <SettingRow title={t("settings.marketing", "Marketing emails")} desc={t("settings.marketing_desc", "Occasional product updates.")} />
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
