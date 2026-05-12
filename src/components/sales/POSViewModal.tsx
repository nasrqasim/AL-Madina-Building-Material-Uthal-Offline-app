"use client";

import { X, Printer, Package, User, Calendar, CreditCard, Banknote, Building } from "lucide-react";
import ERPModal from "../erp/ui/ERPModal";

interface POSViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
}

export default function POSViewModal({ isOpen, onClose, sale }: POSViewModalProps) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <ERPModal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Details"
      size="lg"
      footer={
        <div className="flex justify-between w-full">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
            Close
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-8 py-2.5 bg-maroon-800 text-white rounded-xl text-sm font-black hover:bg-maroon-900 transition-all shadow-xl shadow-maroon-900/20"
          >
            <Printer size={18} /> Print Receipt
          </button>
        </div>
      }
    >
      <div className="p-2 space-y-8 print:p-0" id="pos-receipt">
        {/* Print Only Header (Logo/Shop Info) */}
        <div className="hidden print:flex flex-col items-center text-center mb-8 border-b border-dashed border-slate-300 pb-6">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Najeeb Oil Shop</h1>
          <p className="text-[10px] font-bold text-slate-500 mt-1">Main Road, Sector G-9, Islamabad</p>
          <p className="text-[10px] font-bold text-slate-500">Contact: +92 300 1234567</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Receipt Info</label>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm text-maroon-800">
                  <Package size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{sale.invoiceNo}</p>
                  <p className="text-[10px] font-bold text-slate-400">{new Date(sale.date).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Customer Info</label>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm text-blue-600">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{sale.partyId?.companyName || sale.partyId?.name || "Walk-in Customer"}</p>
                  <p className="text-[10px] font-bold text-slate-400">{sale.partyId?.contact || "No Contact Provided"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Payment Details</label>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
                {sale.paymentMethod === 'Cash' ? (
                   <Banknote size={32} className="text-emerald-600 mb-2" />
                ) : (
                   <CreditCard size={32} className="text-blue-600 mb-2" />
                )}
                <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Rs. {(sale.totalAmount || 0).toLocaleString()}</h4>
                <span className="px-3 py-1 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-full border border-slate-200 dark:border-slate-800">
                  Paid via {sale.paymentMethod || "Credit"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Items List</label>
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Description</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Qty</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-28">Price</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {sale.lines?.map((line: any, idx: number) => (
                  <tr key={idx} className="text-sm font-bold">
                    <td className="px-6 py-4 text-slate-900 dark:text-white">{line.description || line.itemId?.name}</td>
                    <td className="px-6 py-4 text-center text-slate-500">{line.qty || line.cartons}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{(line.rate || line.ratePerCarton || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-slate-900 dark:text-white font-black">{(line.netAmount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between w-64 text-sm font-bold text-slate-400">
             <span className="uppercase tracking-widest text-[10px]">Subtotal</span>
             <span className="text-slate-900 dark:text-white">Rs. {(sale.subTotal || sale.totalAmount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between w-64 text-sm font-bold text-slate-400">
             <span className="uppercase tracking-widest text-[10px]">Tax (GST 5%)</span>
             <span className="text-slate-900 dark:text-white">Rs. {(sale.taxAmount || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between w-64 items-center pt-4 border-t border-slate-100 dark:border-slate-800">
             <span className="text-[10px] font-black text-maroon-800 uppercase tracking-widest">Grand Total</span>
             <span className="text-2xl font-black text-maroon-800 tracking-tighter">Rs. {(sale.totalAmount || 0).toLocaleString()}</span>
          </div>
        </div>
        
        {/* Print Only Footer */}
        <div className="hidden print:block text-center mt-12 pt-8 border-t border-dashed border-slate-300">
          <p className="text-sm font-black text-slate-900">Thank you for your business!</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1 italic">This is a computer generated receipt.</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          nav, header, footer, button, .no-print {
            display: none !important;
          }
          .modal-overlay {
            background: transparent !important;
          }
          #pos-receipt {
            display: block !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            color: black !important;
            background: white !important;
          }
          #pos-receipt * {
            color: black !important;
            border-color: #eee !important;
          }
          /* Ensure the modal content is the only thing visible */
          div[role="dialog"] {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </ERPModal>
  );
}
