"use client";
import { APP_NAME, COMPANY_NAME, COMPANY_SHORT, COMPANY_TAGLINE, DEFAULT_COMPANY_ADDRESS_LINE, DEFAULT_COMPANY_FORM } from "@/lib/company";

import { useState, useEffect } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import ERPDataTable from "@/components/erp/ui/ERPDataTable";
import VendorModal from "@/components/erp/maintain/VendorModal";
import QuickPaymentModal from "@/components/erp/maintain/QuickPaymentModal";
import VendorProfileHistory from "@/components/erp/maintain/VendorProfileHistory";
import { Plus, FileText, Download, Printer, UserCheck, UserX, Wallet, Search, Edit2, Trash2, MapPin, FileSpreadsheet, ArrowLeft, Play, Calendar, MessageCircle } from "lucide-react";
import ERPStatCard from "@/components/erp/ui/ERPStatCard";
import { exportToExcel, downloadTemplate, printPage, printListDocument, triggerFileInput, importFromExcel } from "@/lib/excel";
import { calculateVendorBalanceFromTransactions } from "@/lib/vendorBalance";

export default function VendorBalancesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Ledger / Profile History state
  const [selectedLedgerVendor, setSelectedLedgerVendor] = useState<any>(null);
  const [shopProfile, setShopProfile] = useState<any>(null);

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeVendor, setActiveVendor] = useState<any>(null);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/parties?type=vendor");
      const json = await res.json();
      if (json.ok) {
        const vendorsData = json.data || [];
        
        // Fetch all transactions once for efficiency
        const [purRes, cashPayRes, bankPayRes, cashRecRes, bankRecRes] = await Promise.all([
          fetch("/api/purchases"),
          fetch("/api/cash-payments"),
          fetch("/api/bank-payments"),
          fetch("/api/cash-receipts"),
          fetch("/api/bank-receipts")
        ]);
        
        const purJson = await purRes.json();
        const cashPayJson = await cashPayRes.json();
        const bankPayJson = await bankPayRes.json();
        const cashRecJson = await cashRecRes.json();
        const bankRecJson = await bankRecRes.json();

        const purchases = purJson.ok ? purJson.data || [] : [];
        const cashPayments = cashPayJson.ok ? cashPayJson.data || [] : [];
        const bankPayments = bankPayJson.ok ? bankPayJson.data || [] : [];
        const cashReceipts = cashRecJson.ok ? cashRecJson.data || [] : [];
        const bankReceipts = bankRecJson.ok ? bankRecJson.data || [] : [];

        // Calculate balances for each vendor using unified function
        const vendorsWithBalances = vendorsData.map((vendor: any) => {
          const balance = calculateVendorBalanceFromTransactions(vendor, purchases, [], cashPayments, bankPayments, cashReceipts, bankReceipts);
          
          return {
            ...vendor,
            payable: balance.payable,
            advance: balance.advance,
            netBalance: balance.netBalance,
            status: balance.status
          };
        });

        setVendors(vendorsWithBalances);
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
    fetchVendors();
    fetchShopProfile();
  }, []);

  // URL param based ledger opening
  useEffect(() => {
    if ((vendors || []).length > 0 && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const vendorId = params.get("vendorId");
      if (vendorId) {
        const matched = (vendors || []).find((v: any) => v._id === vendorId);
        if (matched) {
          setSelectedLedgerVendor(matched);
        }
      }
    }
  }, [vendors]);

  const handleAdd = () => {
    setSelectedVendor(null);
    setIsModalOpen(true);
  };

  const handleEdit = (vendor: any) => {
    setSelectedVendor(vendor);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    try {
      const res = await fetch(`/api/parties/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Vendor deleted successfully!");
        fetchVendors();
      } else {
        alert("Failed to delete vendor");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting vendor");
    }
  };

  const handleOpenLedger = (vendor: any) => {
    setSelectedLedgerVendor(vendor);
  };

  // Filter and sort vendors
  const filteredVendors = vendors
    .filter((v: any) => {
      const matchesSearch = (v.companyName || v.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (v.code || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a: any, b: any) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      switch (sortBy) {
        case "name":
          return multiplier * (a.name || "").localeCompare(b.name || "");
        case "payable":
          return multiplier * ((a.payable || 0) - (b.payable || 0));
        case "advance":
          return multiplier * ((a.advance || 0) - (b.advance || 0));
        case "netBalance":
          return multiplier * ((a.netBalance || 0) - (b.netBalance || 0));
        default:
          return 0;
      }
    });

  // Calculate totals
  const totalPayable = vendors.reduce((sum, v) => sum + (v.payable || 0), 0);
  const totalAdvance = vendors.reduce((sum, v) => sum + (v.advance || 0), 0);
  const totalNet = totalPayable - totalAdvance;

  const columns = [
    { 
      header: "Vendor", 
      accessor: "name",
      render: (val: string, row: any) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-900 dark:text-white">{row.companyName || val}</span>
          {(row.phone || row.code) && (
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
              {row.code ? `${row.code} | ` : ""}{row.phone || ""}
            </span>
          )}
        </div>
      )
    },
    { 
      header: "Payable (We Owe Vendor)", 
      accessor: "payable",
      render: (val: number) => {
        const num = Number(val) || 0;
        if (num > 0) {
          return <span className="text-sm font-bold text-rose-600">Rs. {num.toLocaleString()}</span>;
        }
        return <span className="text-sm font-bold text-slate-500">Rs. 0</span>;
      }
    },
    { 
      header: "Advance (Vendor Owes Us)", 
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
          "We Owe Vendor": { emoji: "🔴", color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-900/30" },
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
  ];

  // LEDGER / COMPLETE VENDOR PROFILE HISTORY VIEW
  if (selectedLedgerVendor) {
    return (
      <VendorProfileHistory 
        vendor={selectedLedgerVendor}
        onBack={() => {
          setSelectedLedgerVendor(null);
          fetchVendors();
        }}
        shopProfile={shopProfile}
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
          title="Vendor Balances" 
          subtitle="Master Data / Vendor Balances"
          actions={[
            { label: "Export Excel", onClick: () => exportToExcel(vendors, "VendorBalances.xlsx"), icon: FileSpreadsheet },
            { label: "Print List", onClick: () => printListDocument({
                title: "Vendor Balances Report",
                companyName: shopProfile?.companyName || COMPANY_NAME,
                companyAddress: shopProfile?.address || "Bela, Balochistan, Pakistan",
                companyPhone: shopProfile?.phone || "",
                columns: [
                  { header: "#", key: "_idx" },
                  { header: "Vendor", key: "name" },
                  { header: "Payable (We Owe)", key: "payable" },
                  { header: "Advance (Vendor Owes Us)", key: "advance" },
                  { header: "Net Balance", key: "netBalance" },
                  { header: "Status", key: "status" },
                ],
                rows: (filteredVendors || []).map((v, i) => ({ 
                  ...v, 
                  _idx: i + 1,
                  name: v.companyName || v.name,
                  payable: `Rs.${(v.payable || 0).toLocaleString()}`, 
                  advance: `Rs.${(v.advance || 0).toLocaleString()}`, 
                  netBalance: `Rs.${(v.netBalance || 0).toLocaleString()}`,
                  status: v.status
                })),
                totals: {
                  _idx: "",
                  name: `TOTAL (${(filteredVendors || []).length} Vendors)`,
                  payable: `Rs.${(filteredVendors || []).reduce((a, v) => a + (v.payable || 0), 0).toLocaleString()}`,
                  advance: `Rs.${(filteredVendors || []).reduce((a, v) => a + (v.advance || 0), 0).toLocaleString()}`,
                  netBalance: `Rs.${(filteredVendors || []).reduce((a, v) => a + (v.netBalance || 0), 0).toLocaleString()}`,
                  status: "",
                },
              }), icon: Printer },
          ]}
        />
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ERPStatCard label="Total Vendors" value={(vendors || []).length} icon={UserCheck} variant="green" />
        <ERPStatCard label="Total Payable (We Owe)" value={`Rs. ${totalPayable.toLocaleString()}`} icon={Wallet} variant="maroon" />
        <ERPStatCard label="Total Vendor Advance" value={`Rs. ${totalAdvance.toLocaleString()}`} icon={Wallet} variant="green" />
        <ERPStatCard label="Net Vendor Balance" value={`Rs. ${totalNet.toLocaleString()}`} icon={Wallet} variant="slate" />
      </div>

      {/* Search & Add Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
        <div className="p-6 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by vendor name, code, phone..." 
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
              New Vendor
            </button>
          </div>
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div className="no-print bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 items-center">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">Filter Status:</span>
        {["All", "We Owe Vendor", "Advance Available", "Settled"].map((status) => (
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
          { key: "name", label: "Vendor Name" },
          { key: "payable", label: "Payable Amount" },
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

      {/* Data Table */}
      <div className="print-container bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:shadow-maroon-900/5 min-h-[100px]">
        
        {/* Print Header (Visible only when printing) */}
        <div className="hidden print-header p-6 pb-0">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{shopProfile?.companyName || COMPANY_NAME}</h2>
          <h3 className="text-sm font-bold text-maroon-800 uppercase tracking-widest mt-1">Vendor Balances Report</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Generated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="p-1">
          {(filteredVendors || []).length > 0 ? (
            <ERPDataTable 
              columns={columns} 
              data={filteredVendors} 
              actions={[
                { label: "Edit", onClick: handleEdit, icon: Edit2 },
                { label: "View Ledger", onClick: handleOpenLedger, icon: FileText },
                { label: "Make Payment", onClick: (row: any) => { setActiveVendor(row); setIsPaymentModalOpen(true); }, icon: Wallet },
                { label: "Delete", onClick: (row: any) => handleDelete(row._id), icon: Trash2, variant: "danger" },
              ]}
              footerContent={
                <tr>
                  <td colSpan={1} className="px-6 py-4 text-right uppercase tracking-widest text-xs font-black">Total:</td>
                  <td className="px-6 py-4 text-sm font-bold text-rose-600">
                    Rs. {(filteredVendors || []).reduce((acc, v) => acc + (v.payable || 0), 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                    Rs. {(filteredVendors || []).reduce((acc, v) => acc + (v.advance || 0), 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-100">
                    {(() => {
                      const totalNetFiltered = (filteredVendors || []).reduce((acc, v) => acc + (v.netBalance || 0), 0);
                      return totalNetFiltered < 0 ? `Rs. ${Math.abs(totalNetFiltered).toLocaleString()}` : `Rs. ${totalNetFiltered.toLocaleString()}`;
                    })()}
                  </td>
                  <td className="px-6 py-4 text-center">-</td>
                  <td className="px-6 py-4 print-hidden"></td>
                </tr>
              }
            />
          ) : (
            <div className="py-12 text-center no-print">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No vendors found</p>
            </div>
          )}
        </div>
      </div>

      {/* Vendor Modal */}
      {isModalOpen && (
        <VendorModal
          isOpen={isModalOpen}
          vendor={selectedVendor}
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            setIsModalOpen(false);
            fetchVendors();
          }}
        />
      )}

      {/* Quick Payment Modal */}
      {activeVendor && (
        <QuickPaymentModal 
          isOpen={isPaymentModalOpen} 
          onClose={() => setIsPaymentModalOpen(false)} 
          vendor={activeVendor} 
          onSuccess={fetchVendors} 
        />
      )}
    </div>
  );
}
