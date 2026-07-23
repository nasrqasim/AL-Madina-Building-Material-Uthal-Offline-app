"use client";

import { useState, useEffect, useMemo } from "react";
import ItemSearchInput from "@/components/erp/ui/ItemSearchInput";
import ItemDetailsPanel from "@/components/erp/ui/ItemDetailsPanel";
import { getProductUnit } from "@/lib/dynamicUnits";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  X,
  CheckCircle2,
  ShoppingCart,
  User,
  Calendar,
  MapPin,
  Truck
} from "lucide-react";

interface SOItem {
  id: string;
  itemId: string;
  itemCode?: string;
  description: string;
  quantity: number; // Dynamic quantity
  unit: string; // Product's unit
  unitPrice: number;
  discPercent: number;
  isTaxable: boolean;
  taxPercent: number;
  total: number;
  // Legacy fields for backward compatibility
  cartons?: number;
  gallons?: number;
  liters?: number;
}

interface SaleOrderFormProps {
  onClose: () => void;
  initialData?: any;
}

export default function SaleOrderForm({ onClose, initialData }: SaleOrderFormProps) {
  const [items, setItems] = useState<SOItem[]>(() => {
    if (initialData?.lines && initialData.lines.length > 0) {
      return initialData.lines.map((l: any, index: number) => {
        const item = l.itemId?._id ? availableItems.find(ai => ai._id === l.itemId._id) : null;
        const unit = getProductUnit(item);
        return {
          id: index.toString(),
          itemId: l.itemId?._id || l.itemId || "",
          itemCode: l.itemId?.code || "",
          description: l.description || "",
          quantity: l.cartons || l.qty || 0,
          unit: unit,
          unitPrice: l.rate || 0,
          discPercent: l.discountPercent || 0,
          isTaxable: (l.taxPercent || 0) > 0,
          taxPercent: l.taxPercent || 0,
          total: l.netAmount || 0,
          // Legacy fields
          cartons: l.cartons || l.qty || 0,
          gallons: l.gallons || 0,
          liters: l.liters || 0
        };
      });
    }
    return [{ id: "1", itemId: "", itemCode: "", description: "", quantity: 0, unit: "Per Piece", unitPrice: 0, discPercent: 0, isTaxable: true, taxPercent: 0, total: 0, cartons: 0, gallons: 0, liters: 0 }];
  });
  
  const [formData, setFormData] = useState({
    orderNumber: initialData?.invoiceNo || "Auto-generated",
    orderDate: initialData?.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    status: initialData?.status || "draft",
    customerId: initialData?.partyId?._id || initialData?.partyId || "",
    customerPo: initialData?.reference || "",
    salesPerson: initialData?.employeeId?._id || initialData?.employeeId || "",
    warehouseId: initialData?.locationId?._id || initialData?.locationId || "",
    paymentTerms: initialData?.paymentTerms || "",
    shippingMethod: initialData?.shippingMethod || "",
    notes: initialData?.notes || ""
  });

  const [selectedLineId, setSelectedLineId] = useState<string | null>(items[0]?.id || "1");
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
      
      if (itemsJson.ok) setAvailableItems(itemsJson.data || []);
      if (partiesJson.ok) setCustomers(partiesJson.data.filter((p: any) => p.type === "Customer"));
      if (employeesJson.ok) setEmployees(employeesJson.data || []);
      if (locationsJson.ok) setLocations(locationsJson.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addItem = () => {
    const newId = Date.now().toString();
    setItems(prev => [...prev, { id: newId, itemId: "", itemCode: "", description: "", quantity: 0, unit: "Per Piece", unitPrice: 0, discPercent: 0, isTaxable: true, taxPercent: 0, total: 0, cartons: 0, gallons: 0, liters: 0 }]);
    setSelectedLineId(newId);
  };
  
  const removeItem = (id: string) => {
    const filtered = (items || []).filter(i => i.id !== id);
    setItems(filtered);
    if (selectedLineId === id && filtered.length > 0) {
      setSelectedLineId(filtered[0].id);
    }
  };
  
  const selectedItemDetails = useMemo(() => {
    const line = (items || []).find(l => l.id === selectedLineId);
    if (!line || !line.itemId) return null;
    return (availableItems || []).find(i => i._id === line.itemId);
  }, [selectedLineId, items, availableItems]);

  const [showItemSearch, setShowItemSearch] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleItemKeyDown = (e: React.KeyboardEvent, lineId: string, filteredItems: any[]) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev < (filteredItems || []).length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[activeIndex]) {
        updateItem(lineId, "itemId", filteredItems[activeIndex]._id);
        setShowItemSearch(null);
      }
    } else if (e.key === "Escape") {
      setShowItemSearch(null);
    }
  };

  const updateItem = (id: string, field: keyof SOItem, value: any) => {
    setItems((items || []).map(i => {
      if (i.id === id) {
        let updated = { ...i, [field]: value };

        // Update unit when item is selected
        if (field === "itemId") {
          const selected = (availableItems || []).find(ai => ai._id === value);
          if (selected) {
            updated.itemCode = selected.code;
            updated.description = selected.name;
            updated.unit = getProductUnit(selected);
            updated.unitPrice = selected.retailRate || selected.rate || 0;
            updated.quantity = 1;
          }
        }

        // Handle quantity changes
        if (field === "quantity") {
          // Update legacy cartons field for backward compatibility
          updated.cartons = value;
        }

        // Calculate total when quantity, unitPrice, or discount changes
        if (field === "quantity" || field === "unitPrice" || field === "discPercent" || field === "isTaxable" || field === "taxPercent") {
          const qty = Number(updated.quantity) || 0;
          const price = Number(updated.unitPrice) || 0;
          const base = qty * price;
          const afterDisc = base - (base * (updated.discPercent || 0) / 100);
          const tax = updated.isTaxable ? (afterDisc * (updated.taxPercent || 0) / 100) : 0;
          updated.total = afterDisc + tax;
          // Update legacy cartons field
          updated.cartons = qty;
        }

        return updated;
      }
      return i;
    }));
  };

  const handleSave = async (status: string) => {
    if (!formData.customerId) return alert("Please select a customer");
    if ((items || []).some(i => !i.itemId)) return alert("Please select items for all rows");

    const isEdit = initialData && initialData._id;
    const payload = {
      ...formData,
      type: "sale_order",
      invoiceNo: formData.orderNumber === "Auto-generated" ? `SO-${Date.now().toString().slice(-6)}` : formData.orderNumber,
      partyId: formData.customerId,
      reference: formData.customerPo,
      employeeId: formData.salesPerson || undefined,
      locationId: formData.warehouseId || undefined,
      lines: (items || []).map(i => ({
        itemId: i.itemId,
        description: i.description,
        qty: i.quantity || i.cartons,
        unit: i.unit || "Per Piece",
        rate: i.unitPrice,
        discountPercent: i.discPercent,
        taxPercent: i.taxPercent,
        netAmount: i.total,
        // Legacy fields for backward compatibility
        cartons: i.cartons,
        gallons: i.gallons,
        liters: i.liters
      })),
      subTotal,
      discountAmount: totalDiscount,
      totalAmount: grandTotal,
      status: status.toLowerCase()
    };

    try {
      const url = isEdit ? `/api/invoices/${initialData._id}` : "/api/invoices";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(`Sale Order ${isEdit ? "updated" : "saved"} successfully!`);
        onClose();
      } else {
        const json = await res.json();
        alert("Error: " + (json.message || json.error));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save sale order");
    }
  };

  const subTotal = (items || []).reduce((sum, i) => sum + ((i.quantity || 0) * (i.unitPrice || 0)), 0);
  const totalDiscount = (items || []).reduce((sum, i) => sum + (((i.quantity || 0) * (i.unitPrice || 0)) * (i.discPercent || 0) / 100), 0);
  const totalTax = (items || []).reduce((sum, i) => sum + (i.isTaxable ? (((i.quantity || 0) * (i.unitPrice || 0) - ((i.quantity || 0) * (i.unitPrice || 0) * (i.discPercent || 0) / 100)) * (i.taxPercent || 0) / 100) : 0), 0);
  const grandTotal = subTotal - totalDiscount + totalTax;

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 min-h-screen font-sans">
      {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-6">
          <button onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-all">
            <ArrowLeft size={16} /> Back to List
          </button>
          <div className="h-8 w-[1px] bg-slate-200" />
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">New Sale Order</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button type="button" onClick={() => handleSave("draft")} className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/10 transition-all">
            <Save size={16} className="mr-2" /> Save Draft
          </button>
          <button type="button" onClick={() => handleSave("posted")} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-lg shadow-emerald-600/10 transition-all">
            <CheckCircle2 size={16} className="mr-2" /> Save & Approve
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 space-y-8 pb-32">
        {/* Section 1: Order Details */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
          <div className="flex items-center space-x-2 mb-8">
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Order Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Order Number</label>
              <input value={formData.orderNumber} disabled className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Order Date *</label>
              <input type="date" value={formData.orderDate} onChange={(e) => setFormData({...formData, orderDate: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</label>
              <input value={formData.status} disabled className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-400 dark:text-slate-500 uppercase" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer PO #</label>
              <input placeholder="Enter customer's PO" value={formData.customerPo} onChange={(e) => setFormData({...formData, customerPo: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer *</label>
              <select value={formData.customerId} onChange={(e) => setFormData({...formData, customerId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="">-- Select Customer --</option>
                {(customers || []).map(c => (
                  <option key={c._id} value={c._id}>{c.companyName || c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sales Person</label>
              <select value={formData.salesPerson} onChange={(e) => setFormData({...formData, salesPerson: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none">
                <option value="">-- Select Rep --</option>
                {(employees || []).map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Warehouse *</label>
              <select value={formData.warehouseId} onChange={(e) => setFormData({...formData, warehouseId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none">
                <option value="">-- Select Location --</option>
                {(locations || []).map(l => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payment Terms</label>
              <input placeholder="e.g. 30 days" value={formData.paymentTerms} onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Shipping Method</label>
              <input placeholder="e.g. Courier" value={formData.shippingMethod} onChange={(e) => setFormData({...formData, shippingMethod: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none" />
            </div>
          </div>
        </section>

        {/* Section 2: Line Items */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-slate-400/20" />
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Ordered Items</h3>
            <button onClick={addItem} className="px-4 py-2 text-[10px] font-black bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl uppercase tracking-widest flex items-center transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 shadow-sm">
              <Plus size={14} className="mr-1.5 text-maroon-800" /> Add Row
            </button>
          </div>
          <div className="grid grid-cols-12 gap-6 p-8">
            <div className="col-span-12 lg:col-span-9 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-40">Item Code</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[200px]">Description</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Ctns</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Gals</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Ltrs</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-28 text-center">Unit Price</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Disc %</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-right">Total</th>
                    <th className="px-8 py-4 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold">
                  {(items || []).map((item, index) => {
                    const query = (item.itemCode || "").toLowerCase();
                    const filteredItems = (availableItems || []).filter(i => 
                      i.code.toLowerCase().includes(query) || i.name.toLowerCase().includes(query)
                    ).sort((a, b) => {
                      const aStart = a.name.toLowerCase().startsWith(query) || a.code.toLowerCase().startsWith(query);
                      const bStart = b.name.toLowerCase().startsWith(query) || b.code.toLowerCase().startsWith(query);
                      if (aStart && !bStart) return -1;
                      if (!aStart && bStart) return 1;
                      return 0;
                    });

                    return (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedLineId(item.id)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/30 transition-colors group ${selectedLineId === item.id ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                    >
                      <td className="px-8 py-4 text-xs font-bold text-slate-300 text-center">{index + 1}</td>
                      <td className="px-4 py-4">
                        <ItemSearchInput
                          value={item.itemCode || ""}
                          availableItems={availableItems}
                          onSelect={(selected) => {
                            updateItem(item.id, "itemId", selected._id);
                            setSelectedLineId(item.id);
                          }}
                          onChange={(val) => updateItem(item.id, "itemCode", val)}
                          placeholder="Search item..."
                        />
                      </td>
                      <td className="px-8 py-4">
                        <input placeholder="Description" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} className="w-full bg-transparent text-sm font-medium focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                      </td>
                      <td className="px-2 py-4 text-center">
                        <input type="number" value={item.cartons} onChange={(e) => updateItem(item.id, "cartons", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                      </td>
                      <td className="px-2 py-4 text-center">
                        <input type="number" value={item.gallons} onChange={(e) => updateItem(item.id, "gallons", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                      </td>
                      <td className="px-2 py-4 text-center">
                        <input type="number" value={item.liters} onChange={(e) => updateItem(item.id, "liters", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                      </td>
                      <td className="px-4 py-4">
                        <input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-center focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                      </td>
                      <td className="px-4 py-4">
                        <input type="number" value={item.discPercent} onChange={(e) => updateItem(item.id, "discPercent", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-center focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                      </td>
                      <td className="px-8 py-4 text-right">
                        <span className="text-sm font-black text-slate-900 dark:text-white">{item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                    );
                    })}
                </tbody>
              </table>
            </div>
            <div className="col-span-12 lg:col-span-3">
              <ItemDetailsPanel item={selectedItemDetails} type="sale" />
            </div>
          </div>
          
          <div className="p-8 bg-white dark:bg-slate-900 flex flex-col items-end space-y-3">
            <div className="w-full md:w-80 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Subtotal</span>
                <span className="font-bold text-slate-900 dark:text-white">{subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Discount</span>
                <span className="font-bold text-rose-600">-{totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs font-black text-maroon-800 uppercase tracking-[0.2em]">Grand Total (PKR)</span>
                <span className="text-3xl font-black text-maroon-800 tracking-tighter">{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Additional Information */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Notes & Special Instructions</label>
          <textarea rows={4} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Internal notes or special delivery instructions..." className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:border-maroon-800 transition-all resize-none outline-none" />
        </section>
      </div>
    </div>
  );
}
