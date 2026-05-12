"use client";

import { useState, useEffect } from "react";
import PurchaseOrderForm from "@/components/purchases/PurchaseOrderForm";
import PurchaseOrderDetails from "@/components/purchases/PurchaseOrderDetails";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { Plus, Search, Filter, Eye, Edit, Trash2, ShoppingCart, FileCheck, Clock, Printer, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";


export default function PurchaseOrderPage() {
  const [showForm, setShowForm] = useState(false);
  const [viewOrder, setViewOrder] = useState<any | null>(null);
  const [editOrder, setEditOrder] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/invoices?type=purchase_order", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setOrders(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [showForm]);

  const handleSaveOrder = (data: any) => {
    if (data.id) {
      setOrders(orders.map(o => o.id === data.id ? { ...o, ...data } : o));
    } else {
      setOrders([...orders, { ...data, id: Date.now().toString() }]);
    }
    setShowForm(false);
    setEditOrder(null);
  };

  const deleteOrder = async (id: string) => {
    if (confirm("Are you sure you want to delete this purchase order?")) {
      try {
        const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
        if (res.ok) {
          setOrders(orders.filter(o => o._id !== id));
          alert("Deleted successfully");
        } else {
          alert("Failed to delete");
        }
      } catch (e) { console.error(e); }
    }
  };

  if (showForm) {
    return <PurchaseOrderForm 
      onClose={() => {
        setShowForm(false);
        setEditOrder(null);
      }} 
      onSave={handleSaveOrder}
      initialData={editOrder}
    />;
  }

  if (viewOrder) {
    return <PurchaseOrderDetails order={viewOrder} onClose={() => setViewOrder(null)} onEdit={() => {
      setEditOrder(viewOrder);
      setShowForm(true);
      setViewOrder(null);
    }} />;
  }

  return (
    <div className="space-y-6">
      <ERPPageHeader
        title="Purchase Order"
        description="Create and manage purchase orders to send to your vendors."
        actions={[
          { label: "Export", onClick: () => exportToExcel(orders, "PurchaseOrders.xlsx"), icon: FileSpreadsheet }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-maroon-50 text-maroon-800 rounded-xl flex items-center justify-center">
            <ShoppingCart size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Orders</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{orders.length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <FileCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Completed</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{orders.filter(o => o.status === "Completed").length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pending</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{orders.filter(o => o.status === "Draft" || o.status === "Approved").length}</h4>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-800/50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by PO#, vendor, reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/10 transition-all font-medium shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/10 transition-all flex-1 md:flex-none shadow-sm min-w-[140px]">
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button 
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-2 bg-maroon-800 text-white rounded-lg text-sm font-bold hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
            >
              <Plus size={18} />
              New Purchase Order
            </button>
            <button className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">PO Number</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reference</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Amount (PKR)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Linked</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Emp/Job/Loc</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-bold">Loading...</td></tr>
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-maroon-800 transition-colors">{order.invoiceNo || order.docNo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{new Date(order.date).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{order.partyId?.companyName || order.partyId?.name || order.vendor}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{order.reference}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{(order.totalAmount || order.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {order.linked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                          <Plus size={10} /> {order.linked}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {order.employeeId && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{order.employeeId.name}</span>}
                        {order.jobId && <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{order.jobId.title || order.jobId.name}</span>}
                        {order.locationId && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">{order.locationId.name}</span>}
                        {!order.employeeId && !order.jobId && !order.locationId && <span className="text-slate-300">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        order.status === "Completed" ? "bg-emerald-100 text-emerald-700" : 
                        order.status === "Approved" ? "bg-blue-100 text-blue-700" : 
                        order.status === "Cancelled" ? "bg-rose-100 text-rose-700" :
                        "bg-orange-100 text-orange-700"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setViewOrder(order)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-all" 
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => { setEditOrder(order); setShowForm(true); }}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={printPage}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-all" title="Print"
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => deleteOrder(order._id)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" 
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
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">No purchase orders found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-50 bg-slate-50 dark:bg-slate-800/50/30 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
          <span>Total: {orders.length} record(s)</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Completed: {orders.filter(o => o.status === "Completed").length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span> Draft: {orders.filter(o => o.status === "Draft").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
