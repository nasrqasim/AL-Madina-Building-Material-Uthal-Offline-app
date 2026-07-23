"use client";

import { useState, useEffect } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { 
  Database, 
  Save, 
  Search, 
  Package,
  Calculator,
  FileText,
  Download,
  Printer,
  FileSpreadsheet
} from "lucide-react";
import { exportToExcel, downloadTemplate, printPage, triggerFileInput, importFromExcel } from "@/lib/excel";

export default function OpeningBalancesPage() {
  const [activeTab, setActiveTab] = useState("Items");
  const [itemBalances, setItemBalances] = useState<any[]>([]);
  const [accountBalances, setAccountBalances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = (itemBalances || []).filter(item => 
    item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.unit?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAccounts = (accountBalances || []).filter(acc => 
    acc.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.balanceType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchBalances = async () => {
    setIsLoading(true);
    try {
      const resItems = await fetch("/api/opening-balances?type=Item");
      const jsonItems = await resItems.json();
      if (jsonItems.ok) setItemBalances(jsonItems.data || []);

      const resAccounts = await fetch("/api/opening-balances?type=Account");
      const jsonAccounts = await resAccounts.json();
      if (jsonAccounts.ok) setAccountBalances(jsonAccounts.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const handleImport = async () => {
    const file = await triggerFileInput();
    if (file) {
      const data = await importFromExcel(file);
      const isItem = activeTab === "Items";
      const newBalances = (data || []).map((row: any) => ({
        type: isItem ? "Item" : "Account",
        ...(isItem ? {
          itemName: row["Item Name"] || row.name || "Unknown Item",
          unit: row["Unit"] || row.unit || "Nos",
          qty: parseFloat(row["Qty"] || row.qty || "0"),
          rate: parseFloat(row["Rate"] || row.rate || "0"),
        } : {
          accountName: row["Account Name"] || row.name || "Unknown Account",
          balanceType: row["Type"] || row.type || "Debit",
          amount: parseFloat(row["Amount"] || row.amount || "0"),
        })
      }));
      
      try {
        await fetch("/api/opening-balances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newBalances),
        });
        fetchBalances();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItemBalances(prev => prev.map(item => 
      (item.itemId === id || item._id === id) ? { ...item, [field]: value } : item
    ));
  };

  const updateAccount = (id: string, field: string, value: any) => {
    setAccountBalances(prev => prev.map(acc => 
      (acc.accountId === id || acc._id === id) ? { ...acc, [field]: value } : acc
    ));
  };

  const handleSave = async () => {
    try {
      // Save items
      if (itemBalances.length > 0) {
        const parsedItems = (itemBalances || []).map(item => ({
          ...item,
          qty: parseFloat(item.qty) || 0,
          rate: parseFloat(item.rate) || 0
        }));
        await fetch("/api/opening-balances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedItems),
        });
      }
      // Save accounts
      if (accountBalances.length > 0) {
        const parsedAccounts = (accountBalances || []).map(acc => ({
          ...acc,
          amount: parseFloat(acc.amount) || 0
        }));
        await fetch("/api/opening-balances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedAccounts),
        });
      }
      alert("Opening balances saved successfully!");
      fetchBalances();
    } catch (e) {
      console.error(e);
      alert("Failed to save opening balances.");
    }
  };

  return (
    <div className="space-y-6">
      <ERPPageHeader 
        title="Opening Balances" 
        description="Initialize your stock levels and account balances for a new financial year."
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export", onClick: () => exportToExcel(activeTab === "Items" ? itemBalances : accountBalances, `OpeningBalances_${activeTab}.xlsx`), icon: FileSpreadsheet },
          { label: "Download Template", onClick: () => downloadTemplate(activeTab === "Items" ? ["Item Name", "Unit", "Qty", "Rate"] : ["Account Name", "Type", "Amount"], `OpeningBalances_${activeTab}_Template.xlsx`), icon: Download },
          { label: "Import", onClick: handleImport, icon: FileText },
          { label: "Post Balances", onClick: handleSave, icon: Save, variant: "primary" },
        ]}
      />

      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit">
        {["Items", "Accounts"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === tab 
                ? "bg-white dark:bg-slate-900 text-maroon-800 shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab.toLowerCase()}...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-maroon-50 text-maroon-800 rounded-xl text-xs font-black uppercase tracking-widest">
            {activeTab === "Items" ? <Package size={14} /> : <Calculator size={14} />}
            Batch Mode
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
              {activeTab === "Items" ? (
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Item Name</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-24 min-w-[96px] text-center">Unit</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-44 min-w-[150px] text-center">Opening Qty</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-44 min-w-[150px] text-right">Avg. Rate</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-48 min-w-[160px] text-right">Total Value</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Account Name</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Type</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Opening Balance</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">Loading...</td></tr>
              )}
              {!isLoading && activeTab === "Items" && filteredItems.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">No items found.</td></tr>
              )}
              {!isLoading && activeTab === "Accounts" && filteredAccounts.length === 0 && (
                <tr><td colSpan={3} className="py-8 text-center text-slate-400">No accounts found.</td></tr>
              )}
              {activeTab === "Items" ? (
                (filteredItems || []).map((item, index) => (
                  <tr key={item._id || item.itemId || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-8 py-4">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{item.itemName}</p>
                    </td>
                    <td className="px-4 py-4 text-center w-24 min-w-[96px]">
                      <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase">{item.unit}</span>
                    </td>
                    <td className="px-3 py-4 w-44 min-w-[150px]">
                      <input 
                        type="number" 
                        step="any"
                        value={item.qty ?? ""} 
                        onChange={(e) => updateItem(item.itemId || item._id, 'qty', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-black text-center focus:bg-white dark:focus:bg-slate-900 focus:border-maroon-800 transition-all" 
                      />
                    </td>
                    <td className="px-3 py-4 w-44 min-w-[150px]">
                      <input 
                        type="number" 
                        step="any"
                        value={item.rate ?? ""} 
                        onChange={(e) => updateItem(item.itemId || item._id, 'rate', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-black text-right focus:bg-white dark:focus:bg-slate-900 focus:border-maroon-800 transition-all" 
                      />
                    </td>
                    <td className="px-8 py-4 text-right w-48 min-w-[160px]">
                      <span className="text-sm font-black text-maroon-800">{((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toLocaleString()}</span>
                    </td>
                  </tr>
                ))
              ) : (
                filteredAccounts.map((acc, index) => (
                  <tr key={acc._id || acc.accountId || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-8 py-4">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{acc.accountName}</p>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <select 
                        value={acc.balanceType || "Debit"}
                        onChange={(e) => updateAccount(acc.accountId || acc._id, 'balanceType', e.target.value)}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full outline-none cursor-pointer ${acc.balanceType === "Debit" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                      >
                        <option value="Debit">Debit</option>
                        <option value="Credit">Credit</option>
                      </select>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <input 
                        type="number" 
                        step="any"
                        value={acc.amount ?? ""} 
                        onChange={(e) => updateAccount(acc.accountId || acc._id, 'amount', e.target.value)}
                        className="w-48 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-black text-right focus:bg-white dark:focus:bg-slate-900 focus:border-maroon-800 transition-all ml-auto" 
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Sum */}
        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <div className="flex items-center gap-4">
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Grand Total Value</p>
            <p className="text-2xl font-black text-maroon-800 tracking-tighter">
              PKR {activeTab === "Items" 
                ? (itemBalances || []).reduce((s,i) => s + ((parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0)), 0).toLocaleString() 
                : (accountBalances || []).reduce((s,a) => s + (parseFloat(a.amount) || 0), 0).toLocaleString()
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
