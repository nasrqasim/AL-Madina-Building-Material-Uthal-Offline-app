export async function loadInvoiceById(id: string) {
  try {
    const res = await fetch(`/api/invoices/${id}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      console.error("loadInvoiceById failed:", json.message || res.status);
      return null;
    }
    return json.data;
  } catch (e) {
    console.error("loadInvoiceById error:", e);
    return null;
  }
}
