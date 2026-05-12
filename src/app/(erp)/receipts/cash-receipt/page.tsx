"use client";

import { useState, useEffect } from "react";
import CashReceiptForm from "@/components/receipts/CashReceiptForm";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { Plus, Search, Eye, Edit, Trash2, Printer, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import PrintTemplate from "@/components/print/PrintTemplate";

export default function CashReceiptPage() {
  const [showForm, setShowForm] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [printReceipt, setPrintReceipt] = useState<any>(null);

  useEffect(() => {
    if (printReceipt) {
      setTimeout(() => {
        window.print();
        setPrintReceipt(null);
      }, 500);
    }
  }, [printReceipt]);

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/cash-receipts");
      const json = await res.json();
      if (json.ok) setReceipts(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [showForm]);

  const deleteReceipt = async (id: string) => {
    try {
      await fetch(`/api/cash-receipts/${id}`, { method: "DELETE" });
      fetchReceipts();
    } catch (e) { console.error(e); }
  };

  if (showForm) {
    return <CashReceiptForm onClose={() => setShowForm(false)} />;
  }

  const filteredReceipts = receipts.filter(p => p.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || p.party?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={`space-y-6 ${printReceipt ? 'print:hidden' : ''}`}>
      <ERPPageHeader
        title="Cash Receipt"
        description="Record and manage cash received from customers or other sources."
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export Excel", onClick: () => exportToExcel(receipts, "CashReceipts.xlsx"), icon: FileSpreadsheet },
        ]}
      />
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-8 py-3 bg-maroon-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
        >
          <Plus size={18} />
          New Cash Receipt
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/10 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt No</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Party / Account</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cash Account</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">Loading...</td></tr>
              ) : filteredReceipts.length > 0 ? (
                filteredReceipts.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4"><span className="text-sm font-bold text-slate-900 dark:text-white">{p.receiptNumber}</span></td>
                    <td className="px-6 py-4"><span className="text-sm font-bold text-slate-600 dark:text-slate-300">{p.date}</span></td>
                    <td className="px-6 py-4"><span className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.party}</span></td>
                    <td className="px-6 py-4"><span className="text-sm font-medium text-slate-600 dark:text-slate-300">{p.cashAccount}</span></td>
                    <td className="px-6 py-4 text-right"><span className="text-sm font-black text-emerald-600">PKR {(p.amount||0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${p.status === "Posted" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 transition-opacity">
                        <button onClick={() => setPrintReceipt(p)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all" title="Print">
                          <Printer size={16} />
                        </button>
                        <button onClick={() => deleteReceipt(p._id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">No cash receipts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {printReceipt && (
        <PrintTemplate
          formatName="Cash Receipt"
          data={{
            receiptNo: printReceipt.receiptNumber,
            date: printReceipt.date,
            paidTo: printReceipt.party,
            total: printReceipt.amount,
            subtotal: printReceipt.amount,
            taxAmount: 0,
            discountAmount: 0
          }}
          items={[{ description: printReceipt.particulars || 'Cash Received', qty: 1, unitPrice: printReceipt.amount, total: printReceipt.amount }]}
        />
      )}
    </div>
  );
}
