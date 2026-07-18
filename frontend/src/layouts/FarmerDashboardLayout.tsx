import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FilePlus2, History, Warehouse, LandPlot,
  User, Settings, LogOut, Menu, X, Leaf, Moon, Sun, CloudSun,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/config/languages";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { useTranslation } from "react-i18next";

const ITEMS = [
  { to: "/dashboard",              tKey: "nav.dashboard",     icon: LayoutDashboard, end: true },
  { to: "/dashboard/new-analysis", tKey: "nav.new_analysis",  icon: FilePlus2 },
  { to: "/dashboard/history",      tKey: "nav.history",       icon: History },
  { to: "/dashboard/market",       tKey: "nav.market",        icon: LandPlot },
  { to: "/dashboard/cold-storage", tKey: "nav.cold_storage",  icon: Warehouse },
  { to: "/dashboard/weather",      tKey: "nav.weather",       icon: CloudSun },
  { to: "/dashboard/schemes",      tKey: "nav.schemes",       icon: LandPlot },
  { to: "/dashboard/profile",      tKey: "nav.profile",       icon: User },
  { to: "/dashboard/settings",     tKey: "nav.settings",      icon: Settings },
];


export function FarmerDashboardLayout() {
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-2 px-5 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary">
          <Leaf className="h-5 w-5 text-primary-foreground" />
        </span>
        <span className="text-lg font-bold">FasalSeva <span className="text-xs text-muted-foreground">AI</span></span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3">
        {ITEMS.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => cn(
              "mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "bg-primary/10 text-primary" : "text-foreground/75 hover:bg-muted hover:text-foreground",
            )}
          >
            <it.icon className="h-4 w-4" /> {t(it.tKey)}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border/60 p-3">
        <button
          onClick={() => { logout(); nav("/"); }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/75 hover:bg-muted"
        >
          <LogOut className="h-4 w-4" /> {t("nav.logout")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-sidebar lg:block">
        {SidebarInner}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar lg:hidden">{SidebarInner}</aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen((o) => !o)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="hidden text-sm text-muted-foreground sm:block">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-2 py-1">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {(user?.name ?? "R")[0]}
              </span>
              <span className="pr-2 text-sm font-medium">{user?.name ?? "Guest"}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8"><Outlet /></main>
        <VoiceAssistant />
      </div>
    </div>
  );
}
