import { mockDelay } from "@/api/client";
import { SCHEMES } from "@/constants/data";
import type { Scheme, CropName } from "@/types";

export const schemeService = {
  async getSchemes(_crop?: CropName): Promise<Scheme[]> {
    return mockDelay(SCHEMES, 250);
  },
};
