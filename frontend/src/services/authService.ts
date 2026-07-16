import { mockDelay } from "@/api/client";

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: "farmer" | "storage_owner";
  hasStorage?: boolean;
  onboarded?: boolean;
  mainCrop?: string;
  state?: string;
  lat?: number;
  lng?: number;
}

const KEY = "fasalseva_user";
const TOKEN_KEY = "fasalseva_token";
const PENDING_KEY = "fasalseva.pending";

function readPending() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "null"); } catch { return null; }
}

export const authService = {
  currentUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
  },
  async login(phone: string): Promise<{ requiresOtp: true }> {
    return mockDelay({ requiresOtp: true as const }, 500);
  },
  async verifyOtp(phone: string, _otp: string, name = "Ramesh Patel"): Promise<AuthUser> {
    const pending = readPending();
    const role = pending?.role ?? "farmer";
    const user: AuthUser = {
      id: role === "storage_owner" ? "u_owner_1" : "u_1",
      name,
      phone,
      role,
      hasStorage: role === "storage_owner" ? false : undefined,
    };
    localStorage.setItem(KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, "fake-jwt-token-123");
    localStorage.removeItem(PENDING_KEY);
    return mockDelay(user, 500);
  },
  async signup(name: string, phone: string, role: AuthUser["role"] = "farmer"): Promise<{ requiresOtp: true }> {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ name, phone, role }));
    return mockDelay({ requiresOtp: true as const }, 500);
  },
  updateCurrentUser(user: AuthUser) {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(user));
    return user;
  },
  logout() { localStorage.removeItem(KEY); localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(PENDING_KEY); },
};
