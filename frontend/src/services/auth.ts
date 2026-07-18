import { apiClient } from "@/api/client";

export const authService = {
  sendOtp: async (phone_number: string) => {
    const response = await apiClient.post("/auth/send-otp", { phone_number });
    return response.data;
  },

  verifyOtp: async (phone_number: string, otp: string) => {
    const response = await apiClient.post("/auth/verify-otp", { phone_number, otp });
    
    // Store token in localStorage
    if (response.data.access_token) {
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    
    try {
      const response = await apiClient.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (e) {
      // If token is invalid or expired
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      return null;
    }
  },

  getUserFromStorage: () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
};
