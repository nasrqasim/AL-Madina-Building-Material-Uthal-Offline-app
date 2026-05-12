"use client";

import { 
  ArrowLeft, 
  Edit, 
  Printer, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Link2,
  Calendar,
  User,
  Package,
  MapPin,
  FileText
} from "lucide-react";

import { printPage } from "@/lib/excel";
import PrintTemplate from "@/components/print/PrintTemplate";

interface DeliveryChallanDetailsProps {
  record: any;
  onClose: () => void;
  onEdit: () => void;
}

export default function DeliveryChallanDetails({ record, onClose, onEdit }: DeliveryChallanDetailsProps) {
  const items = record.lines || record.items || [];

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 min-h-screen">
      <div className="print:hidden">
        {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <ArrowLeft size={16} /> Back to List
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{record.invoiceNo || record.dcNo}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              record.status?.toLowerCase() === "delivered" ? "bg-emerald-100 text-emerald-700" : 
              record.status?.toLowerCase() === "dispatched" ? "bg-blue-100 text-blue-700" : 
              record.status?.toLowerCase() === "invoiced" ? "bg-purple-100 text-purple-700" :
              "bg-orange-100 text-orange-700"
            }`}>
              {record.status}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={onEdit}
            className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/10 transition-all"
          >
            <Edit size={16} className="mr-2" /> Edit
          </button>
          <button onClick={printPage} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <Printer size={16} className="mr-2" /> Print
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Challan Details Grid */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
          <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Dispatch Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-y-8 gap-x-12">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Challan Number</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.invoiceNo || record.dcNo}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.date ? new Date(record.date).toLocaleDateString() : ""}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.partyId?.companyName || record.partyId?.name || record.customer}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Order Reference</p>
              <div className="flex items-center gap-1 text-sm font-bold text-blue-600">
                {record.reference || record.orderRef || "N/A"} <Link2 size={14} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vehicle No</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.regNo || record.vehicleNo || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Driver Name</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.employeeId?.name || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dispatch From</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Main Warehouse</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Shipping Address</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">Industrial Area, Sector 5, Karachi</p>
            </div>
          </div>
        </section>

        {/* Line Items Table */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Dispatched Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[200px]">Description</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Qty Dispatched</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">UOM</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {items.map((item: any, index: number) => (
                  <tr key={item.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                    <td className="px-8 py-6 text-xs font-bold text-slate-400 dark:text-slate-500 text-center">{index + 1}</td>
                    <td className="px-8 py-6 text-sm text-slate-600 dark:text-slate-300 font-bold">{item.description || item.itemName}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{item.qty}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{item.uom || item.unit || "Units"}</td>
                    <td className="px-8 py-6 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">{item.remarks || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      </div>
      <PrintTemplate 
        formatName="Challan" 
        data={{
          poNumber: record.dcNo,
          date: record.date,
          customer: record.customer,
          linkedRef: record.orderRef,
          total: 0,
          subtotal: 0,
          taxAmount: 0,
          discountAmount: 0
        }}
        items={items}
      />
    </div>
  );
}
