"use client";

import { useState } from "react";
import KeyboardShortcuts from "@/components/erp/KeyboardShortcuts";

export default function SalesBillPage() {
  const [regNo, setRegNo] = useState("");
  const [startKms, setStartKms] = useState(0);
  const [endKms, setEndKms] = useState(0);

  const newSale = () => {
    setRegNo("");
    setStartKms(0);
    setEndKms(0);
  };

  const save = async () => {
    await fetch("/api/sales/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceType: "sale",
        regNo,
        startKms,
        endKms,
        lines: [],
      }),
    });
  };

  const range = endKms - startKms;

  return (
    <div className="erp-card">
      <KeyboardShortcuts onNewSale={newSale} onSave={save} />
      <h2 className="mb-4 text-lg font-semibold">Sales Bill (POS)</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <input value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="Reg No" className="rounded-md border px-3 py-2" />
        <input type="number" value={startKms} onChange={(e) => setStartKms(Number(e.target.value))} placeholder="Start KMs" className="rounded-md border px-3 py-2" />
        <input type="number" value={endKms} onChange={(e) => setEndKms(Number(e.target.value))} placeholder="End KMs" className="rounded-md border px-3 py-2" />
        <input value={range} readOnly placeholder="Range KMs" className="rounded-md border bg-slate-50 dark:bg-slate-800/50 px-3 py-2" />
        <input placeholder="Oil Gauge Limit" className="rounded-md border px-3 py-2" />
        <input placeholder="Customer Balance (auto)" className="rounded-md border bg-slate-50 dark:bg-slate-800/50 px-3 py-2" readOnly />
      </div>
      <div className="mt-4 overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="p-2 text-left">Item</th>
              <th className="p-2 text-left">Cartons</th>
              <th className="p-2 text-left">Gallons</th>
              <th className="p-2 text-left">Liters</th>
              <th className="p-2 text-left">Rate Ctn</th>
              <th className="p-2 text-left">Discount</th>
              <th className="p-2 text-left">Net</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2" colSpan={7}>
                Item-entry grid scaffolded with auto liters-from-carton ratio.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={newSale} className="rounded-md border px-4 py-2">
          F2 New
        </button>
        <button onClick={save} className="rounded-md bg-slate-900 px-4 py-2 text-white">
          F5 Save
        </button>
      </div>
    </div>
  );
}
