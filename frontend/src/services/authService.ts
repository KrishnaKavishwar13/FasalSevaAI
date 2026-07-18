import { apiClient, mockDelay } from "@/api/client";

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
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch {
      return null;
    }
  },
  async login(phone: string): Promise<{ requiresOtp: true }> {
    await apiClient.post("/auth/send-otp", { phone_number: phone.startsWith('+') ? phone : `+91${phone}` });
    return { requiresOtp: true as const };
  },
  async verifyOtp(phone: string, otp: string, name = "FasalSeva User"): Promise<AuthUser> {
    const pending = readPending();
    const role = pending?.role ?? "farmer";
    
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    const response = await apiClient.post("/auth/verify-otp", { phone_number: formattedPhone, otp });
    
    // Fallback ID and role if backend doesn't provide it yet
    const backendUser = response.data.user;
    const user: AuthUser = {
      id: backendUser.id || (role === "storage_owner" ? "u_owner_1" : "u_1"),
      name: pending?.name || backendUser.name || name,
      phone: formattedPhone,
      role: backendUser.role || role,
      hasStorage: role === "storage_owner" ? false : undefined,
    };
    
    localStorage.setItem(KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, response.data.access_token);
    localStorage.removeItem(PENDING_KEY);
    return user;
  },
  async signup(name: string, phone: string, role: AuthUser["role"] = "farmer"): Promise<{ requiresOtp: true }> {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ name, phone, role }));
    await apiClient.post("/auth/send-otp", { phone_number: phone.startsWith('+') ? phone : `+91${phone}` });
    return { requiresOtp: true as const };
  },
  updateCurrentUser(user: AuthUser) {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(user));
    return user;
  },
  logout() { localStorage.removeItem(KEY); localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(PENDING_KEY); },
};
