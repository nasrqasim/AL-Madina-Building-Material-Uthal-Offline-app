/** Building material categories, units, brands, sizes, and sale-line helpers */

// ─── Main Categories ────────────────────────────────────────────────────────
export const BUILDING_CATEGORIES = [
  "Cement",
  "Bond",
  "Tiles",
  "Scatting",
  "Marble",
  "Wash Basin",
  "Steel",
  "T Iron",
  "Girders",
  "Chokhat",
  "Wooden Doors",
  "Fancy Gates",
  "Door Patti",
  "Windows",
  "Cement Sheets",
  "Cement Slab",
  "Paint",
  "Pipes & Fittings",
  "Electric",
  "Hardware",
  "Other",
] as const;

// ─── Sub-Categories per Main Category ────────────────────────────────────────
export const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  Cement: ["OPC Cement", "SRC Cement", "White Cement", "Block Cement"],
  Bond: ["Construction Bond", "Tile Bond", "Marble Bond"],
  Tiles: ["Chouka Tiles", "Wall Tiles", "Floor Tiles", "Porcelain Tiles", "Mosaic Tiles", "Border Tiles"],
  Scatting: ["PVC Scatting", "Marble Scatting", "Granite Scatting"],
  Marble: ["Natural Marble", "Artificial Marble", "Marble Patti", "Marble Chips"],
  "Wash Basin": ["Normal Basin", "Medium Basin", "Large Basin", "Extra Large Basin", "Diamond Basin", "Designer Basin"],
  Steel: ["Rebar / Sarya", "Bending Wire", "MS Wire", "Binding Wire"],
  "T Iron": ["Standard T Iron", "Heavy T Iron"],
  Girders: ["Light Girders", "Medium Girders", "Heavy Girders"],
  Chokhat: ["Single Padam", "Double Padam", "Designer Chokhat"],
  "Wooden Doors": ["Solid Wood Door", "Ply Wood Door", "Flush Door", "Panel Door", "Carved Door"],
  "Fancy Gates": ["Iron Gates", "Steel Gates", "Designer Gates"],
  "Door Patti": ["Wood Door Patti", "PVC Door Patti"],
  Windows: ["Wooden Windows", "Aluminum Windows", "Iron Windows", "PVC Windows"],
  "Cement Sheets": ["Standard Sheets", "Corrugated Sheets"],
  "Cement Slab": ["Reinforced Slab", "Plain Slab"],
  Paint: ["Wall Paint", "Wood Paint", "Primer", "Distemper", "Enamel"],
  "Pipes & Fittings": ["PVC Pipes", "GI Pipes", "Elbows", "Tees", "Valves"],
  Electric: ["Wires", "Switches", "Sockets", "MCB", "Conduit"],
  Hardware: ["Nails", "Screws", "Hinges", "Locks", "Bolts"],
  Other: ["Miscellaneous"],
};

