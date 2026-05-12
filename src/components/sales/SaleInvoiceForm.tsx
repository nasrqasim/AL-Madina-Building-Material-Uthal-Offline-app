"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  FileText,
  User,
  Calendar,
  CreditCard,
  Building,
  MapPin,
  Link2
} from "lucide-react";

interface SIItem {
  id: string;
  itemId: string;
  description: string;
  qty: number;
  unitPrice: number;
  discPercent: number;
  isTaxable: boolean;
  taxPercent: number;
  total: number;
}

interface SaleInvoiceFormProps {
  onClose: () => void;
  initialData?: any;
}

export default function SaleInvoiceForm({ onClose, initialData }: SaleInvoiceFormProps) {
  const [items, setItems] = useState<SIItem[]>(() => {
    if (initialData?.lines && initialData.lines.length > 0) {
      return initialData.lines.map((l: any, index: number) => ({
        id: index.toString(),
        itemId: l.itemId,
        description: l.description,
        qty: l.qty,
        unitPrice: l.rate,
        discPercent: l.discountPercent || 0,
        isTaxable: (l.taxPercent || 0) > 0,
        taxPercent: l.taxPercent || 0,
        total: l.netAmount
      }));
    }
    return [{ id: "1", itemId: "", description: "", qty: 1, unitPrice: 0, discPercent: 0, isTaxable: true, taxPercent: 18, total: 0 }];
  });
  
  const [formData, setFormData] = useState({
    invoiceNumber: initialData?.invoiceNo || "Auto-generated",
    invoiceDate: initialData?.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    status: initialData?.status || "draft",
    customerId: initialData?.partyId?._id || initialData?.partyId || "",
    linkedRef: initialData?.reference || "",
    salesPerson: initialData?.employeeId?._id || initialData?.employeeId || "",
    warehouseId: initialData?.locationId?._id || initialData?.locationId || "",
    currency: "PKR",
    paymentMethod: initialData?.paymentMethod || "Credit",
    notes: initialData?.notes || ""
  });
  
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [itemsRes, partiesRes, employeesRes, locationsRes] = await Promise.all([
        fetch("/api/items"),
        fetch("/api/parties"),
        fetch("/api/employees"),
        fetch("/api/locations")
      ]);
      const [itemsJson, partiesJson, employeesJson, locationsJson] = await Promise.all([
        itemsRes.json(),
        partiesRes.json(),
        employeesRes.json(),
        locationsRes.json()
      ]);
      
      if (itemsJson.ok) setAvailableItems(itemsJson.data);
      if (partiesJson.ok) setCustomers(partiesJson.data.filter((p: any) => p.type === "Customer"));
      if (employeesJson.ok) setEmployees(employeesJson.data);
      if (locationsJson.ok) setLocations(locationsJson.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addItem = () => setItems(prev => [...prev, { id: Date.now().toString(), itemId: "", description: "", qty: 1, unitPrice: 0, discPercent: 0, isTaxable: true, taxPercent: 18, total: 0 }]);
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  
  const updateItem = (id: string, field: keyof SIItem, value: any) => {
    setItems(items.map(i => {
      if (i.id === id) {
        let updated = { ...i, [field]: value };
        
        if (field === "itemId") {
          const selected = availableItems.find(ai => ai._id === value);
          if (selected) {
            updated.description = selected.name;
            updated.unitPrice = selected.retailRate || selected.wholesaleRate || 0;
          }
        }

        const base = (updated.qty || 0) * (updated.unitPrice || 0);
        const afterDisc = base - (base * (updated.discPercent || 0) / 100);
        const tax = updated.isTaxable ? (afterDisc * (updated.taxPercent || 0) / 100) : 0;
        updated.total = afterDisc + tax;
        return updated;
      }
      return i;
    }));
  };

  const subTotal = items.reduce((sum, i) => sum + ((i.qty || 0) * (i.unitPrice || 0)), 0);
  const totalDiscount = items.reduce((sum, i) => sum + (((i.qty || 0) * (i.unitPrice || 0)) * (i.discPercent || 0) / 100), 0);
  const totalTax = items.reduce((sum, i) => {
    const base = (i.qty || 0) * (i.unitPrice || 0);
    const afterDisc = base - (base * (i.discPercent || 0) / 100);
    return sum + (i.isTaxable ? (afterDisc * (i.taxPercent || 0) / 100) : 0);
  }, 0);
  
  const grandTotal = subTotal - totalDiscount + totalTax;

  const handleSave = async (status: string) => {
    if (!formData.customerId) return alert("Please select a customer");
    if (items.some(i => !i.itemId)) return alert("Please select items for all rows");

    const isEdit = initialData && initialData._id;
    const payload = {
      ...formData,
      type: "sale",
      invoiceNo: formData.invoiceNumber === "Auto-generated" ? `SI-${Date.now().toString().slice(-6)}` : formData.invoiceNumber,
      date: formData.invoiceDate,
      partyId: formData.customerId,
      reference: formData.linkedRef,
      employeeId: formData.salesPerson || undefined,
      locationId: formData.warehouseId || undefined,
      lines: items.map(i => ({
        itemId: i.itemId,
        description: i.description,
        qty: i.qty,
        rate: i.unitPrice,
        discountPercent: i.discPercent,
        taxPercent: i.taxPercent,
        netAmount: i.total
      })),
      subTotal,
      discountAmount: totalDiscount,
      taxAmount: totalTax,
      totalAmount: grandTotal,
      status: status.toLowerCase(),
      paymentMethod: formData.paymentMethod,
      notes: formData.notes
    };

    try {
      const url = isEdit ? `/api/invoices/${initialData._id}` : "/api/invoices";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(`Sale Invoice ${isEdit ? "updated" : "saved"} successfully!`);
        onClose();
      } else {
        const json = await res.json();
        alert("Error: " + (json.error || json.message));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save sale invoice");
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 min-h-screen font-sans">
      {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-6">
          <button onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-all">
            <ArrowLeft size={16} /> Back to List
          </button>
          <div className="h-8 w-[1px] bg-slate-200" />
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">New Sale Invoice</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button type="button" onClick={() => handleSave("Draft")} className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/10 transition-all">
            <Save size={16} className="mr-2" /> Save Draft
          </button>
          <button type="button" onClick={() => handleSave("Posted")} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-lg shadow-emerald-600/10 transition-all">
            <CheckCircle2 size={16} className="mr-2" /> Save & Post
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 space-y-8 pb-32">
        {/* Section 1: Invoice Details */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-maroon-800" />
          <div className="flex items-center space-x-2 mb-8">
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Billing Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Invoice Number</label>
              <input value={formData.invoiceNumber} disabled className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Invoice Date *</label>
              <input type="date" value={formData.invoiceDate} onChange={(e) => setFormData({...formData, invoiceDate: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</label>
              <input value={formData.status} disabled className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-400 dark:text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Linked Ref (SO/DC)</label>
              <input placeholder="Link to SO or DC" value={formData.linkedRef} onChange={(e) => setFormData({...formData, linkedRef: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer *</label>
              <select value={formData.customerId} onChange={(e) => setFormData({...formData, customerId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="">-- Select Customer --</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.companyName || c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sales Person</label>
              <select value={formData.salesPerson} onChange={(e) => setFormData({...formData, salesPerson: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none">
                <option value="">-- Select Rep --</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Warehouse *</label>
              <select value={formData.warehouseId} onChange={(e) => setFormData({...formData, warehouseId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none">
                <option value="">-- Select Location --</option>
                {locations.map(l => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payment Method</label>
              <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none">
                <option value="Credit">Credit (30 Days)</option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Currency</label>
              <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none">
                <option value="PKR">PKR</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 2: Line Items */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-slate-400/20" />
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Invoice Items</h3>
            <button onClick={addItem} className="px-4 py-2 text-[10px] font-black bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl uppercase tracking-widest flex items-center transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 shadow-sm">
              <Plus size={14} className="mr-1.5 text-maroon-800" /> Add Row
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[200px]">Item</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Description</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Qty</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-28 text-center">Unit Price</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Disc %</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Tax %</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-right">Total</th>
                  <th className="px-8 py-4 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/30 transition-colors group">
                    <td className="px-8 py-4 text-xs font-bold text-slate-300 text-center">{index + 1}</td>
                    <td className="px-8 py-4">
                      <select 
                        value={item.itemId} 
                        onChange={(e) => updateItem(item.id, "itemId", e.target.value)} 
                        className="w-full bg-transparent text-sm font-bold focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all appearance-none"
                      >
                        <option value="">Select Item</option>
                        {availableItems.map(ai => (
                          <option key={ai._id} value={ai._id}>{ai.code} - {ai.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-8 py-4">
                      <input placeholder="Description" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} className="w-full bg-transparent text-sm font-medium focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-8 py-4">
                      <input type="number" value={item.qty} onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-8 py-4">
                      <input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-8 py-4">
                      <input type="number" value={item.discPercent} onChange={(e) => updateItem(item.id, "discPercent", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-8 py-4">
                      <input type="number" value={item.taxPercent} onChange={(e) => updateItem(item.id, "taxPercent", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 bg-white dark:bg-slate-900 flex flex-col items-end space-y-3">
            <div className="w-full md:w-80 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Subtotal</span>
                <span className="font-bold text-slate-900 dark:text-white">{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Discount</span>
                <span className="font-bold text-rose-600">-{totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Sales Tax</span>
                <span className="font-bold text-slate-900 dark:text-white">+{totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs font-black text-maroon-800 uppercase tracking-[0.2em]">Grand Total (PKR)</span>
                <span className="text-3xl font-black text-maroon-800 tracking-tighter">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Additional Information */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Notes & Remarks</label>
          <textarea rows={4} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Internal notes or terms..." className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:border-maroon-800 transition-all resize-none outline-none" />
        </section>
      </div>
    </div>
  );
}
