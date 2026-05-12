export default function PartiesPage() {
  return (
    <div className="erp-card">
      <h2 className="mb-4 text-lg font-semibold">Party Setup (Customer / Vendor)</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <input placeholder="Party Name" className="rounded-md border px-3 py-2" />
        <select className="rounded-md border px-3 py-2">
          <option>Customer</option>
          <option>Vendor</option>
        </select>
        <input placeholder="Address" className="rounded-md border px-3 py-2" />
        <input placeholder="Phone" className="rounded-md border px-3 py-2" />
      </div>
    </div>
  );
}
