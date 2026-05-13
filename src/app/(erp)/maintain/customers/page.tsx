"use client";

import { useState, useEffect } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import ERPDataTable from "@/components/erp/ui/ERPDataTable";
import CustomerModal from "@/components/erp/maintain/CustomerModal";
import QuickReceiptModal from "@/components/erp/maintain/QuickReceiptModal";
import { Plus, FileText, Download, Printer, UserCheck, UserX, Wallet, Search, MoreVertical, Edit2, Trash2, MapPin, FileSpreadsheet } from "lucide-react";
import ERPStatCard from "@/components/erp/ui/ERPStatCard";
import { exportToExcel, downloadTemplate, printPage, triggerFileInput, importFromExcel } from "@/lib/excel";

export default function CustomersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<any>(null);

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

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAdd = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleImport = async () => {
    const file = await triggerFileInput();
    if (file) {
      const data = await importFromExcel(file);
      // Validate and append data - ideally should post to API in a loop or bulk endpoint
      // For now, let's refresh after a basic import (bulk import API needed for robust use)
      console.log("Imported data:", data);
      alert("Bulk import API needs to be implemented. Data parsed successfully.");
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
      companyName: data.name, // Mapping for backward compatibility if needed
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
      render: (val: string) => (
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{val}</span>
      )
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
      header: "Udhaar (Balance)", 
      accessor: "balance", 
      render: (val: number, row: any) => (
        <div className="flex flex-col">
          <span className={`text-sm font-black ${val > (row.creditLimit || 0) ? "text-red-600 animate-pulse" : val > 0 ? "text-orange-600" : "text-emerald-600"}`}>
            Rs.{val?.toLocaleString() || "0"}
          </span>
          {val > (row.creditLimit || 0) && (
            <span className="text-[8px] font-black text-red-600 uppercase tracking-tighter">Over Limit! (Max: {row.creditLimit?.toLocaleString()})</span>
          )}
        </div>
      )
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

  const categories = ["Urgent/COD", "Short term", "Long term"];

  return (
    <div className="space-y-6">
      <ERPPageHeader 
        title="Customers" 
        subtitle="Master Data / Customers"
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export Excel", onClick: () => exportToExcel(customers, "Customers.xlsx"), icon: FileSpreadsheet },
          { label: "Download Template", onClick: () => downloadTemplate(["Company Name", "Contact Person", "Phone", "Email", "NTN", "Location", "Balance", "Status"], "CustomersTemplate.xlsx"), icon: Download },
          { label: "Import Excel", onClick: handleImport, icon: FileText },
        ]}
      />

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ERPStatCard label="Active Customers" value={customers.filter(c => c.status === "Active").length} icon={UserCheck} variant="green" />
        <ERPStatCard label="Inactive" value={customers.filter(c => c.status === "Inactive").length} icon={UserX} variant="slate" />
        <ERPStatCard label="Total Outstanding" value={`Rs. ${(customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0) / 1000000).toFixed(1)}M`} icon={Wallet} variant="maroon" />
      </div>

      {/* Search & Add Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
        <div className="p-6 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by customer name, contact person, NTN, phone..." 
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

      {/* Separate Tables for each Category */}
      <div className="space-y-12">
        {categories.map(cat => {
          const catCustomers = customers.filter(c => (c.category || "Short term") === cat);

          return (
            <div key={cat} className="space-y-4">
              <div className="flex items-center gap-4 px-6">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-maroon-800 bg-maroon-50 dark:bg-maroon-900/30 dark:text-maroon-400 px-6 py-2 rounded-full shadow-sm">
                  {cat} Customers
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
                      { label: "View Ledger", onClick: () => {}, icon: FileText },
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
    </div>
  );
}
