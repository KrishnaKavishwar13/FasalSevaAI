import axios from "axios";

// Configured axios instance. When the FastAPI backend is live,
// set VITE_API_BASE_URL and every service will hit it — no other code changes.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

// Small helper for mock services so loading states are actually visible in the UI.
export const mockDelay = <T>(data: T, ms = 600): Promise<T> =>
  new Promise((r) => setTimeout(() => r(data), ms));