// ─── Brands per Main Category ────────────────────────────────────────────────
export const CATEGORY_BRANDS: Record<string, string[]> = {
  Cement: ["DG Cement", "Lucky Cement", "Falcon Cement", "Rock Cement", "Maple Leaf", "Bestway Cement", "Fauji Cement", "Kohat Cement", "Pioneer Cement", "Cherat Cement"],
  Bond: ["DG Bond", "Prechem Bond", "Star Bond", "MYK Laticrete", "Bostik"],
  Tiles: ["Master Tiles", "Shabbir Tiles", "National Tiles", "Swat Ceramics", "Verona Tiles", "RAK Ceramics", "Karam Ceramics", "Multan Tiles"],
  Scatting: ["Black", "Verona", "Terwala", "Black Gold", "Royal Green", "Sunny Grey", "Crystal White"],
  Marble: ["Ziarat White", "Badal", "Black & Gold", "Sunny Grey", "Botticino", "Verona Red", "Green Onyx", "Afghan White"],
  "Wash Basin": ["Master", "Porta", "Bella", "Diamond", "Crown", "Royal"],
  Steel: ["Amreli Steel", "Pakistan Steel", "Mughal Steel", "Ittefaq Steel", "Kamran Steel", "AF Steel"],
  "T Iron": ["Ittefaq", "Mughal", "Pakistan Steel", "Capital Steel"],
  Girders: ["Pakistan Steel", "Mughal", "Amreli", "Razaq Steel"],
  Chokhat: ["Diyar Wood", "Shisham", "Kail Wood", "Imported Pine"],
  "Wooden Doors": ["Diyar Wood", "Shisham Wood", "Kail Wood", "Pine Wood", "Teak Wood", "Local Wood"],
  "Fancy Gates": ["Local", "Imported", "MS Steel", "Cast Iron"],
  "Door Patti": ["Local Wood", "Imported PVC", "Fiber"],
  Windows: ["Diyar Wood", "Shisham Wood", "Aluminum Corp", "Techno", "Pak Aluminum", "Euro Style", "Local"],
  "Cement Sheets": ["Local", "Imported", "Premium Sheets"],
  "Cement Slab": ["Local Block Works", "Premium Slab Maker"],
  Paint: ["Nippon", "Diamond", "Berger", "ICI Dulux", "Master Paint", "Brighto"],
  "Pipes & Fittings": ["Popular", "Dadex", "Haji Sons", "Saif Pipes"],
  Electric: ["Pakistan Cable", "Fast Cable", "GM", "Schneider"],
  Hardware: ["Stanley", "Local", "Faisal", "National"],
  Other: ["General"],
};

// ─── Selling Units ───────────────────────────────────────────────────────────
export const SALE_UNITS = [
  "Per Bag",
  "Per Box",
  "Per Meter",
  "Per Square Feet",
  "Per Square Meter",
  "Per Feet",
  "Per KG",
  "Per Ton",
  "Per Piece",
  "Per Set",
  "Per Pair",
  "Per Bundle",
  "Per Sheet",
  "Per Carton",
  "Per Liter",
  "Per Gallon",
  "Per Roll",
  "Per Packet",
  "Per Dozen",
] as const;

export type SaleUnit = (typeof SALE_UNITS)[number];

// ─── Category → Default Selling Units ────────────────────────────────────────
export const CATEGORY_DEFAULT_UNITS: Record<string, SaleUnit[]> = {
  Cement: ["Per Bag"],
  Bond: ["Per Bag"],
  Tiles: ["Per Square Feet", "Per Feet", "Per Box", "Per Meter"],
  Scatting: ["Per Feet"],
  Marble: ["Per Feet", "Per Square Feet"],
  "Wash Basin": ["Per Piece"],
  Steel: ["Per KG"],
  "T Iron": ["Per Feet"],
  Girders: ["Per Feet"],
  Chokhat: ["Per Piece", "Per Set"],
  "Wooden Doors": ["Per Piece", "Per Square Feet", "Per Set"],
  "Fancy Gates": ["Per Piece", "Per Set"],
  "Door Patti": ["Per Feet", "Per Piece"],
  Windows: ["Per Piece", "Per Square Feet", "Per Set"],
  "Cement Sheets": ["Per Sheet"],
  "Cement Slab": ["Per Square Feet"],
  Paint: ["Per Gallon", "Per Liter", "Per KG"],
  "Pipes & Fittings": ["Per Feet", "Per Piece"],
  Electric: ["Per Meter", "Per Piece", "Per Roll"],
  Hardware: ["Per KG", "Per Piece", "Per Packet", "Per Dozen"],
  Other: ["Per Piece", "Per Bag", "Per Feet"],
};

