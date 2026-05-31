/** Normalize MongoDB / API id fields for select value binding */
export function toIdString(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (o._id != null) return String(o._id);
    if (o.id != null) return String(o.id);
  }
  const s = String(value);
  return /^[a-f0-9]{24}$/i.test(s) ? s : "";
}

export function resolvePaymentAccountId(initialData: Record<string, unknown> | null | undefined): string {
  const accountId = resolveRefId(initialData, "paymentAccountId");
  if (accountId) return accountId;
  const method = String(initialData?.paymentMethod || "").toLowerCase();
  if (method === "cash") return "cash";
  if (method === "bank") return "bank";
  return "";
}

export type PurchaseLineRow = {
  id: string;
  itemId: string;
  itemCode?: string;
  description: string;
  cartons: number;
  gallons: number;
  liters: number;
  unitPrice: number;
  discPercent: number;
  total: number;
};

export function mapInvoiceLinesToRows(
  initialData: { lines?: unknown[]; items?: unknown[] } | null | undefined,
  mapRate: (line: Record<string, unknown>) => number = (l) => Number(l.rate ?? l.unitPrice ?? 0)
): PurchaseLineRow[] {
  const raw = initialData?.lines ?? initialData?.items ?? [];
  const src = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
  if (!src.length) {
    return [
      {
        id: "1",
        itemId: "",
        itemCode: "",
        description: "",
        cartons: 1,
        gallons: 4,
        liters: 16,
        unitPrice: 0,
        discPercent: 0,
        total: 0,
      },
    ];
  }
  return src.map((l, i) => {
    const itemRef = l.itemId as { _id?: string; code?: string; name?: string } | string | undefined;
    const itemId =
      typeof itemRef === "object" && itemRef?._id
        ? String(itemRef._id)
        : itemRef
          ? String(itemRef)
          : "";
    return {
      id: String(i),
      itemId,
      itemCode: String(l.itemCode ?? (typeof itemRef === "object" ? itemRef?.code : "") ?? ""),
      description: String(l.description ?? (typeof itemRef === "object" ? itemRef?.name : "") ?? ""),
      cartons: Number(l.cartons ?? l.qty ?? 0),
      gallons: Number(l.gallons ?? 0),
      liters: Number(l.liters ?? 0),
      unitPrice: mapRate(l),
      discPercent: Number(l.discountPercent ?? l.discPercent ?? 0),
      total: Number(l.netAmount ?? l.total ?? 0),
    };
  });
}

export function resolvePartyId(initialData: Record<string, unknown> | null | undefined): string {
  if (!initialData) return "";
  return toIdString(initialData.partyId);
}

export function resolveRefId(
  initialData: Record<string, unknown> | null | undefined,
  key: string
): string {
  if (!initialData) return "";
  return toIdString(initialData[key]);
}

export async function buildPersistedLines(
  rows: PurchaseLineRow[],
  availableItems: Array<{ _id: string; code?: string; name?: string }>
) {
  const persisted = [];

  for (const row of rows) {
    const hasQty = (row.cartons || 0) > 0 || (row.liters || 0) > 0 || (row.gallons || 0) > 0;
    const hasAmount = (row.unitPrice || 0) > 0 || (row.total || 0) > 0;
    if (!hasQty && !hasAmount && !row.description?.trim()) continue;

    let itemId = row.itemId;
    if (!itemId && row.itemCode) {
      const byCode = availableItems.find(
        (i) => String(i.code || "").toLowerCase() === row.itemCode!.toLowerCase()
      );
      if (byCode) itemId = byCode._id;
    }
    if (!itemId && row.description) {
      const byName = availableItems.find(
        (i) => String(i.name || "").toLowerCase() === row.description.toLowerCase()
      );
      if (byName) itemId = byName._id;
    }

    const cartons = Number(row.cartons || 0);
    const rate = Number(row.unitPrice || 0);
    const discountPercent = Number(row.discPercent || 0);
    const grossAmount = cartons * rate;
    const netAmount = grossAmount - (grossAmount * discountPercent) / 100;

    persisted.push({
      itemId: itemId || undefined,
      description: row.description || "",
      cartons,
      gallons: Number(row.gallons || 0),
      liters: Number(row.liters || 0),
      qty: cartons,
      rate,
      ratePerCarton: rate,
      discountPercent,
      grossAmount,
      netAmount: row.total || netAmount,
    });
  }

  return persisted;
}

export type ImportLineRow = PurchaseLineRow & {
  unitPriceUSD: number;
  foreignTotal: number;
  pkrTotal: number;
};

export function mapImportLinesToRows(initialData?: { lines?: unknown[]; items?: unknown[] } | null) {
  const src = (initialData?.lines ?? initialData?.items ?? []) as Record<string, unknown>[];
  if (!src.length) {
    return [
      {
        id: "1",
        itemId: "",
        itemCode: "",
        description: "",
        cartons: 1,
        gallons: 4,
        liters: 16,
        unitPrice: 0,
        discPercent: 0,
        total: 0,
        unitPriceUSD: 0,
        foreignTotal: 0,
        pkrTotal: 0,
      } as ImportLineRow,
    ];
  }
  return src.map((l, i) => {
    const base = mapInvoiceLinesToRows({ lines: [l] })[0];
    const rate = Number(l.rate ?? l.unitPriceUSD ?? 0);
    return {
      ...base,
      id: String(i),
      unitPrice: rate,
      unitPriceUSD: rate,
      foreignTotal: Number(l.foreignNetAmount ?? 0),
      pkrTotal: Number(l.netAmount ?? l.pkrTotal ?? 0),
      total: Number(l.netAmount ?? l.pkrTotal ?? 0),
    } as ImportLineRow;
  });
}
