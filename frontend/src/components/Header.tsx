import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Leaf, Moon, Sun, Menu, X, Languages } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGES } from "@/config/languages";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const NAV = [
    { to: "/", label: t("nav.home", "Home") },
    { to: "/#features", label: t("nav.features", "Features") },
    { to: "/#workflow", label: t("nav.workflow", "How It Works") },
    { to: "/schemes", label: t("nav.schemes", "Schemes") },
    { to: "/contact", label: t("nav.contact", "Contact Us") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary shadow-elegant">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Fasal<span className="text-gradient-primary">Seva</span> <span className="text-xs font-semibold text-muted-foreground">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const isHash = n.to.startsWith("/#");
            if (isHash) {
              return (
                <a
                  key={n.to}
                  href={n.to}
                  onClick={(e) => {
                    if (window.location.pathname === "/") {
                      e.preventDefault();
                      const id = n.to.replace("/#", "#");
                      const el = document.querySelector(id);
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted text-foreground/80"
                >
                  {n.label}
                </a>
              );
            }
            return (
              <NavLink key={n.to} to={n.to} className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted ${
                  isActive ? "text-primary" : "text-foreground/80"
                }`
              }>{n.label}</NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Language">
                <Languages className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <DropdownMenuItem key={lang.code} onClick={() => i18n.changeLanguage(lang.code)}>
                  {lang.native}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
            <Link to="/login">{t("auth.login", "Login")}</Link>
          </Button>
          <Button asChild size="sm" className="hidden md:inline-flex gradient-primary text-primary-foreground">
            <Link to="/signup">{t("auth.get_started", "Get started")}</Link>
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden border-t border-border/60 bg-background"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {NAV.map((n) => {
                const isHash = n.to.startsWith("/#");
                if (isHash) {
                  return (
                    <a
                      key={n.to}
                      href={n.to}
                      onClick={(e) => {
                        setOpen(false);
                        if (window.location.pathname === "/") {
                          e.preventDefault();
                          const id = n.to.replace("/#", "#");
                          const el = document.querySelector(id);
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                      {n.label}
                    </a>
                  );
                }
                return (
                  <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">{n.label}</Link>
                );
              })}
              <div className="mt-2 flex gap-2">
                <Button asChild variant="outline" className="flex-1"><Link to="/login">{t("auth.login", "Login")}</Link></Button>
                <Button asChild className="flex-1 gradient-primary text-primary-foreground"><Link to="/signup">{t("auth.get_started", "Get started")}</Link></Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