// ─── Category → Available Sizes / Variants ───────────────────────────────────
export const CATEGORY_SIZES: Record<string, string[]> = {
  Cement: ["50 KG Bag"],
  Bond: ["20 KG Bag", "40 KG Bag"],
  Tiles: ["Chouka 12x12", "Chouka 10x10", "Chouka 8x8", "10x12", "12x24", "24x24", "24x48", "1.5x1.5", "2x2", "12x12", "16x16", "8x10", "8x12", "30x30", "30x60", "60x60", "60x120"],
  Scatting: ["4 inch", "6 inch", "8 inch"],
  Marble: ["12x12", "12x24", "24x24", "Custom Cut"],
  "Marble Patti": ["1/2 inch", "1/3 inch", "1 inch", "1.5 inch", "2 inch", "3 inch"],
  "Wash Basin": ["Normal", "Medium", "Large", "Extra Large", "Best", "Diamond"],
  Steel: ["2 Sutar (6mm)", "3 Sutar (10mm)", "4 Sutar (12mm)", "5 Sutar (16mm)", "6 Sutar (20mm)", "7 Sutar (22mm)", "8 Sutar (25mm)"],
  "T Iron": ["425 Gram/ft", "450 Gram/ft", "500 Gram/ft", "600 Gram/ft"],
  Girders: ["3500 g/ft", "4800 g/ft", "6500 g/ft", "8000 g/ft"],
  Chokhat: ["2x6", "2.5x6", "3x6", "3x7", "3.5x7", "4x7", "Double Padam"],
  "Wooden Doors": ["2.5x7", "3x7", "3.5x7", "4x7", "Custom Size"],
  "Fancy Gates": ["3x7", "4x7", "4x8", "5x8", "Custom Size"],
  "Door Patti": ["2 inch", "3 inch", "4 inch", "6 inch"],
  Windows: ["1.5x1.5", "2.5x2.5", "2x2", "3x3", "3x4", "4x4", "4x5", "5x5", "Custom Size"],
  "Cement Sheets": ["6 Feet", "7 Feet", "8 Feet", "10 Feet"],
  "Cement Slab": ["1.5x2", "2x2", "2.5x2", "3x1.5", "3x2", "3.5x1.5", "3.5x2", "4x1.5", "4x2"],
};

// ─── Delivery Statuses ───────────────────────────────────────────────────────
export const DELIVERY_STATUSES = [
  "draft",
  "pending_delivery",
  "partially_delivered",
  "fully_delivered",
  "completed",
  "posted",
  "cancelled",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export function deliveryStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: "Draft",
    pending_delivery: "Pending Delivery",
    partially_delivered: "Partially Delivered",
    fully_delivered: "Fully Delivered",
    completed: "Completed",
    posted: "Posted",
    cancelled: "Cancelled",
  };
  return map[status?.toLowerCase()] || status || "Posted";
}

export function computeDeliveryStatus(
  lines: { qty?: number; cartons?: number; isReceived?: boolean; deliveredQty?: number }[]
): DeliveryStatus {
  const active = lines.filter((l) => (l.qty ?? l.cartons ?? 0) > 0);
  if (active.length === 0) return "draft";
  let allReceived = true;
  let anyReceived = false;
  for (const line of active) {
    const qty = Number(line.qty ?? line.cartons ?? 0);
    const delivered = line.isReceived ? qty : Number(line.deliveredQty ?? 0);
    if (delivered > 0) anyReceived = true;
    if (delivered < qty) allReceived = false;
  }
  if (allReceived) return "completed";
  if (anyReceived) return "partially_delivered";
  return "pending_delivery";
}

export function lineQty(line: { qty?: number; cartons?: number; gallons?: number; liters?: number }): number {
  const q = Number(line.qty ?? line.cartons ?? 0);
  if (q > 0) return q;
  const liters = Number(line.liters ?? 0);
  const gallons = Number(line.gallons ?? 0);
  if (liters > 0) return liters;
  if (gallons > 0) return gallons;
  return 0;
}

// ─── Sample Seed Items ───────────────────────────────────────────────────────
// These are used by seedOfflineDatabase to create default products
export interface SeedItem {
  name: string;
  category: string;
  subCategory: string;
  brand: string;
  unit: SaleUnit;
  size: string;
  purchaseRate: number;
  retailRate: number;
  wholesaleRate: number;
  openingStock: number;
}

