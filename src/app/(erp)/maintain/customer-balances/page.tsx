"use client";
import { APP_NAME, COMPANY_NAME, COMPANY_SHORT, COMPANY_TAGLINE, DEFAULT_COMPANY_ADDRESS_LINE, DEFAULT_COMPANY_FORM } from "@/lib/company";

import { useState, useEffect } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import ERPDataTable from "@/components/erp/ui/ERPDataTable";
import CustomerModal from "@/components/erp/maintain/CustomerModal";
import QuickReceiptModal from "@/components/erp/maintain/QuickReceiptModal";
import WhatsAppShareModal from "@/components/erp/whatsapp/WhatsAppShareModal";
import CustomerProfileHistory from "@/components/erp/maintain/CustomerProfileHistory";
import { Plus, FileText, Download, Printer, UserCheck, UserX, Wallet, Search, Edit2, Trash2, MapPin, FileSpreadsheet, ArrowLeft, Play, Calendar, MessageCircle } from "lucide-react";
import ERPStatCard from "@/components/erp/ui/ERPStatCard";
import { exportToExcel, downloadTemplate, printPage, printListDocument, triggerFileInput, importFromExcel } from "@/lib/excel";
import { calculateBalanceFromTransactions } from "@/lib/customerBalance";

export default function CustomerBalancesPage() {
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
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Ledger state variables
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState<any>(null);
  const [ledgerFromDate, setLedgerFromDate] = useState("2026-05-01");
  const [ledgerToDate, setLedgerToDate] = useState("2026-05-31");
  const [ledgerTransactions, setLedgerTransactions] = useState<any[]>([]);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);
  const [shopProfile, setShopProfile] = useState<any>(null);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/parties?type=customer");
      const json = await res.json();
      if (json.ok) {
        const customersData = json.data || [];
        
        // Fetch all transactions once for efficiency
        const [salesRes, cashRes, bankRes, cashPayRes, bankPayRes] = await Promise.all([
          fetch("/api/sales"),
          fetch("/api/cash-receipts"),
          fetch("/api/bank-receipts"),
          fetch("/api/cash-payments"),
          fetch("/api/bank-payments")
        ]);
        
        const [salesJson, cashJson, bankJson, cashPayJson, bankPayJson] = await Promise.all([
          salesRes.json(),
          cashRes.json(),
          bankRes.json(),
          cashPayRes.json(),
          bankPayRes.json()
        ]);

        const sales = salesJson.ok ? salesJson.data || [] : [];
        const cashReceipts = cashJson.ok ? cashJson.data || [] : [];
        const bankReceipts = bankJson.ok ? bankJson.data || [] : [];
        const cashPayments = cashPayJson.ok ? cashPayJson.data || [] : [];
        const bankPayments = bankPayJson.ok ? bankPayJson.data || [] : [];

        // Calculate balances for each customer using unified function
        const customersWithBalances = customersData.map((customer: any) => {
          const balance = calculateBalanceFromTransactions(customer, sales, cashReceipts, bankReceipts, cashPayments, bankPayments);
          
          return {
            ...customer,
            receivable: balance.receivable,
            advance: balance.advance,
            netBalance: balance.netBalance,
            status: balance.status
          };
        });

        setCustomers(customersWithBalances);
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
      if (json.ok) setShopProfile(json.data || []);
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

  useEffect(() => {
    if ((customers || []).length > 0 && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const customerId = params.get("customerId");
      if (customerId) {
        const matched = (customers || []).find((c: any) => c._id === customerId);
        if (matched) {
          handleOpenLedger(matched);
        }
      }
    }
  }, [customers]);

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
    const beforeTxs = (ledgerTransactions || []).filter(t => t.date.getTime() < startRange.getTime());
    const duringTxs = (ledgerTransactions || []).filter(t => t.date.getTime() >= startRange.getTime() && t.date.getTime() <= endRange.getTime());

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
      header: "Customer", 
      accessor: "name",
      render: (val: string, row: any) => {
        const hasValidPhone = row.phone && row.phone.replace(/[^0-9]/g, "").length >= 10;
        return (
          <div className="flex flex-col">
            <span className="font-black text-slate-900 dark:text-white">{val}</span>
            {(row.phone || row.contactPerson) && (
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                {row.contactPerson ? `${row.contactPerson} | ` : ""}{row.phone || ""}
                {hasValidPhone && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setWaParty(row);
                      setWaType("Reminder");
                      setIsWhatsAppModalOpen(true);
                    }}
                    title="Send WhatsApp Reminder"
                    className="p-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors inline-flex items-center justify-center ml-1"
                  >
                    <MessageCircle size={10} className="fill-emerald-600/10" />
                  </button>
                )}
              </span>
            )}
          </div>
        );
      }
    },
    { 
      header: "Customer Receivable (Customer Owes)", 
      accessor: "receivable",
      render: (val: number) => {
        const num = Number(val) || 0;
        if (num > 0) {
          return <span className="text-sm font-bold text-rose-600">Rs. {num.toLocaleString()}</span>;
        }
        return <span className="text-sm font-bold text-slate-500">Rs. 0</span>;
      }
    },
    { 
      header: "Advance Balance (We Owe Customer)", 
      accessor: "advance",
      render: (val: number) => {
        const num = Number(val) || 0;
        if (num > 0) {
          return <span className="text-sm font-bold text-emerald-600">Rs. {num.toLocaleString()}</span>;
        }
        return <span className="text-sm font-bold text-slate-500">Rs. 0</span>;
      }
    },
    { 
      header: "Net Balance", 
      accessor: "netBalance",
      render: (val: number) => {
        const num = Number(val) || 0;
        if (num > 0) {
          return <span className="text-sm font-bold text-rose-600">Rs. {num.toLocaleString()}</span>;
        } else if (num < 0) {
          return <span className="text-sm font-bold text-emerald-600">Rs. {Math.abs(num).toLocaleString()}</span>;
        }
        return <span className="text-sm font-bold text-slate-500">Rs. 0</span>;
      }
    },
    { 
      header: "Status", 
      accessor: "status", 
      render: (val: string) => {
        const statusConfig: Record<string, { emoji: string; color: string; bgColor: string }> = {
          "Customer Owes": { emoji: "🔴", color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-900/30" },
          "Advance Available": { emoji: "🟢", color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-900/30" },
          "Mixed Balance": { emoji: "🟡", color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-900/30" },
          "Settled": { emoji: "⚪", color: "text-slate-600", bgColor: "bg-slate-50 dark:bg-slate-900/30" }
        };
        const config = statusConfig[val] || statusConfig["Settled"];
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${config.color} ${config.bgColor}`}>
            {config.emoji} {val}
          </span>
        );
      }
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (val: string, row: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenLedger(row)}
            className="p-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
            title="View Ledger"
          >
            <FileText size={14} />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(val)}
            className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
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

  // Filter customers by search term, category, and status
  const filteredCustomers = (customers || []).filter(c => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      c.name?.toLowerCase().includes(term) ||
      c.contactPerson?.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term) ||
      c.area?.toLowerCase().includes(term) ||
      c.ntn?.toLowerCase().includes(term) ||
      c.code?.toLowerCase().includes(term)
    );
    const matchesCategory = selectedCategory === "All" || c.category === selectedCategory;
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    const multiplier = sortOrder === "asc" ? 1 : -1;
    switch (sortBy) {
      case "name":
        return multiplier * (a.name || "").localeCompare(b.name || "");
      case "receivable":
        return multiplier * ((a.receivable || 0) - (b.receivable || 0));
      case "advance":
        return multiplier * ((a.advance || 0) - (b.advance || 0));
      case "netBalance":
        return multiplier * ((a.netBalance || 0) - (b.netBalance || 0));
      default:
        return 0;
    }
  });

  // LEDGER / COMPLETE CUSTOMER PROFILE HISTORY VIEW
  if (selectedLedgerCustomer) {
    return (
      <CustomerProfileHistory 
        customer={selectedLedgerCustomer}
        onBack={() => {
          setSelectedLedgerCustomer(null);
          fetchCustomers();
        }}
        shopProfile={shopProfile}
        fetchCustomers={fetchCustomers}
      />
    );
  }

  // STANDARD BALANCES GRID VIEW
  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
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
            overflow: visible !important;
          }
          .print-header {
            display: block !important;
            text-align: center;
            margin-bottom: 20px;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            table-layout: auto !important;
          }
          th, td {
            border: 1px solid #e2e8f0 !important;
            padding: 8px !important;
            font-size: 10px !important;
            color: black !important;
          }
          .overflow-x-auto {
            overflow: visible !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="no-print">
        <ERPPageHeader 
          title="Customer Balances" 
          subtitle="Master Data / Customer Balances"
          actions={[
            { label: "Export Excel", onClick: () => exportToExcel(customers, "CustomerBalances.xlsx"), icon: FileSpreadsheet },
            { label: "Print List", onClick: () => printListDocument({
                title: "Customer Balances Report",
                companyName: shopProfile?.companyName || COMPANY_NAME,
                companyAddress: shopProfile?.address || "Bela, Balochistan, Pakistan",
                companyPhone: shopProfile?.phone || "",
                columns: [
                  { header: "#", key: "_idx" },
                  { header: "Customer", key: "name" },
                  { header: "Customer Receivable", key: "receivable" },
                  { header: "Advance Balance", key: "advance" },
                  { header: "Net Balance", key: "netBalance" },
                  { header: "Status", key: "status" },
                ],
                rows: (filteredCustomers || []).map((c, i) => ({ 
                  ...c, 
                  _idx: i + 1,
                  receivable: `Rs.${(c.receivable || 0).toLocaleString()}`, 
                  advance: `Rs.${(c.advance || 0).toLocaleString()}`, 
                  netBalance: `Rs.${(c.netBalance || 0).toLocaleString()}`,
                  status: c.status
                })),
                totals: {
                  _idx: "",
                  name: `TOTAL (${(filteredCustomers || []).length} Customers)`,
                  receivable: `Rs.${(filteredCustomers || []).reduce((a, c) => a + (c.receivable || 0), 0).toLocaleString()}`,
                  advance: `Rs.${(filteredCustomers || []).reduce((a, c) => a + (c.advance || 0), 0).toLocaleString()}`,
                  netBalance: `Rs.${(filteredCustomers || []).reduce((a, c) => a + (c.netBalance || 0), 0).toLocaleString()}`,
                  status: "",
                },
              }), icon: Printer },
            { label: "Download Template", onClick: () => downloadTemplate(["Company Name", "Contact Person", "Phone", "Email", "NTN", "Location", "Balance", "Status"], "CustomerTemplate.xlsx"), icon: Download },
            { label: "Import Excel", onClick: handleImport, icon: FileText },
          ]}
        />
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ERPStatCard label="Total Customers" value={(customers || []).length} icon={UserCheck} variant="green" />
        <ERPStatCard label="Total Customer Receivable" value={`Rs. ${((customers || []).reduce((acc, c) => acc + (c.receivable || 0), 0))?.toLocaleString()}`} icon={Wallet} variant="maroon" />
        <ERPStatCard label="Total Customer Advance" value={`Rs. ${((customers || []).reduce((acc, c) => acc + (c.advance || 0), 0))?.toLocaleString()}`} icon={Wallet} variant="green" />
        <ERPStatCard label="Net Customer Balance" value={`Rs. ${((customers || []).reduce((acc, c) => acc + (c.netBalance || 0), 0))?.toLocaleString()}`} icon={Wallet} variant="slate" />
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
              onClick={() => printListDocument({
                title: "Customer Balances Report",
                companyName: shopProfile?.companyName || COMPANY_NAME,
                companyAddress: shopProfile?.address || "Bela, Balochistan, Pakistan",
                companyPhone: shopProfile?.phone || "",
                columns: [
                  { header: "#", key: "_idx" },
                  { header: "Customer", key: "name" },
                  { header: "Customer Receivable", key: "receivable" },
                  { header: "Advance Balance", key: "advance" },
                  { header: "Net Balance", key: "netBalance" },
                  { header: "Status", key: "status" },
                ],
                rows: (filteredCustomers || []).map((c, i) => ({ 
                  ...c, 
                  _idx: i + 1,
                  receivable: `Rs.${(c.receivable || 0).toLocaleString()}`, 
                  advance: `Rs.${(c.advance || 0).toLocaleString()}`, 
                  netBalance: `Rs.${(c.netBalance || 0).toLocaleString()}`,
                  status: c.status
                })),
                totals: {
                  _idx: "",
                  name: `TOTAL (${(filteredCustomers || []).length} Customers)`,
                  receivable: `Rs.${(filteredCustomers || []).reduce((a, c) => a + (c.receivable || 0), 0).toLocaleString()}`,
                  advance: `Rs.${(filteredCustomers || []).reduce((a, c) => a + (c.advance || 0), 0).toLocaleString()}`,
                  netBalance: `Rs.${(filteredCustomers || []).reduce((a, c) => a + (c.netBalance || 0), 0).toLocaleString()}`,
                  status: "",
                },
              })}
              className="flex items-center gap-2 px-8 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-sm"
            >
              <Printer size={18} />
              Print
            </button>
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

      {/* Category Filter Buttons */}
      <div className="no-print bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 items-center">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">Filter Category:</span>
        <button
          onClick={() => setSelectedCategory("All")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            selectedCategory === "All"
              ? "bg-maroon-800 text-white shadow-md shadow-maroon-900/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          All
        </button>
        {(categories || []).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              selectedCategory === cat
                ? "bg-maroon-800 text-white shadow-md shadow-maroon-900/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Status Filter Buttons */}
      <div className="no-print bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 items-center">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">Filter Status:</span>
        {["All", "Customer Owes", "Advance Available", "Settled"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              statusFilter === status
                ? "bg-maroon-800 text-white shadow-md shadow-maroon-900/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Sort Controls */}
      <div className="no-print bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 items-center">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">Sort By:</span>
        {[
          { key: "name", label: "Customer Name" },
          { key: "receivable", label: "Receivable Amount" },
          { key: "advance", label: "Advance Amount" },
          { key: "netBalance", label: "Net Balance" }
        ].map((sort) => (
          <button
            key={sort.key}
            onClick={() => {
              if (sortBy === sort.key) {
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              } else {
                setSortBy(sort.key);
                setSortOrder("asc");
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              sortBy === sort.key
                ? "bg-maroon-800 text-white shadow-md shadow-maroon-900/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            {sort.label} {sortBy === sort.key && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
        ))}
      </div>

      {/* Single Table for all Customers */}
      <div className="print-container bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:shadow-maroon-900/5 min-h-[100px]">
        
        {/* Print Header (Visible only when printing) */}
        <div className="hidden print-header p-6 pb-0">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{shopProfile?.companyName || COMPANY_NAME}</h2>
          <h3 className="text-sm font-bold text-maroon-800 uppercase tracking-widest mt-1">Customer Balances Report</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Generated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="p-1">
          {(filteredCustomers || []).length > 0 ? (
            <ERPDataTable 
              columns={columns} 
              data={filteredCustomers} 
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
              footerContent={
                <tr>
                  <td colSpan={1} className="px-6 py-4 text-right uppercase tracking-widest text-xs font-black">Total:</td>
                  <td className="px-6 py-4 text-sm font-bold text-rose-600">
                    Rs. {(filteredCustomers || []).reduce((acc, c) => acc + (c.receivable || 0), 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                    Rs. {(filteredCustomers || []).reduce((acc, c) => acc + (c.advance || 0), 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-100">
                    {(() => {
                      const totalNet = (filteredCustomers || []).reduce((acc, c) => acc + (c.netBalance || 0), 0);
                      return totalNet < 0 ? `Rs. ${Math.abs(totalNet).toLocaleString()}` : `Rs. ${totalNet.toLocaleString()}`;
                    })()}
                  </td>
                  <td className="px-6 py-4 text-center">-</td>
                  <td className="px-6 py-4 print-hidden"></td>
                </tr>
              }
            />
          ) : (
            <div className="py-12 text-center no-print">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No customers found</p>
            </div>
          )}
        </div>
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
