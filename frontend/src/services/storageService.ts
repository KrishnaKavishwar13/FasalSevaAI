/**
 * storageService.ts
 * getFacilities() — calls GET /storage?lat=&lng= on FastAPI backend.
 * All other methods (booking, registration, etc.) remain as local mocks
 * since those are handled by RegisterStorage page using direct apiClient calls.
 */
import { apiClient, mockDelay } from "@/api/client";
import type { StorageFacility, Booking, BookingInput, CropName } from "@/types";
import coldStorageImg from "@/assets/cold-storage.jpg";

// Shape returned by FastAPI /storage endpoint
interface BackendStorage {
  name: string;
  owner_name?: string;
  address: string;
  phone?: string;
  price_per_crate_day?: number | null;
  available_crates?: number | null;
  distance_km: number;
  transport_cost?: number;
  verified: boolean;
  badge?: string;
  maps_link?: string;
}

// Convert backend storage → StorageFacility (UI type)
function mapBackendToFacility(s: BackendStorage, index: number): StorageFacility {
  return {
    id: `backend_${index}`,
    owner_id: undefined,
    name: s.name,
    owner_name: s.owner_name,
    address: s.address,
    phone: s.phone,
    lat: 22.7196,   // approx — backend doesn't return lat/lng in the result list
    lng: 75.8577,
    distance_km: s.distance_km,
    capacity_tons: 500,
    available_tons: s.available_crates != null ? Math.round(s.available_crates / 20) : 100,
    occupied_tons: 0,
    cost_per_kg_day: s.price_per_crate_day != null ? s.price_per_crate_day / 50 : 0.2,
    cost_per_crate_day: s.price_per_crate_day ?? undefined,
    compatible_crops: ["Tomato", "Potato", "Onion", "Cauliflower", "Cabbage", "Carrot", "Brinjal"] as CropName[],
    rating: s.verified ? 4.7 : 4.2,
    image: coldStorageImg,
    amenities: s.verified ? ["24/7 backup", "CCTV", "Verified Partner"] : ["Call to confirm"],
    verification_status: s.verified ? "Verified" : "Pending",
    status: "Active",
  };
}

// Default farmer location (Indore, MP)
const DEFAULT_LAT = 22.7196;
const DEFAULT_LNG = 75.8577;

let _farmerLat = DEFAULT_LAT;
let _farmerLng = DEFAULT_LNG;

/** Call this once from the ColdStorage page after geolocation is available */
export function setFarmerLocation(lat: number, lng: number) {
  _farmerLat = lat;
  _farmerLng = lng;
}

let BOOKINGS: Booking[] = [];

export const storageService = {
  async getFacilities(filters?: { crop?: CropName; maxDistance?: number }): Promise<StorageFacility[]> {
    try {
      const res = await apiClient.get(`/storage?lat=${_farmerLat}&lng=${_farmerLng}`);
      const results: BackendStorage[] = res.data?.results ?? [];
      let facilities = results.map(mapBackendToFacility);

      if (filters?.maxDistance) {
        facilities = facilities.filter((f) => f.distance_km <= filters.maxDistance!);
      }
      if (filters?.crop) {
        facilities = facilities.filter((f) => f.compatible_crops.includes(filters.crop!));
      }

      return facilities.sort((a, b) => a.distance_km - b.distance_km);
    } catch (err) {
      console.error("storageService.getFacilities error:", err);
      return [];
    }
  },

  async getAllStorages(): Promise<StorageFacility[]> {
    return this.getFacilities();
  },

  async getStorageByOwner(_ownerId?: string): Promise<StorageFacility[]> {
    return [];
  },

  async updateStorage(id: string, _updates: Partial<StorageFacility>): Promise<StorageFacility | undefined> {
    return undefined;
  },

  async deleteStorage(_id: string): Promise<boolean> {
    return false;
  },

  async updateAvailability(_id: string, _availableTons: number): Promise<StorageFacility | undefined> {
    return undefined;
  },

  async registerStorage(input: {
    name: string;
    owner_name: string;
    address: string;
    lat: number;
    lng: number;
    phone: string;
    price_per_crate_day: number;
    capacity_crates: number;
    available_crates: number;
  }): Promise<{ message: string; id: number }> {
    const res = await apiClient.post("/storage/register", input);
    return res.data;
  },

  async bookStorage(input: BookingInput): Promise<Booking> {
    const booking: Booking = {
      ...input,
      id: `bk_${Date.now()}`,
      status: "Confirmed",
      created_at: new Date().toISOString(),
      facility_name: "Cold Storage",
      estimated_cost: Math.round(input.quantity_kg * 0.2 * input.duration_days),
    };
    BOOKINGS = [booking, ...BOOKINGS];
    return mockDelay(booking, 700);
  },

  async getBookings(_ownerId?: string): Promise<Booking[]> {
    return mockDelay(BOOKINGS, 200);
  },

  async updateBookingStatus(id: string, status: Booking["status"]): Promise<Booking | undefined> {
    BOOKINGS = BOOKINGS.map((b) => (b.id === id ? { ...b, status } : b));
    return mockDelay(BOOKINGS.find((b) => b.id === id), 300);
  },
};
