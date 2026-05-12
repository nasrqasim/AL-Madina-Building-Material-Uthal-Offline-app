export default function SalesReturnsPage() {
  return (
    <div className="erp-card">
      <h2 className="mb-4 text-lg font-semibold">Sale Returns / Credit Notes</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <input placeholder="Original Invoice Number" className="rounded-md border px-3 py-2" />
        <input placeholder="Reason" className="rounded-md border px-3 py-2" />
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        Posting this return reverses stock and credits customer balance.
      </p>
    </div>
  );
}
