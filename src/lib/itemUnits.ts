/** Carton / gallon / litre conversion helpers (aligned with sale invoice logic). */

export function isFilterItem(name?: string, description?: string): boolean {
  const text = `${name || ""} ${description || ""}`.toLowerCase();
  return text.includes("filter") || text.includes("fliter");
}

export type PackSizeMode = "sale" | "purchase";

export function getPackSizes(
  item?: {
    name?: string;
    gallonsInCtn?: number;
    litersInCtn?: number;
  } | null,
  mode: PackSizeMode = "sale"
) {
  const g = Number(item?.gallonsInCtn);
  const l = Number(item?.litersInCtn);

  // Item master overrides when both pack sizes are set
  if (g > 0 && l > 0) {
    return { gallonsInCtn: g, litersInCtn: l };
  }

  // Purchase: always use oil-style carton pack (4 gal / 16 L) unless master has values
  if (mode === "purchase") {
    return {
      gallonsInCtn: g > 0 ? g : 4,
      litersInCtn: l > 0 ? l : 16,
    };
  }

  // Sale: filters/spare parts count as 1 piece per carton
  const isFilter = isFilterItem(item?.name);
  return {
    gallonsInCtn: isFilter ? 1 : g > 0 ? g : 4,
    litersInCtn: isFilter ? 1 : l > 0 ? l : 16,
  };
}

export function applyCartonGallonLiterConversion<
  T extends { cartons?: number | string; gallons?: number | string; liters?: number | string }
>(
  line: T,
  field: "cartons" | "gallons" | "liters",
  value: number,
  item?: { name?: string; gallonsInCtn?: number; litersInCtn?: number } | null,
  mode: PackSizeMode = "sale"
): T {
  const { gallonsInCtn, litersInCtn } = getPackSizes(item, mode);
  const updated = { ...line };

  if (field === "cartons") {
    updated.cartons = value;
    updated.gallons = value * gallonsInCtn;
    updated.liters = value * litersInCtn;
  } else if (field === "gallons") {
    updated.gallons = value;
    updated.cartons = gallonsInCtn > 0 ? value / gallonsInCtn : 0;
    updated.liters = gallonsInCtn > 0 ? (value / gallonsInCtn) * litersInCtn : 0;
  } else if (field === "liters") {
    updated.liters = value;
    updated.cartons = litersInCtn > 0 ? value / litersInCtn : 0;
    updated.gallons = litersInCtn > 0 ? (value / litersInCtn) * gallonsInCtn : 0;
  }

  return updated;
}

export type UnitLine = {
  cartons?: number | string;
  gallons?: number | string;
  liters?: number | string;
};

/** Apply a cartons/gallons/liters edit with linked conversion (skips sync while value is ""). */
export function applyUnitFieldUpdate<T extends UnitLine>(
  line: T,
  field: "cartons" | "gallons" | "liters",
  value: number | string,
  item?: { name?: string; gallonsInCtn?: number; litersInCtn?: number } | null,
  mode: PackSizeMode = "sale"
): T {
  const updated = { ...line, [field]: value };
  if (value === "") return updated;
  const num = Number(value);
  if (Number.isNaN(num)) return updated;
  const converted = applyCartonGallonLiterConversion(updated, field, num, item, mode);
  return {
    ...converted,
    cartons: roundUnit(converted.cartons),
    gallons: roundUnit(converted.gallons),
    liters: roundUnit(converted.liters),
  };
}

function roundUnit(n: number | string | undefined): number {
  const v = Number(n) || 0;
  return Math.round(v * 10000) / 10000;
}

/** Default qty when an item is picked: 1 CTN → pack gallons/liters. */
export function defaultUnitsForItem<T extends UnitLine>(
  line: T,
  item?: { name?: string; gallonsInCtn?: number; litersInCtn?: number } | null,
  mode: PackSizeMode = "sale"
): T {
  const { gallonsInCtn, litersInCtn } = getPackSizes(item, mode);
  return {
    ...line,
    cartons: 1,
    gallons: gallonsInCtn,
    liters: litersInCtn,
  };
}

/** Purchase invoices: 1 CTN → 4 GAL → 16 L (filters use master 1:1 only if set on item). */
export const PURCHASE_PACK_MODE: PackSizeMode = "purchase";

export function applyPurchaseUnitFieldUpdate<T extends UnitLine>(
  line: T,
  field: "cartons" | "gallons" | "liters",
  value: number | string,
  item?: { name?: string; gallonsInCtn?: number; litersInCtn?: number } | null
): T {
  return applyUnitFieldUpdate(line, field, value, item, PURCHASE_PACK_MODE);
}

export function defaultPurchaseUnitsForItem<T extends UnitLine>(
  line: T,
  item?: { name?: string; gallonsInCtn?: number; litersInCtn?: number } | null
): T {
  return defaultUnitsForItem(line, item, PURCHASE_PACK_MODE);
}

/** Resolve catalog item from line id or code (for unit sync when itemId missing). */
export function resolveCatalogItem<
  T extends { _id?: string; code?: string }
>(
  items: T[],
  line: { itemId?: string; itemCode?: string }
): T | undefined {
  if (line.itemId) return items.find((i) => i._id === line.itemId);
  const code = String(line.itemCode || "").trim();
  if (code) return items.find((i) => String(i.code || "").trim() === code);
  return undefined;
}

/** Stock movement quantity in pieces (cartons for filters and general line items). */
export function lineStockQty(line: { cartons?: number; qty?: number }): number {
  const cartons = Number(line.cartons) || 0;
  const qty = Number(line.qty) || 0;
  if (cartons > 0) return cartons;
  if (qty > 0) return qty;
  return 0;
}

export function filterAndSortItems<
  T extends { _id: string; code?: string; name?: string; barcode?: string; brand?: string; category?: string; brandId?: string; mainCategoryId?: string }
>(items: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  const tokens = q.split(/\s+/).filter(Boolean);

  const scored = items
    .map((item) => {
      const code = String(item.code || "").toLowerCase();
      const name = String(item.name || "").toLowerCase();
      const barcode = String(item.barcode || "").toLowerCase();
      const brand = String(item.brand || item.brandId || "").toLowerCase();
      const category = String(item.category || item.mainCategoryId || "").toLowerCase();
      const haystack = `${code} ${name} ${barcode} ${brand} ${category}`;
      let score = 0;

      if (code === q || name === q || barcode === q) score += 1000;
      if (code.includes(q) || name.includes(q) || barcode.includes(q)) score += 500;
      if (name.endsWith(` ${q}`) || name.endsWith(q) || code.endsWith(q) || barcode.endsWith(q)) score += 400;
      if (tokens.every((t) => haystack.includes(t))) score += 300;

      for (const t of tokens) {
        if (code === t || name === t || barcode === t || brand === t || category === t) score += 200;
        else if (code.startsWith(t) || name.startsWith(t) || barcode.startsWith(t) || brand.startsWith(t) || category.startsWith(t)) score += 120;
        else if (haystack.includes(t)) score += 80;
      }

      return { item, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((x) => x.item);
}
