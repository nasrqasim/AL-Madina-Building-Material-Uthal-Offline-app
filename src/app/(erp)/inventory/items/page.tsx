export default function ItemsPage() {
  return (
    <div className="erp-card">
      <h2 className="mb-4 text-lg font-semibold">Item Setup</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <input placeholder="Main Category" className="rounded-md border px-3 py-2" />
        <input placeholder="Sub Category" className="rounded-md border px-3 py-2" />
        <input placeholder="Item Name" className="rounded-md border px-3 py-2" />
        <input placeholder="Liters in Ctn" className="rounded-md border px-3 py-2" />
        <input placeholder="Gallons in Ctn" className="rounded-md border px-3 py-2" />
        <input placeholder="Purchase Rate" className="rounded-md border px-3 py-2" />
        <input placeholder="Wholesale Rate" className="rounded-md border px-3 py-2" />
        <input placeholder="Retail Rate" className="rounded-md border px-3 py-2" />
        <input placeholder="Reorder Level" className="rounded-md border px-3 py-2" />
      </div>
    </div>
  );
}
