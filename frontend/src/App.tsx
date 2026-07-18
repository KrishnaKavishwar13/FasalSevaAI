import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

import { PublicLayout } from "@/layouts/PublicLayout";
import { FarmerDashboardLayout } from "@/layouts/FarmerDashboardLayout";
import { StorageOwnerLayout } from "@/layouts/StorageOwnerLayout";

import { Landing } from "@/pages/Landing";
import { Schemes } from "@/pages/Schemes";
import { Contact } from "@/pages/Contact";
import { Login } from "@/pages/auth/Login";
import { Signup } from "@/pages/auth/Signup";

import { DashboardHome } from "@/pages/dashboard/Home";
import { NewAnalysis } from "@/pages/dashboard/NewAnalysis";
import { PricePrediction } from "@/pages/dashboard/PricePrediction";
import { ShelfLifePrediction } from "@/pages/dashboard/ShelfLifePrediction";
import { CompleteAnalysis } from "@/pages/dashboard/CompleteAnalysis";
import { Result } from "@/pages/dashboard/Result";
import { ProfitSimulator } from "@/pages/dashboard/ProfitSimulator";
import { Market } from "@/pages/dashboard/Market";
import { ColdStorage } from "@/pages/dashboard/ColdStorage";
import { Weather } from "@/pages/dashboard/Weather";
import { History } from "@/pages/dashboard/History";
import { Profile, Settings } from "@/pages/dashboard/Profile";

import { StorageLayout } from "@/layouts/StorageLayout";
import { StorageLogin } from "@/pages/storage/StorageLogin";
import { StorageDashboard } from "@/pages/storage/StorageDashboard";
import { StorageOnboarding } from "@/pages/storage/Onboarding";
import { StorageMyStorage } from "@/pages/storage/MyStorage";
import { StorageBookings } from "@/pages/storage/Bookings";
import { StorageAvailability } from "@/pages/storage/Availability";
import { StoragePricing } from "@/pages/storage/Pricing";
import { StorageAnalytics } from "@/pages/storage/Analytics";
import { StorageProfile } from "@/pages/storage/Profile";
import { StorageSettings } from "@/pages/storage/Settings";
import ChatBot from "@/components/ChatBot";

function RequireFarmer({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "storage_owner") return <Navigate to="/storage/dashboard" replace />;
  return <>{children}</>;
}

function RequireOnboarding({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "storage_owner") return <Navigate to="/dashboard" replace />;
  if (user.hasStorage) return <Navigate to="/storage/dashboard" replace />;
  return <>{children}</>;
}

function RequireStorageOwnerDashboard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "storage_owner") return <Navigate to="/dashboard" replace />;
  if (!user.hasStorage) return <Navigate to="/storage/onboarding" replace />;
  return <>{children}</>;
}

const queryClient = new QueryClient();

export function App() {
  const { i18n } = useTranslation();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public marketing pages */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/schemes" element={<Schemes />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            {/* Auth (no shell) */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Farmer dashboard */}
            <Route path="/dashboard" element={<RequireFarmer><FarmerDashboardLayout /></RequireFarmer>}>
              <Route index element={<DashboardHome />} />
              <Route path="new-analysis" element={<NewAnalysis />} />
              <Route path="new-analysis/spoilage" element={<ShelfLifePrediction />} />
              <Route path="new-analysis/price-prediction" element={<PricePrediction />} />
              <Route path="new-analysis/complete" element={<CompleteAnalysis />} />
              <Route path="result/:id" element={<Result />} />
              <Route path="profit/:id" element={<ProfitSimulator />} />
              <Route path="market" element={<Market />} />
              <Route path="cold-storage" element={<ColdStorage />} />
              <Route path="weather" element={<Weather />} />
              <Route path="schemes" element={<Schemes />} />
              <Route path="history" element={<History />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Storage owner flow */}
            <Route path="/storage/login" element={<StorageLogin />} />
            <Route path="/storage/onboarding" element={<RequireOnboarding><StorageOnboarding /></RequireOnboarding>} />
            <Route path="/storage" element={<RequireStorageOwnerDashboard><StorageLayout /></RequireStorageOwnerDashboard>}>
              <Route index element={<Navigate to="/storage/dashboard" replace />} />
              <Route path="dashboard" element={<StorageDashboard />} />
              <Route path="my-storage" element={<StorageMyStorage />} />
              <Route path="bookings" element={<StorageBookings />} />
              <Route path="availability" element={<StorageAvailability />} />
              <Route path="pricing" element={<StoragePricing />} />
              <Route path="analytics" element={<StorageAnalytics />} />
              <Route path="profile" element={<StorageProfile />} />
              <Route path="settings" element={<StorageSettings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ChatBot crop="" lang={i18n.language || "en"} />
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
    </QueryClientProvider>
  );
}
