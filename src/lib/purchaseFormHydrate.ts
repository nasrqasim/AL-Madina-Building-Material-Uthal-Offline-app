import { mapInvoiceLinesToRows, resolvePartyId, type PurchaseLineRow } from "./purchaseFormUtils";

export function getInvoiceLinesFromRecord(record: Record<string, unknown> | null | undefined): unknown[] {
  if (!record) return [];
  const lines = record.lines;
  if (Array.isArray(lines) && lines.length > 0) return lines;
  const items = record.items;
  if (Array.isArray(items) && items.length > 0) return items;
  return [];
}

/** Match vendor select when only populated party name exists on the record */
export function resolvePartyIdWithLookup(
  initialData: Record<string, unknown> | null | undefined,
  parties: Array<{ _id: string; companyName?: string; name?: string }>
): string {
  const direct = resolvePartyId(initialData);
  if (direct) return direct;
  if (!initialData || !parties.length) return "";

  const party = initialData.partyId as { companyName?: string; name?: string } | undefined;
  const label = String(
    party?.companyName || party?.name || initialData.vendor || ""
  ).trim();
  if (!label) return "";

  const match = parties.find((p) => {
    const names = [p.companyName, p.name].filter(Boolean).map((n) => n!.toLowerCase());
    return names.includes(label.toLowerCase());
  });
  return match ? String(match._id) : "";
}

export function mapRecordToLineRows(
  initialData: Record<string, unknown> | null | undefined
): PurchaseLineRow[] {
  const src = getInvoiceLinesFromRecord(initialData) as Record<string, unknown>[];
  if (src.length > 0) {
    return mapInvoiceLinesToRows({ lines: src });
  }

  const legacyTotal = Number(initialData?.totalAmount ?? initialData?.amount ?? 0);
  if (legacyTotal > 0) {
    return [
      {
        id: "1",
        itemId: "",
        itemCode: "",
        description: String(initialData?.notes || "Legacy invoice total"),
        cartons: 1,
        gallons: 0,
        liters: 0,
        unitPrice: legacyTotal,
        discPercent: 0,
        total: legacyTotal,
      },
    ];
  }

  return mapInvoiceLinesToRows(null);
}

export function hydratePurchaseForm<T extends Record<string, unknown>>(
  record: Record<string, unknown>,
  vendors: Array<{ _id: string; companyName?: string; name?: string }>,
  buildFormState: (
    data: Record<string, unknown> | null | undefined,
    vendors: Array<{ _id: string; companyName?: string; name?: string }>
  ) => T,
  setFormData: (data: T) => void,
  setItems: (rows: PurchaseLineRow[]) => void
) {
  setFormData(buildFormState(record, vendors));
  setItems(mapRecordToLineRows(record));
}