export const SEED_ITEMS: SeedItem[] = [
  // ── Cement ──
  { name: "DG Cement OPC",       category: "Cement", subCategory: "OPC Cement",   brand: "DG Cement",     unit: "Per Bag", size: "50 KG Bag", purchaseRate: 1100, retailRate: 1250, wholesaleRate: 1200, openingStock: 500 },
  { name: "DG Cement SRC",       category: "Cement", subCategory: "SRC Cement",   brand: "DG Cement",     unit: "Per Bag", size: "50 KG Bag", purchaseRate: 1150, retailRate: 1300, wholesaleRate: 1260, openingStock: 300 },
  { name: "Lucky Cement OPC",    category: "Cement", subCategory: "OPC Cement",   brand: "Lucky Cement",  unit: "Per Bag", size: "50 KG Bag", purchaseRate: 1080, retailRate: 1220, wholesaleRate: 1180, openingStock: 400 },
  { name: "Falcon Cement",       category: "Cement", subCategory: "OPC Cement",   brand: "Falcon Cement", unit: "Per Bag", size: "50 KG Bag", purchaseRate: 1050, retailRate: 1200, wholesaleRate: 1150, openingStock: 200 },
  { name: "Rock Cement",         category: "Cement", subCategory: "OPC Cement",   brand: "Rock Cement",   unit: "Per Bag", size: "50 KG Bag", purchaseRate: 1020, retailRate: 1180, wholesaleRate: 1120, openingStock: 150 },
  { name: "White Cement",        category: "Cement", subCategory: "White Cement",  brand: "Lucky Cement",  unit: "Per Bag", size: "50 KG Bag", purchaseRate: 1800, retailRate: 2100, wholesaleRate: 2000, openingStock: 100 },
  { name: "Block Cement",        category: "Cement", subCategory: "Block Cement",  brand: "DG Cement",     unit: "Per Bag", size: "50 KG Bag", purchaseRate: 950,  retailRate: 1100, wholesaleRate: 1050, openingStock: 80 },

  // ── Bond ──
  { name: "DG Bond 20KG",        category: "Bond", subCategory: "Construction Bond", brand: "DG Bond",     unit: "Per Bag", size: "20 KG Bag", purchaseRate: 650,  retailRate: 800,  wholesaleRate: 750,  openingStock: 200 },
  { name: "Prechem Bond 20KG",   category: "Bond", subCategory: "Tile Bond",         brand: "Prechem Bond",unit: "Per Bag", size: "20 KG Bag", purchaseRate: 700,  retailRate: 850,  wholesaleRate: 800,  openingStock: 150 },
  { name: "Star Bond 20KG",      category: "Bond", subCategory: "Construction Bond", brand: "Star Bond",   unit: "Per Bag", size: "20 KG Bag", purchaseRate: 550,  retailRate: 700,  wholesaleRate: 650,  openingStock: 100 },
  { name: "DG Bond 40KG",        category: "Bond", subCategory: "Construction Bond", brand: "DG Bond",     unit: "Per Bag", size: "40 KG Bag", purchaseRate: 1200, retailRate: 1450, wholesaleRate: 1380, openingStock: 80 },

  // ── Tiles ──
  { name: "Chouka Tile 12x12",         category: "Tiles", subCategory: "Chouka Tiles",     brand: "Master Tiles", unit: "Per Square Feet", size: "Chouka 12x12", purchaseRate: 40,  retailRate: 65,  wholesaleRate: 55,  openingStock: 2000 },
  { name: "Chouka Tile 10x10",         category: "Tiles", subCategory: "Chouka Tiles",     brand: "National Tiles",unit: "Per Feet",        size: "Chouka 10x10", purchaseRate: 35,  retailRate: 55,  wholesaleRate: 48,  openingStock: 1500 },
  { name: "Master Floor Tile 24x24",   category: "Tiles", subCategory: "Floor Tiles",     brand: "Master Tiles", unit: "Per Box",         size: "24x24",  purchaseRate: 850,  retailRate: 1100, wholesaleRate: 1000, openingStock: 300 },
  { name: "Master Wall Tile 12x24",    category: "Tiles", subCategory: "Wall Tiles",      brand: "Master Tiles", unit: "Per Box",         size: "12x24",  purchaseRate: 650,  retailRate: 850,  wholesaleRate: 780,  openingStock: 250 },
  { name: "Shabbir Floor Tile 24x48",  category: "Tiles", subCategory: "Floor Tiles",     brand: "Shabbir Tiles",unit: "Per Box",         size: "24x48",  purchaseRate: 1200, retailRate: 1550, wholesaleRate: 1450, openingStock: 150 },
  { name: "National Wall Tile 10x12",  category: "Tiles", subCategory: "Wall Tiles",      brand: "National Tiles",unit: "Per Box",        size: "10x12",  purchaseRate: 450,  retailRate: 600,  wholesaleRate: 550,  openingStock: 200 },
  { name: "Porcelain Tile 60x60",      category: "Tiles", subCategory: "Porcelain Tiles", brand: "RAK Ceramics", unit: "Per Square Meter", size: "60x60",  purchaseRate: 1800, retailRate: 2400, wholesaleRate: 2200, openingStock: 100 },
  { name: "Mosaic Tile 1.5x1.5",       category: "Tiles", subCategory: "Mosaic Tiles",    brand: "Swat Ceramics",unit: "Per Square Feet", size: "1.5x1.5", purchaseRate: 120,  retailRate: 180,  wholesaleRate: 160,  openingStock: 500 },

  // ── Scatting ──
  { name: "Black Scatting 4 inch",      category: "Scatting", subCategory: "PVC Scatting",    brand: "Black",      unit: "Per Feet", size: "4 inch", purchaseRate: 45,  retailRate: 70,  wholesaleRate: 60,  openingStock: 1000 },
  { name: "Black Scatting 6 inch",      category: "Scatting", subCategory: "PVC Scatting",    brand: "Black",      unit: "Per Feet", size: "6 inch", purchaseRate: 65,  retailRate: 95,  wholesaleRate: 85,  openingStock: 800 },
  { name: "Verona Scatting 4 inch",     category: "Scatting", subCategory: "Marble Scatting", brand: "Verona",     unit: "Per Feet", size: "4 inch", purchaseRate: 80,  retailRate: 120, wholesaleRate: 105, openingStock: 600 },
  { name: "Terwala Scatting 6 inch",    category: "Scatting", subCategory: "Marble Scatting", brand: "Terwala",    unit: "Per Feet", size: "6 inch", purchaseRate: 95,  retailRate: 140, wholesaleRate: 125, openingStock: 400 },
  { name: "Black Gold Scatting 4 inch", category: "Scatting", subCategory: "Granite Scatting",brand: "Black Gold", unit: "Per Feet", size: "4 inch", purchaseRate: 110, retailRate: 160, wholesaleRate: 145, openingStock: 300 },

  // ── Marble ──
  { name: "Ziarat White Marble",     category: "Marble", subCategory: "Natural Marble",    brand: "Ziarat White",  unit: "Per Feet", size: "Custom Cut", purchaseRate: 180, retailRate: 280, wholesaleRate: 250, openingStock: 200 },
  { name: "Badal Marble",            category: "Marble", subCategory: "Natural Marble",    brand: "Badal",         unit: "Per Feet", size: "Custom Cut", purchaseRate: 220, retailRate: 350, wholesaleRate: 310, openingStock: 150 },
  { name: "Sunny Grey Marble",       category: "Marble", subCategory: "Natural Marble",    brand: "Sunny Grey",    unit: "Per Feet", size: "12x24",      purchaseRate: 160, retailRate: 250, wholesaleRate: 220, openingStock: 180 },
  { name: "Marble Patti 1/2 inch",   category: "Marble", subCategory: "Marble Patti",      brand: "Ziarat White",  unit: "Per Feet", size: "1/2 inch",   purchaseRate: 30,  retailRate: 50,  wholesaleRate: 42,  openingStock: 2000 },
  { name: "Marble Patti 1 inch",     category: "Marble", subCategory: "Marble Patti",      brand: "Ziarat White",  unit: "Per Feet", size: "1 inch",     purchaseRate: 45,  retailRate: 70,  wholesaleRate: 60,  openingStock: 1500 },
  { name: "Marble Patti 1.5 inch",   category: "Marble", subCategory: "Marble Patti",      brand: "Badal",         unit: "Per Feet", size: "1.5 inch",   purchaseRate: 55,  retailRate: 85,  wholesaleRate: 75,  openingStock: 1000 },

  // ── Wash Basin ──
  { name: "Wash Basin Normal",        category: "Wash Basin", subCategory: "Normal Basin",      brand: "Master",  unit: "Per Piece", size: "Normal",      purchaseRate: 1200, retailRate: 1800, wholesaleRate: 1600, openingStock: 30 },
  { name: "Wash Basin Medium",        category: "Wash Basin", subCategory: "Medium Basin",      brand: "Porta",   unit: "Per Piece", size: "Medium",      purchaseRate: 2500, retailRate: 3500, wholesaleRate: 3200, openingStock: 25 },
  { name: "Wash Basin Large",         category: "Wash Basin", subCategory: "Large Basin",       brand: "Bella",   unit: "Per Piece", size: "Large",       purchaseRate: 4000, retailRate: 5500, wholesaleRate: 5000, openingStock: 15 },
  { name: "Wash Basin Extra Large",   category: "Wash Basin", subCategory: "Extra Large Basin", brand: "Crown",   unit: "Per Piece", size: "Extra Large", purchaseRate: 5500, retailRate: 7500, wholesaleRate: 6800, openingStock: 10 },
  { name: "Diamond Wash Basin",       category: "Wash Basin", subCategory: "Diamond Basin",     brand: "Diamond", unit: "Per Piece", size: "Best",        purchaseRate: 8000, retailRate: 11000,wholesaleRate: 10000,openingStock: 5 },

  // ── Steel / Sarya ──
  { name: "Steel 2 Sutar (6mm)",   category: "Steel", subCategory: "Rebar / Sarya", brand: "Amreli Steel",   unit: "Per KG", size: "2 Sutar (6mm)",  purchaseRate: 245, retailRate: 280, wholesaleRate: 265, openingStock: 5000 },
  { name: "Steel 3 Sutar (10mm)",  category: "Steel", subCategory: "Rebar / Sarya", brand: "Amreli Steel",   unit: "Per KG", size: "3 Sutar (10mm)", purchaseRate: 240, retailRate: 275, wholesaleRate: 260, openingStock: 8000 },
  { name: "Steel 4 Sutar (12mm)",  category: "Steel", subCategory: "Rebar / Sarya", brand: "Mughal Steel",   unit: "Per KG", size: "4 Sutar (12mm)", purchaseRate: 238, retailRate: 272, wholesaleRate: 258, openingStock: 10000 },
  { name: "Steel 5 Sutar (16mm)",  category: "Steel", subCategory: "Rebar / Sarya", brand: "Pakistan Steel", unit: "Per KG", size: "5 Sutar (16mm)", purchaseRate: 235, retailRate: 270, wholesaleRate: 255, openingStock: 6000 },
  { name: "Bending Wire",          category: "Steel", subCategory: "Bending Wire",   brand: "Ittefaq Steel",  unit: "Per KG", size: "Standard",       purchaseRate: 260, retailRate: 300, wholesaleRate: 285, openingStock: 2000 },

  // ── T Iron ──
  { name: "T Iron 425 Gram",  category: "T Iron", subCategory: "Standard T Iron", brand: "Ittefaq",        unit: "Per Feet", size: "425 Gram/ft", purchaseRate: 95,  retailRate: 130, wholesaleRate: 115, openingStock: 3000 },
  { name: "T Iron 450 Gram",  category: "T Iron", subCategory: "Standard T Iron", brand: "Mughal",         unit: "Per Feet", size: "450 Gram/ft", purchaseRate: 105, retailRate: 140, wholesaleRate: 125, openingStock: 2500 },
  { name: "T Iron 500 Gram",  category: "T Iron", subCategory: "Standard T Iron", brand: "Pakistan Steel", unit: "Per Feet", size: "500 Gram/ft", purchaseRate: 120, retailRate: 160, wholesaleRate: 145, openingStock: 2000 },

  // ── Girders ──
  { name: "Girder 3500 g/ft", category: "Girders", subCategory: "Light Girders",  brand: "Pakistan Steel", unit: "Per Feet", size: "3500 g/ft", purchaseRate: 750,  retailRate: 950,  wholesaleRate: 880,  openingStock: 500 },
  { name: "Girder 4800 g/ft", category: "Girders", subCategory: "Medium Girders", brand: "Mughal",         unit: "Per Feet", size: "4800 g/ft", purchaseRate: 1050, retailRate: 1350, wholesaleRate: 1250, openingStock: 400 },
  { name: "Girder 6500 g/ft", category: "Girders", subCategory: "Heavy Girders",  brand: "Amreli",         unit: "Per Feet", size: "6500 g/ft", purchaseRate: 1400, retailRate: 1800, wholesaleRate: 1650, openingStock: 300 },

  // ── Chokhat ──
  { name: "Chokhat 2x6",         category: "Chokhat", subCategory: "Single Padam",     brand: "Diyar Wood", unit: "Per Piece", size: "2x6",          purchaseRate: 3500, retailRate: 4500, wholesaleRate: 4100, openingStock: 50 },
  { name: "Chokhat 2.5x6",       category: "Chokhat", subCategory: "Single Padam",     brand: "Shisham",    unit: "Per Piece", size: "2.5x6",        purchaseRate: 4000, retailRate: 5200, wholesaleRate: 4800, openingStock: 40 },
  { name: "Chokhat 3x6",         category: "Chokhat", subCategory: "Single Padam",     brand: "Shisham",    unit: "Per Piece", size: "3x6",          purchaseRate: 4500, retailRate: 5800, wholesaleRate: 5400, openingStock: 35 },
  { name: "Chokhat 3x7",         category: "Chokhat", subCategory: "Single Padam",     brand: "Kail Wood",  unit: "Per Piece", size: "3x7",          purchaseRate: 5000, retailRate: 6500, wholesaleRate: 6000, openingStock: 30 },
  { name: "Chokhat 3.5x7",       category: "Chokhat", subCategory: "Single Padam",     brand: "Kail Wood",  unit: "Per Piece", size: "3.5x7",        purchaseRate: 5500, retailRate: 7200, wholesaleRate: 6600, openingStock: 25 },
  { name: "Chokhat Double Padam",category: "Chokhat", subCategory: "Double Padam",     brand: "Shisham",    unit: "Per Piece", size: "Double Padam",  purchaseRate: 7500, retailRate: 9800, wholesaleRate: 9000, openingStock: 15 },

  // ── Wooden Doors ──
  { name: "Wooden Door 3x7",        category: "Wooden Doors", subCategory: "Solid Wood Door", brand: "Diyar Wood",   unit: "Per Piece", size: "3x7",   purchaseRate: 12000, retailRate: 16000, wholesaleRate: 14500, openingStock: 20 },
  { name: "Wooden Door 3.5x7",      category: "Wooden Doors", subCategory: "Solid Wood Door", brand: "Shisham Wood", unit: "Per Piece", size: "3.5x7", purchaseRate: 15000, retailRate: 20000, wholesaleRate: 18000, openingStock: 15 },
  { name: "Wooden Door 2.5x7",      category: "Wooden Doors", subCategory: "Ply Wood Door",   brand: "Kail Wood",    unit: "Per Piece", size: "2.5x7", purchaseRate: 8000,  retailRate: 11000, wholesaleRate: 9800,  openingStock: 25 },

  // ── Fancy Gates ──
  { name: "Fancy Gate 3x7",  category: "Fancy Gates", subCategory: "Iron Gates",     brand: "Local",    unit: "Per Piece", size: "3x7",         purchaseRate: 12000, retailRate: 16000, wholesaleRate: 14500, openingStock: 10 },
  { name: "Fancy Gate 4x7",  category: "Fancy Gates", subCategory: "Steel Gates",    brand: "MS Steel", unit: "Per Piece", size: "4x7",         purchaseRate: 18000, retailRate: 24000, wholesaleRate: 22000, openingStock: 8 },
  { name: "Designer Gate",   category: "Fancy Gates", subCategory: "Designer Gates", brand: "Imported", unit: "Per Piece", size: "Custom Size", purchaseRate: 35000, retailRate: 48000, wholesaleRate: 42000, openingStock: 5 },

  // ── Door Patti ──
  { name: "Door Patti 2 inch", category: "Door Patti", subCategory: "Wood Door Patti", brand: "Local Wood", unit: "Per Feet", size: "2 inch", purchaseRate: 25,  retailRate: 40,  wholesaleRate: 35,  openingStock: 5000 },
  { name: "Door Patti 3 inch", category: "Door Patti", subCategory: "Wood Door Patti", brand: "Local Wood", unit: "Per Feet", size: "3 inch", purchaseRate: 35,  retailRate: 55,  wholesaleRate: 48,  openingStock: 4000 },
  { name: "Door Patti 4 inch", category: "Door Patti", subCategory: "Wood Door Patti", brand: "Local Wood", unit: "Per Feet", size: "4 inch", purchaseRate: 50,  retailRate: 75,  wholesaleRate: 65,  openingStock: 3000 },

  // ── Windows ──
  { name: "Window 1.5x1.5", category: "Windows", subCategory: "Wooden Windows",   brand: "Diyar Wood",   unit: "Per Piece", size: "1.5x1.5", purchaseRate: 1800, retailRate: 2600, wholesaleRate: 2300, openingStock: 40 },
  { name: "Window 2.5x2.5", category: "Windows", subCategory: "Wooden Windows",   brand: "Shisham Wood", unit: "Per Piece", size: "2.5x2.5", purchaseRate: 3000, retailRate: 4200, wholesaleRate: 3800, openingStock: 30 },
  { name: "Window 2x2",     category: "Windows", subCategory: "Aluminum Windows", brand: "Pak Aluminum", unit: "Per Piece", size: "2x2",     purchaseRate: 2500, retailRate: 3500, wholesaleRate: 3100, openingStock: 30 },
  { name: "Window 3x3",     category: "Windows", subCategory: "Aluminum Windows", brand: "Pak Aluminum", unit: "Per Piece", size: "3x3",     purchaseRate: 4000, retailRate: 5500, wholesaleRate: 5000, openingStock: 25 },
  { name: "Window 3x4",     category: "Windows", subCategory: "Aluminum Windows", brand: "Techno",       unit: "Per Piece", size: "3x4",     purchaseRate: 5000, retailRate: 6800, wholesaleRate: 6200, openingStock: 20 },
  { name: "Window 4x4",     category: "Windows", subCategory: "Iron Windows",     brand: "Local",        unit: "Per Piece", size: "4x4",     purchaseRate: 6500, retailRate: 8800, wholesaleRate: 8000, openingStock: 15 },

  // ── Cement Sheets (Chadar) ──
  { name: "Cement Sheet 8 Feet", category: "Cement Sheets", subCategory: "Standard Sheets", brand: "Local", unit: "Per Sheet", size: "8 Feet", purchaseRate: 950, retailRate: 1200, wholesaleRate: 1100, openingStock: 150 },
  { name: "Cement Sheet 10 Feet", category: "Cement Sheets", subCategory: "Standard Sheets", brand: "Local", unit: "Per Sheet", size: "10 Feet", purchaseRate: 1200, retailRate: 1500, wholesaleRate: 1400, openingStock: 120 },

  // ── Cement Slab (Slab) ──
  { name: "Cement Slab 3x2", category: "Cement Slab", subCategory: "Reinforced Slab", brand: "Local Block Works", unit: "Per Square Feet", size: "3x2", purchaseRate: 420, retailRate: 600, wholesaleRate: 540, openingStock: 200 },
  { name: "Cement Slab 4x2", category: "Cement Slab", subCategory: "Reinforced Slab", brand: "Local Block Works", unit: "Per Square Feet", size: "4x2", purchaseRate: 560, retailRate: 800, wholesaleRate: 720, openingStock: 150 },
];
