/** Building material categories, units, and sale-line helpers */

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
  "Fancy Gates",
  "Door Patti",
  "Windows",
  "Other",
] as const;

export const SALE_UNITS = [
  "Per Bag",
  "Per Box",
  "Per Meter",
  "Per Square Feet",
  "Per Feet",
  "Per KG",
  "Per Piece",
  "Per Set",
  "Per Ctn",
] as const;

export type SaleUnit = (typeof SALE_UNITS)[number];

export const CATEGORY_DEFAULT_UNITS: Record<string, SaleUnit[]> = {
  Cement: ["Per Bag"],
  Bond: ["Per Bag"],
  Tiles: ["Per Box", "Per Meter", "Per Square Feet"],
  Scatting: ["Per Feet"],
  Marble: ["Per Feet"],
  "Wash Basin": ["Per Piece"],
  Steel: ["Per KG"],
  "T Iron": ["Per Feet"],
  Girders: ["Per Feet"],
  Chokhat: ["Per Piece", "Per Set"],
  "Fancy Gates": ["Per Piece", "Per Set"],
  "Door Patti": ["Per Feet", "Per Piece"],
  Windows: ["Per Piece", "Per Set"],
  Other: ["Per Piece", "Per Bag", "Per Feet"],
};

export const DELIVERY_STATUSES = [
  "draft",
  "pending_delivery",
  "partially_delivered",
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
