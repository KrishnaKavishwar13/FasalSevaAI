import { Outlet, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/config/languages";
import { useTranslation } from "react-i18next";

export function StorageLayout() {
  const { user, logout } = useAuth();
  const { i18n } = useTranslation();

  if (!user || user.role !== "storage_owner") {
    return <Navigate to="/storage/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="border-b bg-white dark:bg-slate-900 shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/storage/dashboard"
            className="flex items-center gap-2 font-bold text-emerald-600"
          >
            <Building2 className="h-6 w-6" /> FasalSeva Storage
          </Link>
          <div className="flex items-center gap-4">
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
            <span className="text-sm font-medium">{user.name}</span>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </nav>
      <main className="p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
