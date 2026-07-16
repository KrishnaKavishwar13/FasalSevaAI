import type { CropName } from "@/types";

export const CROPS: { name: CropName; encoded: number; priceModel: boolean; emoji: string }[] = [
  { name: "Tomato",      encoded: 1,  priceModel: true,  emoji: "🍅" },
  { name: "Potato",      encoded: 2,  priceModel: true,  emoji: "🥔" },
  { name: "Onion",       encoded: 3,  priceModel: true,  emoji: "🧅" },
  { name: "Banana",      encoded: 4,  priceModel: true,  emoji: "🍌" },
  { name: "Mango",       encoded: 5,  priceModel: true,  emoji: "🥭" },
  { name: "Cauliflower", encoded: 6,  priceModel: true,  emoji: "🥦" },
  { name: "Cabbage",     encoded: 7,  priceModel: true,  emoji: "🥬" },
  { name: "Spinach",     encoded: 8,  priceModel: false, emoji: "🌿" },
  { name: "Grapes",      encoded: 9,  priceModel: true,  emoji: "🍇" },
  { name: "Guava",       encoded: 10, priceModel: true,  emoji: "🫒" },
  { name: "Carrot",      encoded: 11, priceModel: true,  emoji: "🥕" },
  { name: "Brinjal",     encoded: 12, priceModel: true,  emoji: "🍆" },
  { name: "Wheat",       encoded: 13, priceModel: false, emoji: "🌾" },
  { name: "Rice",        encoded: 14, priceModel: false, emoji: "🍚" },
];

export const STATE_DISTRICTS: Record<string, string[]> = {
  "Madhya Pradesh": ["Indore", "Bhopal", "Ujjain", "Jabalpur", "Gwalior", "Dewas"],
  "Maharashtra": ["Pune", "Nashik", "Nagpur", "Mumbai", "Aurangabad", "Kolhapur"],
  "Uttar Pradesh": ["Lucknow", "Varanasi", "Agra", "Kanpur", "Meerut", "Allahabad"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Belagavi", "Mangaluru"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"],
};
export const STATES = Object.keys(STATE_DISTRICTS);

import type { Scheme } from "@/types";
export const SCHEMES: Scheme[] = [
  {
    id: "pmksy",
    name: "Pradhan Mantri Kisan Sampada Yojana",
    short_name: "PMKSY",
    category: "Infrastructure",
    eligibility: "Farmer Producer Organizations, cooperatives, food processing units.",
    description: "A comprehensive package for creating modern infrastructure and efficient supply-chain management from farm gate to retail.",
    benefits: [
      "Grants-in-aid for cold chain and value-addition infrastructure",
      "Up to 35% credit-linked back-ended subsidy",
      "Priority for perishable produce clusters",
    ],
    link: "https://mofpi.gov.in/Schemes/pradhan-mantri-kisan-sampada-yojana",
  },
  {
    id: "pmfby",
    name: "Pradhan Mantri Fasal Bima Yojana",
    short_name: "PMFBY",
    category: "Insurance",
    eligibility: "All farmers growing notified crops in notified areas.",
    description: "Crop insurance protecting against yield loss due to non-preventable natural risks — drought, flood, pest attack, and post-harvest losses.",
    benefits: [
      "Premium as low as 1.5% (Rabi) / 2% (Kharif)",
      "Full sum insured against localized calamities",
      "Post-harvest coverage up to 14 days for cut & spread crops",
    ],
    link: "https://pmfby.gov.in",
  },
  {
    id: "cold-storage",
    name: "Cold Storage Subsidy Programme (NHM)",
    category: "Subsidy",
    eligibility: "Individuals, FPOs, cooperatives investing in cold storage or reefer transport.",
    description: "Capital subsidy under the National Horticulture Mission for cold storage units, ripening chambers, and refrigerated transport.",
    benefits: [
      "35% subsidy in general areas, 50% in NE / hilly states",
      "Support for pack-houses and pre-cooling units",
      "Reefer van co-financing available",
    ],
    link: "https://nhm.gov.in",
  },
  {
    id: "op-greens",
    name: "Operation Greens (TOP → TOTAL)",
    category: "Market",
    eligibility: "Producers and processors of Tomato, Onion, Potato and other perishables.",
    description: "Price stabilization and value-chain development for perishable produce to prevent distress selling.",
    benefits: [
      "50% transport & storage subsidy for surplus produce",
      "Direct market linkage support",
      "Cluster-based value-addition grants",
    ],
    link: "https://mofpi.gov.in/Schemes/operation-greens",
  },
];
