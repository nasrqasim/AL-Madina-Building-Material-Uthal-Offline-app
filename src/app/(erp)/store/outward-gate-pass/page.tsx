"use client";

import { useState, useEffect } from "react";
import OutwardGatePassForm from "@/components/store/OutwardGatePassForm";
import OutwardGatePassDetails from "@/components/store/OutwardGatePassDetails";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { Plus, Search, Filter, Eye, Edit, Trash2, Truck, ClipboardList, CheckCircle2, Clock, XCircle, Printer, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";

interface OutwardGatePass {
  id: string;
  docNo: string;
  date: string;
  purpose: string;
  destination: string;
  vehicleNo: string;
  driverName: string;
  status: "Pending" | "Dispatched" | "Cancelled";
  location: string;
}

const initialGatePasses: OutwardGatePass[] = [
  {
    id: "1",
    docNo: "OGP-2026-00001",
    date: "2026-04-28 09:45",
    purpose: "Sale",
    destination: "Client Site A",
    vehicleNo: "LHR-1234",
    driverName: "Aslam Pervez",
    status: "Dispatched",
    location: "Main Warehouse"
  },
  {
    id: "2",
    docNo: "OGP-2026-00002",
    date: "2026-04-30 11:30",
    purpose: "Transfer",
    destination: "Secondary Branch",
    vehicleNo: "KHI-5678",
    driverName: "Irfan Ahmed",
    status: "Pending",
    location: "Loading Dock B"
  },
  {
    id: "3",
    docNo: "OGP-DUMMY",
    date: "2026-04-30 15:00",
    purpose: "Sample",
    destination: "Marketing Dept",
    vehicleNo: "SL-9900",
    driverName: "Zahid Khan",
    status: "Pending",
    location: "Main Warehouse"
  }
];

export default function OutwardGatePassPage() {
  const [showForm, setShowForm] = useState(false);
  const [viewGP, setViewGP] = useState<any | null>(null);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchGatePasses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/invoices?type=outward_gp", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setGatePasses(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGatePasses();
  }, [showForm]);

  const deleteGatePass = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGatePasses(prev => prev.filter(gp => gp._id !== id));
      } else {
        window.alert("Failed to delete");
      }
    } catch (e) { console.error(e); }
  };

  if (showForm) {
    return <OutwardGatePassForm onClose={() => { setShowForm(false); setViewGP(null); }} initialData={viewGP && showForm ? viewGP : null} />;
  }

  if (viewGP) {
    return (
      <OutwardGatePassDetails 
        record={viewGP} 
        onClose={() => setViewGP(null)} 
        onEdit={() => {
          setShowForm(true);
          setViewGP(null);
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <ERPPageHeader
        title="Outward Gate Pass"
        description="Record and authorize goods leaving the premises."
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export Excel", onClick: () => exportToExcel(gatePasses, "OutwardGatePasses.xlsx"), icon: FileSpreadsheet },
        ]}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-maroon-50 text-maroon-800 rounded-xl flex items-center justify-center">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Outward</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{gatePasses.length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dispatched</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{gatePasses.filter(g => g.status === "Dispatched").length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pending</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{gatePasses.filter(g => g.status === "Pending").length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cancelled</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">0</h4>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filters & Search Row */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by vehicle#, destination, doc#..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <select className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none">
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Dispatched">Dispatched</option>
            </select>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-8 py-3 bg-maroon-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
            >
              <Plus size={18} />
              New Outward
            </button>
            <button className="p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Entry #</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date & Time</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Purpose</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vehicle / Driver</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Destination</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={8} className="px-8 py-12 text-center text-slate-400 font-bold">Loading...</td></tr>
              ) : gatePasses.length > 0 ? (
                gatePasses.map((gp) => (
                  <tr key={gp._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-800 transition-colors">{gp.invoiceNo || gp.docNo}</span>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-300">{gp.date ? gp.date.replace('T', ' ').substring(0, 16) : "-"}</td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-700 dark:text-slate-200">{gp.purpose}</td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-rose-800 tracking-tighter uppercase">{gp.vehicleNo}</span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{gp.driverName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{gp.partyId?.companyName || gp.partyId?.name || gp.destination}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">{gp.location || gp.warehouse}</span>
                    </td>

                    <td className="px-8 py-5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        gp.status === "Dispatched" ? "bg-emerald-100 text-emerald-700" : 
                        gp.status === "Pending" ? "bg-orange-100 text-orange-700" : 
                        "bg-rose-100 text-rose-700"
                      }`}>
                        {gp.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={printPage}
                          className="p-1.5 text-slate-300 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-all" title="Print"
                        >
                          <Printer size={16} />
                        </button>
                        <button onClick={() => setViewGP(gp)} className="p-1.5 text-slate-300 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-all" title="View">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => { setViewGP(gp); setShowForm(true); }} className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => deleteGatePass(gp._id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" 
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-8 py-12 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">No outward entries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
