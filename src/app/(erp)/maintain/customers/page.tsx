"use client";

import { useState, useEffect } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import ERPDataTable from "@/components/erp/ui/ERPDataTable";
import CustomerModal from "@/components/erp/maintain/CustomerModal";
import QuickReceiptModal from "@/components/erp/maintain/QuickReceiptModal";
import WhatsAppShareModal from "@/components/erp/whatsapp/WhatsAppShareModal";
import { Plus, FileText, Download, Printer, UserCheck, UserX, Wallet, Search, Edit2, Trash2, MapPin, FileSpreadsheet, ArrowLeft, Play, Calendar, MessageCircle } from "lucide-react";
import ERPStatCard from "@/components/erp/ui/ERPStatCard";
import { exportToExcel, downloadTemplate, printPage, triggerFileInput, importFromExcel } from "@/lib/excel";

export default function CustomersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [waParty, setWaParty] = useState<any>(null);
  const [waDocData, setWaDocData] = useState<any>(null);
  const [waType, setWaType] = useState<"Statement" | "Reminder">("Reminder");

  // Ledger state variables
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState<any>(null);
  const [ledgerFromDate, setLedgerFromDate] = useState("2026-05-01");
  const [ledgerToDate, setLedgerToDate] = useState("2026-05-31");
  const [ledgerTransactions, setLedgerTransactions] = useState<any[]>([]);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);
  const [shopProfile, setShopProfile] = useState<any>(null);

  const formatBalance = (val: number) => {
    if (val === undefined || val === null) return "Rs. 0";
    if (val < 0) {
      return `-Rs. ${Math.abs(val).toLocaleString()}`;
    }
    return `Rs. ${val.toLocaleString()}`;
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/parties");
      const json = await res.json();
      if (json.ok) {
        setCustomers(json.data.filter((p: any) => p.type === "Customer"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShopProfile = async () => {
    try {
      const res = await fetch("/api/shop-profile");
      const json = await res.json();
      if (json.ok) setShopProfile(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchShopProfile();

    // Default dates: start of current month to today/end of month
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setLedgerFromDate(`${year}-${month}-01`);
    setLedgerToDate(`${year}-${month}-${day}`);
  }, []);

  const handleAdd = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleImport = async () => {
    const file = await triggerFileInput();
    if (file) {
      const data = await importFromExcel(file);
      console.log("Imported data:", data);
      alert("Bulk import completed successfully.");
      fetchCustomers();
    }
  };

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        const res = await fetch(`/api/parties/${id}`, { method: "DELETE" });
        if (res.ok) {
          fetchCustomers();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSave = async (data: any) => {
    const payload = {
      ...data,
      companyName: data.name, 
      name: data.name || "Unknown",
      code: data.code || `CUST-${Date.now()}`,
      type: "Customer"
    };

    try {
      if (selectedCustomer?._id) {
        const res = await fetch(`/api/parties/${selectedCustomer._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) fetchCustomers();
      } else {
        const res = await fetch("/api/parties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) fetchCustomers();
      }
    } catch (e) {
      console.error(e);
    }
    setIsModalOpen(false);
  };

  // Dynamic Ledger Fetching and Calculation
  const handleOpenLedger = async (customer: any) => {
    setSelectedLedgerCustomer(customer);
    setIsLedgerLoading(true);
    try {
      const [salesRes, cashRes, bankRes] = await Promise.all([
        fetch("/api/sales"),
        fetch("/api/cash-receipts"),
        fetch("/api/bank-receipts")
      ]);
      const [salesJson, cashJson, bankJson] = await Promise.all([
        salesRes.json(),
        cashRes.json(),
        bankRes.json()
      ]);

      const txs: any[] = [];

      // 1. Process Sales & Returns
      if (salesJson.ok && salesJson.data) {
        salesJson.data.forEach((s: any) => {
          const match = s.partyId?._id === customer._id || s.customerName === customer.name || s.customerName === customer.companyName;
          if (match) {
            const isReturn = s.type === "sale_return" || s.type === "non_tax_sale_return";
            txs.push({
              date: new Date(s.date || s.createdAt),
              voucherNo: s.invoiceNo,
              type: isReturn ? "Sale Return" : "Sale Invoice",
              remarks: s.notes || (isReturn ? "Goods Returned" : `Sales invoice posted (${s.paymentMethod || 'Credit'})`),
              debit: isReturn ? 0 : s.totalAmount || 0,
              credit: isReturn ? s.totalAmount || 0 : 0
            });
          }
        });
      }

      // 2. Process Cash Receipts
      if (cashJson.ok && cashJson.data) {
        cashJson.data.forEach((r: any) => {
          const match = r.party === customer._id || r.party === customer.name || r.party === customer.companyName;
          if (match) {
            txs.push({
              date: new Date(r.date || r.createdAt),
              voucherNo: r.receiptNumber,
              type: "Cash Receipt",
              remarks: r.remarks || "Payment received via Cash",
              debit: 0,
              credit: r.amount || 0
            });
          }
        });
      }

      // 3. Process Bank Receipts
      if (bankJson.ok && bankJson.data) {
        bankJson.data.forEach((r: any) => {
          const match = r.party === customer._id || r.party === customer.name || r.party === customer.companyName;
          if (match) {
            txs.push({
              date: new Date(r.date || r.createdAt),
              voucherNo: r.receiptNumber,
              type: "Bank Receipt",
              remarks: r.remarks || `Payment received via Bank - Account ${r.bankAccount || ""}`,
              debit: 0,
              credit: r.amount || 0
            });
          }
        });
      }

      // Sort all transactions chronologically
      txs.sort((a, b) => a.date.getTime() - b.date.getTime());
      setLedgerTransactions(txs);
    } catch (err) {
      console.error("Error loading ledger:", err);
    } finally {
      setIsLedgerLoading(false);
    }
  };

  // Recalculates transactions ledger when date range is applied
  const getProcessedLedger = () => {
    if (!selectedLedgerCustomer) return { opening: 0, rows: [], totalDr: 0, totalCr: 0, closing: 0 };

    const initialOpening = selectedLedgerCustomer.openingBalance || 0;
    const startRange = new Date(ledgerFromDate);
    const endRange = new Date(ledgerToDate);
    endRange.setHours(23, 59, 59, 999);

    let opening = initialOpening;
    const beforeTxs = ledgerTransactions.filter(t => t.date.getTime() < startRange.getTime());
    const duringTxs = ledgerTransactions.filter(t => t.date.getTime() >= startRange.getTime() && t.date.getTime() <= endRange.getTime());

    // Compute dynamic opening balance up to From Date
    beforeTxs.forEach(t => {
      opening += t.debit - t.credit;
    });

    let runningBalance = opening;
    let totalDr = 0;
    let totalCr = 0;

    const rows = duringTxs.map(t => {
      runningBalance += t.debit - t.credit;
      totalDr += t.debit;
      totalCr += t.credit;
      return {
        ...t,
        runningBalance
      };
    });

    return {
      opening,
      rows,
      totalDr,
      totalCr,
      closing: runningBalance
    };
  };

  const ledgerData = getProcessedLedger();

  const columns = [
    { 
      header: "Customer Name", 
      accessor: "name",
      render: (val: string, row: any) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-900 dark:text-white">{val}</span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">NTN: {row.ntn || "-"}</span>
        </div>
      )
    },
    { header: "Category", accessor: "category" },
    { header: "Contact Person", accessor: "contactPerson" },
    { 
      header: "Phone", 
      accessor: "phone",
      render: (val: string, row: any) => {
        const hasValidPhone = val && val.replace(/[^0-9]/g, "").length >= 10;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{val}</span>
            {hasValidPhone && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setWaParty(row);
                  setWaType("Reminder");
                  setIsWhatsAppModalOpen(true);
                }}
                title="Send WhatsApp Reminder"
                className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
              >
                <MessageCircle size={14} className="fill-emerald-600/10" />
              </button>
            )}
          </div>
        );
      }
    },
    { 
      header: "Location", 
      accessor: "area",
      render: (val: string) => (
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold">
          <MapPin size={14} className="text-slate-300" />
          <span>{val || "-"}</span>
        </div>
      )
    },
    { 
      header: "Balance (Dr/Cr)", 
      accessor: "balance", 
      render: (val: number, row: any) => {
        const isNegative = val < 0;
        const formattedVal = isNegative 
          ? `-Rs. ${Math.abs(val).toLocaleString()}` 
          : `+Rs. ${val?.toLocaleString() || "0"}`;
        const balanceLabel = isNegative ? " (Debit)" : val > 0 ? " (Credit)" : "";
        return (
          <div className="flex flex-col">
            <span className={`text-sm font-black ${val > (row.creditLimit || 0) && row.creditLimit > 0 ? "text-red-600 animate-pulse" : val > 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formattedVal}{balanceLabel}
            </span>
            {val > (row.creditLimit || 0) && row.creditLimit > 0 && (
              <span className="text-[8px] font-black text-red-600 uppercase tracking-tighter">Over Limit! (Max: {row.creditLimit?.toLocaleString()})</span>
            )}
          </div>
        );
      }
    },
    { 
      header: "Status", 
      accessor: "status", 
      render: (val: string) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          val === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        }`}>
          {val}
        </span>
      )
    },
  ];

  // The 8 specified customer categories
  const categories = [
    "Cash Customer",
    "Credit Customer",
    "Cash Customer (Jama)",
    "Credit Customer (Counter)",
    "Credit Customer Max",
    "Credit Customer (Haji Gul)",
    "Credit Customer (Makkah)",
    "Credit Customer (Radbook)"
  ];

  // Filter customers by search term
  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.contactPerson?.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term) ||
      c.area?.toLowerCase().includes(term) ||
      c.ntn?.toLowerCase().includes(term)
    );
  });

  // LEDGER / STATEMENT VIEW
  if (selectedLedgerCustomer) {
    return (
      <div className="space-y-6">
        {/* Style Overrides for Window Printing */}
        <style>{`
          @media print {
            aside, header, nav, .no-print, button, input, select {
              display: none !important;
            }
            body {
              background: white !important;
              color: black !important;
            }
            .print-container {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
            table {
              border-collapse: collapse !important;
              width: 100% !important;
            }
            th, td {
              border: 1px solid #e2e8f0 !important;
              padding: 8px !important;
            }
          }
        `}</style>

        <div className="flex justify-between items-center no-print">
          <button 
            onClick={() => setSelectedLedgerCustomer(null)}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-sm font-black transition-all"
          >
            <ArrowLeft size={18} />
            Back to Customers
          </button>
          <div className="flex gap-2">
            {selectedLedgerCustomer?.phone && selectedLedgerCustomer.phone.replace(/[^0-9]/g, "").length >= 10 && (
              <button 
                onClick={() => {
                  setWaParty(selectedLedgerCustomer);
                  setWaDocData(ledgerData);
                  setWaType("Statement");
                  setIsWhatsAppModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-sm font-black shadow-xl shadow-[#25D366]/20 transition-all"
              >
                <MessageCircle size={18} />
                WhatsApp Statement
              </button>
            )}
            <button 
              onClick={printPage}
              className="flex items-center gap-2 px-6 py-2.5 bg-maroon-800 hover:bg-maroon-900 text-white rounded-xl text-sm font-black shadow-xl shadow-maroon-900/20 transition-all"
            >
              <Printer size={18} />
              Print Ledger
            </button>
          </div>
        </div>

        {/* Date Filter Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm no-print">
          <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={12} /> Date From
                </label>
                <input 
                  type="date" 
                  value={ledgerFromDate}
                  onChange={(e) => setLedgerFromDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none dark:text-white dark:bg-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={12} /> Date To
                </label>
                <input 
                  type="date" 
                  value={ledgerToDate}
                  onChange={(e) => setLedgerToDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none dark:text-white dark:bg-slate-900"
                />
              </div>
            </div>
            <button 
              onClick={() => handleOpenLedger(selectedLedgerCustomer)}
              className="px-8 py-3 bg-slate-900 hover:bg-black dark:bg-maroon-800 dark:hover:bg-maroon-900 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Play size={14} />
              Apply Range
            </button>
          </div>
        </div>

        {/* Ledger Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
          <ERPStatCard label="Opening Balance" value={formatBalance(ledgerData.opening)} icon={Wallet} variant="slate" />
          <ERPStatCard label="Total Debit (Sales)" value={formatBalance(ledgerData.totalDr)} icon={Play} variant="green" />
          <ERPStatCard label="Total Credit (Receipts)" value={formatBalance(ledgerData.totalCr)} icon={Play} variant="orange" />
          <ERPStatCard label="Closing Balance" value={formatBalance(ledgerData.closing)} icon={Wallet} variant="maroon" />
        </div>

        {/* Print Layout */}
        <div className="print-container bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm transition-all">
          
          {/* Statement Header */}
          <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{shopProfile?.companyName || "Najeeb Oil Shop"}</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{shopProfile?.address || "Bela, Balochistan, Pakistan"}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ph: {shopProfile?.phone || "+92 333 1234567"} | NTN: {shopProfile?.ntn || "0000000-0"}</p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black text-maroon-800 uppercase tracking-widest">Customer Ledger</h1>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Statement of Account</p>
            </div>
          </div>

          {/* Customer / Period Info */}
          <div className="grid grid-cols-2 gap-8 mb-8 pb-4 border-b border-slate-100 dark:border-slate-855">
            <div>
              <p className="text-[10px] font-black text-maroon-800 uppercase tracking-widest mb-1.5">Statement For</p>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">{selectedLedgerCustomer.name}</h4>
              {selectedLedgerCustomer.contactPerson && (
                <p className="text-[10px] text-slate-500 font-bold uppercase">Contact: {selectedLedgerCustomer.contactPerson}</p>
              )}
              <p className="text-[10px] text-slate-500 font-bold uppercase">Ph: {selectedLedgerCustomer.phone || "-"}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Area: {selectedLedgerCustomer.area || "-"}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-maroon-800 uppercase tracking-widest mb-1.5">Statement Period</p>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">
                {new Date(ledgerFromDate).toLocaleDateString()} to {new Date(ledgerToDate).toLocaleDateString()}
              </h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Category: {selectedLedgerCustomer.category}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Statement Table */}
          {isLedgerLoading ? (
            <div className="py-24 text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-maroon-850 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
              <p className="text-xs font-black uppercase tracking-widest">Fetching Ledger History...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-855 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Doc No</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Debit (Dr)</th>
                    <th className="px-4 py-3 text-right">Credit (Cr)</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {/* Opening Balance Row */}
                  <tr className="bg-slate-50/50 dark:bg-slate-850/50 font-black">
                    <td className="px-4 py-3 text-slate-400">{new Date(ledgerFromDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">-</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] rounded font-black tracking-widest text-slate-500">OPEN</span>
                    </td>
                    <td className="px-4 py-3 uppercase tracking-tighter text-slate-400">Opening Balance</td>
                    <td className="px-4 py-3 text-right">-</td>
                    <td className="px-4 py-3 text-right">-</td>
                    <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{formatBalance(ledgerData.opening)}</td>
                  </tr>

                  {ledgerData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-bold italic uppercase tracking-wider text-[10px]">
                        No transactions recorded during this period
                      </td>
                    </tr>
                  ) : (
                    ledgerData.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-855/50 transition-colors">
                        <td className="px-4 py-3">{new Date(row.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-blue-600">{row.voucherNo}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                            row.type === "Sale Invoice" ? "bg-emerald-50 text-emerald-600" :
                            row.type === "Sale Return" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                          }`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">{row.remarks}</td>
                        <td className="px-4 py-3 text-right text-emerald-700">
                          {row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-right text-rose-700">
                          {row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                          {formatBalance(row.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Summary / Total Footer Row */}
                  <tr className="bg-slate-100 dark:bg-slate-800 font-black text-slate-950 dark:text-white">
                    <td colSpan={4} className="px-4 py-3.5 text-right uppercase tracking-widest text-[10px]">Statement Summary & Closing</td>
                    <td className="px-4 py-3.5 text-right text-emerald-700">Rs. {ledgerData.totalDr.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right text-rose-700">Rs. {ledgerData.totalCr.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right text-maroon-800 dark:text-maroon-400">
                      {formatBalance(ledgerData.closing)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Statement Signatures (for official ledger prints) */}
          <div className="mt-20 flex justify-between items-end border-t border-slate-100 dark:border-slate-850 pt-8 no-print-override">
            <div>
              <div className="w-48 border-b border-slate-350 dark:border-slate-800 mb-2"></div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Authorized Signature</p>
            </div>
            <div className="text-right">
              <div className="w-48 border-b border-slate-350 dark:border-slate-800 mb-2 ml-auto"></div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Customer Confirmation</p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // STANDARD BALANCES GRID VIEW
  return (
    <div className="space-y-6">
      <ERPPageHeader 
        title="Customer Balances" 
        subtitle="Master Data / Customer Balances"
        actions={[
          { label: "Export Excel", onClick: () => exportToExcel(customers, "CustomerBalances.xlsx"), icon: FileSpreadsheet },
          { label: "Download Template", onClick: () => downloadTemplate(["Company Name", "Contact Person", "Phone", "Email", "NTN", "Location", "Balance", "Status"], "CustomerTemplate.xlsx"), icon: Download },
          { label: "Import Excel", onClick: handleImport, icon: FileText },
        ]}
      />

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ERPStatCard label="Active Accounts" value={customers.filter(c => c.status === "Active").length} icon={UserCheck} variant="green" />
        <ERPStatCard label="Inactive Accounts" value={customers.filter(c => c.status === "Inactive").length} icon={UserX} variant="slate" />
        <ERPStatCard label="Total Outstanding Receivable" value={`Rs. ${(customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0) / 1000000).toFixed(1)}M`} icon={Wallet} variant="maroon" />
      </div>

      {/* Search & Add Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
        <div className="p-6 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by customer name, contact, phone, location..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleAdd}
              className="flex items-center gap-2 px-8 py-3 bg-maroon-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
            >
              <Plus size={18} />
              New Customer
            </button>
          </div>
        </div>
      </div>

      {/* Separate Tables for each of the 8 Categories */}
      <div className="space-y-12">
        {categories.map(cat => {
          // Filter customers belonging to this category
          const catCustomers = filteredCustomers.filter(c => (c.category || "Cash Customer") === cat);

          return (
            <div key={cat} className="space-y-4">
              <div className="flex items-center gap-4 px-6">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-maroon-800 bg-maroon-50 dark:bg-maroon-900/30 dark:text-maroon-400 px-6 py-2 rounded-full shadow-sm">
                  {cat}
                </h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:shadow-maroon-900/5 min-h-[100px]">
                {catCustomers.length > 0 ? (
                  <ERPDataTable 
                    columns={columns} 
                    data={catCustomers} 
                    actions={[
                      { label: "Edit", onClick: handleEdit, icon: Edit2 },
                      { label: "View Ledger", onClick: handleOpenLedger, icon: FileText },
                      { 
                        label: "WhatsApp Reminder", 
                        onClick: (row: any) => { setWaParty(row); setWaType("Reminder"); setIsWhatsAppModalOpen(true); }, 
                        icon: MessageCircle,
                        hide: (row: any) => !row.phone || row.phone.replace(/[^0-9]/g, "").length < 10
                      },
                      { label: "Receive Payment", onClick: (row: any) => { setActiveCustomer(row); setIsReceiptModalOpen(true); }, icon: Wallet },
                      { label: "Delete", onClick: (row: any) => handleDelete(row._id), icon: Trash2, variant: "danger" },
                    ]}
                  />
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No customers in this category</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CustomerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        customer={selectedCustomer}
        onSave={handleSave}
      />

      {activeCustomer && (
        <QuickReceiptModal 
          isOpen={isReceiptModalOpen} 
          onClose={() => setIsReceiptModalOpen(false)} 
          customer={activeCustomer} 
          onSuccess={fetchCustomers} 
        />
      )}

      <WhatsAppShareModal 
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        party={waParty}
        type={waType}
        documentData={waDocData}
        shopProfile={shopProfile}
      />
    </div>
  );
}
