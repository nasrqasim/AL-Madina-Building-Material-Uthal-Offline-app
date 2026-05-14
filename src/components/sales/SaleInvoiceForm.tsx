"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  CheckCircle2, 
  Printer, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  History, 
  FileText, 
  Undo, 
  Settings, 
  Package,
  User,
  AlertCircle,
  ArrowRightLeft,
  ArrowLeft
} from "lucide-react";

interface SIItem {
  id: string;
  itemId: string;
  itemCode: string;
  description: string;
  cartons: number;
  gallons: number;
  liters: number;
  ratePerCtn: number;
  grossAmount: number;
  discPercent: number;
  discount: number;
  netAmount: number;
}

interface SaleInvoiceFormProps {
  onClose: () => void;
  initialData?: any;
}

function ToolbarButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-1 min-w-[70px] hover:bg-[#d1d5db] rounded transition-all group">
      <div className="text-slate-600 group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-[9px] font-bold mt-1 text-slate-700 group-hover:text-black">{label}</span>
    </button>
  );
}

export default function SaleInvoiceForm({ onClose, initialData }: SaleInvoiceFormProps) {
  // Form State
  const [formData, setFormData] = useState({
    serialNo: initialData?.invoiceNo || `SI-${Date.now().toString().slice(-6)}`,
    date: initialData?.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    invoiceType: initialData?.invoiceType || "Sale Invoice",
    vehicleNo: initialData?.regNo || "",
    rangeKms: initialData?.rangeKms || 0,
    termsOfPayment: initialData?.paymentTerms || "Cash",
    incomeAccountId: initialData?.incomeAccountId || "40001001",
    isCancelled: initialData?.isCancelled || false,
    isWholesale: initialData?.isWholesale || false,
    isRetail: initialData?.isRetail || true,
    isOnCredit: initialData?.isCreditBill || false,
    startKms: initialData?.startKms || 0,
    endKms: initialData?.endKms || 0,
    oilGaugeLimit: initialData?.oilGaugeLimit || 0,
    status: initialData?.status || "posted",
    
    // Customer
    customerId: initialData?.partyId?._id || initialData?.partyId || "",
    customerCode: initialData?.partyId?.code || "",
    customerName: initialData?.partyId?.name || "",
    customerAddress: initialData?.partyId?.address || "",
    customerTelephone: initialData?.partyId?.phone || "",
    customerBalance: 0.00,
    
    // Bottom Section
    locationId: initialData?.locationId?._id || initialData?.locationId || "",
    jobNo: initialData?.jobId?.code || "",
    employeeRef: initialData?.employeeId?._id || initialData?.employeeId || "",
    remarks: initialData?.notes || "",
    
    // Totals
    additionalDiscount: initialData?.discountAmount || 0,
    carService: 0,
    amountReceived: initialData?.amountReceived || 0
  });

  const [items, setItems] = useState<SIItem[]>(() => {
    if (initialData?.lines && initialData.lines.length > 0) {
      return initialData.lines.map((l: any, i: number) => ({
        id: i.toString(),
        itemId: l.itemId?._id || l.itemId,
        itemCode: l.itemId?.code || "",
        description: l.description || "",
        cartons: l.cartons || l.qty || 0,
        gallons: l.gallons || 0,
        liters: l.liters || 0,
        ratePerCtn: l.rate || 0,
        grossAmount: l.grossAmount || 0,
        discPercent: l.discountPercent || 0,
        discount: (l.grossAmount * (l.discountPercent || 0)) / 100,
        netAmount: l.netAmount || 0
      }));
    }
    return [{
      id: "1",
      itemId: "",
      itemCode: "",
      description: "",
      cartons: 0,
      gallons: 0,
      liters: 0,
      ratePerCtn: 0,
      grossAmount: 0,
      discPercent: 0,
      discount: 0,
      netAmount: 0
    }];
  });

  const [selectedLineId, setSelectedLineId] = useState<string | null>("1");
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showItemSearch, setShowItemSearch] = useState<string | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, partiesRes, locsRes, empsRes] = await Promise.all([
        fetch("/api/items"),
        fetch("/api/parties"),
        fetch("/api/locations"),
        fetch("/api/employees")
      ]);
      const [itemsData, partiesData, locsData, empsData] = await Promise.all([
        itemsRes.json(),
        partiesRes.json(),
        locsRes.json(),
        empsRes.json()
      ]);
      if (itemsData.ok) setAvailableItems(itemsData.data);
      if (partiesData.ok) setCustomers(partiesData.data.filter((p: any) => p.type === "Customer"));
      if (locsData.ok) setLocations(locsData.data);
      if (empsData.ok) setEmployees(empsData.data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePriceTypeChange = (isWholesale: boolean) => {
    setFormData({ ...formData, isWholesale, isRetail: !isWholesale });
    setItems(prev => prev.map(i => {
      const item = availableItems.find(ai => ai._id === i.itemId);
      if (item) {
        const ratePerCtn = isWholesale ? (item.wholesaleRate || item.rate || 0) : (item.retailRate || item.rate || 0);
        const qty = (Number(i.cartons) || 0) + (Number(i.gallons) || 0) + (Number(i.liters) || 0);
        const grossAmount = qty * ratePerCtn;
        const discount = (grossAmount * (i.discPercent || 0)) / 100;
        const netAmount = grossAmount - discount;
        return { ...i, ratePerCtn, grossAmount, discount, netAmount };
      }
      return i;
    }));
  };

  const addItem = () => {
    const newItem = { id: Date.now().toString(), itemId: "", itemCode: "", description: "", cartons: 0, gallons: 0, liters: 0, ratePerCtn: 0, grossAmount: 0, discPercent: 0, discount: 0, netAmount: 0 };
    setItems([...items, newItem]);
    setSelectedLineId(newItem.id);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
      if (selectedLineId === id) setSelectedLineId(items[0].id);
    }
  };

  const updateItem = (id: string, field: keyof SIItem, value: any) => {
    setItems(items.map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: value };
        const item = availableItems.find(ai => ai._id === (field === "itemId" ? value : i.itemId));

        if (field === "cartons") {
          updated.gallons = value * 4;
          updated.liters = value * 16;
        } else if (field === "gallons") {
          updated.cartons = value / 4;
          updated.liters = value * 4;
        } else if (field === "liters") {
          updated.cartons = value / 16;
          updated.gallons = value / 4;
        }

        if (field === "cartons" || field === "gallons" || field === "liters" || field === "ratePerCtn" || field === "discPercent" || field === "itemId") {
          const qty = Number(updated.cartons) || 0;
          updated.grossAmount = qty * (Number(updated.ratePerCtn) || 0);
          updated.discount = (updated.grossAmount * (Number(updated.discPercent) || 0)) / 100;
          updated.netAmount = updated.grossAmount - updated.discount;
        }

        if (field === "itemId" && item) {
          updated.itemCode = item.code;
          updated.description = item.name;
          updated.ratePerCtn = formData.isWholesale ? (item.wholesaleRate || item.rate || 0) : (item.retailRate || item.rate || 0);
          const qty = Number(updated.cartons) || 0;
          updated.grossAmount = qty * (Number(updated.ratePerCtn) || 0);
          updated.discount = (updated.grossAmount * (Number(updated.discPercent) || 0)) / 100;
          updated.netAmount = updated.grossAmount - updated.discount;
        }
        return updated;
      }
      return i;
    }));
  };

  const grossTotal = useMemo(() => items.reduce((acc, curr) => acc + curr.grossAmount, 0), [items]);
  const netTotal = useMemo(() => {
    const total = items.reduce((acc, curr) => acc + curr.netAmount, 0);
    return total + Number(formData.carService) - Number(formData.additionalDiscount);
  }, [items, formData.carService, formData.additionalDiscount]);
  const balanceAmount = netTotal - Number(formData.amountReceived);

  const handleSave = useCallback(async (status: string) => {
    const payload = {
      ...initialData,
      invoiceNo: formData.serialNo,
      type: "sale",
      date: formData.date || new Date().toISOString(),
      partyId: formData.customerId || null,
      regNo: formData.vehicleNo,
      rangeKms: formData.rangeKms,
      paymentTerms: formData.termsOfPayment,
      isCreditBill: formData.isOnCredit,
      startKms: formData.startKms,
      endKms: formData.endKms,
      oilGaugeLimit: formData.oilGaugeLimit,
      locationId: formData.locationId || null,
      employeeId: formData.employeeRef || null,
      notes: formData.remarks,
      lines: items.filter(l => l.itemId).map(l => ({
        itemId: l.itemId,
        description: l.description,
        cartons: l.cartons || 0,
        gallons: l.gallons || 0,
        liters: l.liters || 0,
        rate: l.ratePerCtn || 0,
        grossAmount: l.grossAmount || 0,
        discountPercent: l.discPercent || 0,
        netAmount: l.netAmount || 0
      })),
      subTotal: grossTotal || 0,
      discountAmount: Number(formData.additionalDiscount) || 0,
      totalAmount: netTotal || 0,
      amountReceived: Number(formData.amountReceived) || 0,
      status: status
    };

    try {
      const res = await fetch(initialData?._id ? `/api/invoices/${initialData._id}` : "/api/invoices", {
        method: initialData?._id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Sale Invoice saved successfully!");
        onClose();
      } else {
        const text = await res.text();
        try {
          const error = JSON.parse(text);
          alert("Failed to save invoice: " + (error.message || "Unknown error"));
        } catch {
          alert("Failed to save invoice. Server returned error: " + text.substring(0, 150));
        }
      }
    } catch (e: any) { 
      console.error(e); 
      alert("Error occurred while saving: " + e.message);
    }
  }, [formData, items, grossTotal, netTotal, initialData, onClose]);

  const selectedItemDetails = useMemo(() => {
    const line = items.find(l => l.id === selectedLineId);
    if (!line || !line.itemId) return null;
    return availableItems.find(i => i._id === line.itemId);
  }, [selectedLineId, items, availableItems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave("posted");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const [activeIndex, setActiveIndex] = useState(0);

  const handleItemKeyDown = (e: React.KeyboardEvent, lineId: string, filteredItems: any[]) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : prev));
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

  return (
    <div className="flex flex-col h-screen bg-[#f3f4f6] text-[#333] font-sans overflow-hidden">
      {/* Top Toolbar */}
      <div className="bg-[#e5e7eb] border-b border-[#cbd5e1] p-1 flex items-center gap-1 shadow-sm overflow-x-auto no-scrollbar">
        <ToolbarButton icon={<Plus size={16} />} label="New Customer" />
        <ToolbarButton icon={<Package size={16} />} label="New Item" />
        <div className="w-[1px] h-6 bg-[#cbd5e1] mx-1" />
        <ToolbarButton icon={<PlusCircle size={16} />} label="Add" onClick={addItem} />
        <ToolbarButton icon={<Save size={16} className="text-blue-600" />} label="Save (Ctrl+S)" onClick={() => handleSave("posted")} />
        <ToolbarButton icon={<X size={16} className="text-red-600" />} label="Cancel" onClick={onClose} />
        <ToolbarButton icon={<Trash2 size={16} />} label="Delete" />
        <div className="w-[1px] h-6 bg-[#cbd5e1] mx-1" />
        <ToolbarButton icon={<Undo size={16} />} label="Un-Post" />
        <ToolbarButton icon={<ArrowRightLeft size={16} />} label="Convert D.C" />
        <ToolbarButton icon={<ArrowRightLeft size={16} />} label="Convert O.R.P" />
        <div className="w-[1px] h-6 bg-[#cbd5e1] mx-1" />
        <ToolbarButton icon={<Search size={16} />} label="Find" />
        <ToolbarButton icon={<History size={16} />} label="Retrieve Last Saved" />
        <ToolbarButton icon={<Settings size={16} />} label="Print Settings" />
        <ToolbarButton icon={<Printer size={16} />} label="Print" />
        <ToolbarButton icon={<FileText size={16} />} label="Voucher" />
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Panel */}
          <div className="col-span-12 lg:col-span-7 bg-white p-4 rounded border border-[#cbd5e1] shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2 mb-2">
              <h2 className="text-xl font-bold text-slate-700 uppercase">SALE INVOICES</h2>
              <div className="px-4 py-1 rounded-full border-2 text-xs font-black uppercase tracking-widest border-red-500 text-red-500">
                {formData.status.toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold w-24">Serial No</label>
                  <div className="flex items-center flex-1 border border-[#cbd5e1] rounded overflow-hidden">
                    <button className="px-2 bg-slate-100 hover:bg-slate-200 border-r"><ChevronLeft size={14}/></button>
                    <input type="text" value={formData.serialNo} className="flex-1 text-center font-bold text-blue-600 outline-none" readOnly />
                    <button className="px-2 bg-slate-100 hover:bg-slate-200 border-l"><ChevronRight size={14}/></button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold w-24">Date</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="flex-1 border border-[#cbd5e1] rounded px-2 py-1 text-xs outline-none" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold w-24">Invoice Type</label>
                  <select value={formData.invoiceType} onChange={e => setFormData({...formData, invoiceType: e.target.value})} className="flex-1 border border-[#cbd5e1] rounded px-2 py-1 text-xs outline-none">
                    <option>Sale Invoice</option>
                    <option>Credit Note</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold w-24">Vehicle No</label>
                  <input type="text" value={formData.vehicleNo} onChange={e => setFormData({...formData, vehicleNo: e.target.value})} className="flex-1 border border-[#cbd5e1] rounded px-2 py-1 text-xs outline-none" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold w-24">Range KMs</label>
                  <input type="number" value={formData.rangeKms} onChange={e => setFormData({...formData, rangeKms: Number(e.target.value)})} className="flex-1 border border-[#cbd5e1] rounded px-2 py-1 text-xs outline-none" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold w-24">Payment Terms</label>
                  <input type="text" value={formData.termsOfPayment} onChange={e => setFormData({...formData, termsOfPayment: e.target.value})} className="flex-1 border border-[#cbd5e1] rounded px-2 py-1 text-xs outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-4 border-b pb-2">
                  <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={formData.isCancelled} onChange={e => setFormData({...formData, isCancelled: e.target.checked})} /> Cancel</label>
                  <label className="flex items-center gap-2 text-xs font-bold"><input type="radio" checked={formData.isWholesale} onChange={() => handlePriceTypeChange(true)} /> Whole Sale</label>
                  <label className="flex items-center gap-2 text-xs font-bold"><input type="radio" checked={formData.isRetail} onChange={() => handlePriceTypeChange(false)} /> Retail</label>
                  <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={formData.isOnCredit} onChange={e => setFormData({...formData, isOnCredit: e.target.checked})} /> On Credit Bill</label>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><label className="text-[10px] font-black w-20">Start KMs</label><input type="number" value={formData.startKms} onChange={e => setFormData({...formData, startKms: Number(e.target.value)})} className="flex-1 border border-[#cbd5e1] rounded px-2 py-1 text-xs" /></div>
                    <div className="flex items-center gap-2"><label className="text-[10px] font-black w-20">End KMs</label><input type="number" value={formData.endKms} onChange={e => setFormData({...formData, endKms: Number(e.target.value)})} className="flex-1 border border-[#cbd5e1] rounded px-2 py-1 text-xs" /></div>
                    <div className="flex items-center gap-2"><label className="text-[10px] font-black w-20">Limit</label><input type="number" value={formData.oilGaugeLimit} onChange={e => setFormData({...formData, oilGaugeLimit: Number(e.target.value)})} className="flex-1 border border-[#cbd5e1] rounded px-2 py-1 text-xs" /></div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="text-[10px] font-black text-slate-400 mb-1">Income Account</div>
                    <div className="flex border border-[#cbd5e1] rounded overflow-hidden">
                      <input type="text" value={formData.incomeAccountId} className="w-20 bg-slate-50 px-2 py-1 text-[10px] font-bold border-r" readOnly />
                      <select className="flex-1 bg-white px-2 py-1 text-[10px] font-bold outline-none"><option>Sales</option></select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="col-span-12 lg:col-span-5 bg-[#fefce8] p-4 rounded border border-[#eab308] shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 text-yellow-600 opacity-20"><User size={64}/></div>
             <h3 className="text-xs font-black text-yellow-800 uppercase tracking-widest mb-4 border-b border-yellow-200 pb-2">Customer Panel</h3>
             <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold w-16">Code</label>
                  <div className="flex-1 flex gap-1">
                    <input type="text" value={formData.customerCode} className="w-32 border border-[#eab308] rounded px-2 py-1 text-xs" readOnly />
                    <div className="flex-1 relative">
                       <input type="text" placeholder="Search Customer..." value={formData.customerName} onChange={e => { setFormData({...formData, customerName: e.target.value}); setShowCustomerSearch(true); }} className="w-full border border-[#eab308] rounded px-2 py-1 text-xs outline-none" />
                       {showCustomerSearch && formData.customerName && (
                         <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded shadow-xl z-50 max-h-48 overflow-auto mt-1">
                            {customers.filter(c => c.name.toLowerCase().includes(formData.customerName.toLowerCase())).map(c => (
                              <div key={c._id} className="px-3 py-2 text-xs hover:bg-yellow-50 cursor-pointer font-bold border-b" onClick={() => {
                                setFormData({...formData, customerId: c._id, customerName: c.name, customerCode: c.code, customerAddress: c.address, customerTelephone: c.phone, customerBalance: 0});
                                setShowCustomerSearch(false);
                              }}>{c.code} - {c.name}</div>
                            ))}
                         </div>
                       )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3"><label className="text-xs font-bold w-16">Address</label><textarea value={formData.customerAddress} readOnly className="flex-1 border border-[#eab308] rounded px-2 py-1 text-xs h-16 resize-none bg-yellow-50/50 outline-none" /></div>
                <div className="flex items-center gap-3"><label className="text-xs font-bold w-16">Telephone</label><input type="text" value={formData.customerTelephone} readOnly className="flex-1 border border-[#eab308] rounded px-2 py-1 text-xs bg-yellow-50/50 outline-none" /></div>
                <div className="flex items-center gap-3 bg-yellow-100 p-2 rounded"><label className="text-xs font-black text-yellow-900 w-16 uppercase">Balance</label><div className="flex-1 text-right text-lg font-black text-rose-600 font-mono">{formData.customerBalance.toFixed(2)}</div></div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-9 bg-white border border-[#cbd5e1] rounded shadow-sm flex flex-col min-h-[300px] overflow-hidden">
             <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead className="sticky top-0 bg-[#f8fafc] z-20 border-b border-[#cbd5e1]">
                    <tr>
                      <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase border-r w-32">Item Code</th>
                      <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase border-r min-w-[200px]">Description</th>
                      <th className="px-2 py-2 text-[10px] font-black text-slate-500 uppercase border-r w-20 text-center">Ctns</th>
                      <th className="px-2 py-2 text-[10px] font-black text-slate-500 uppercase border-r w-20 text-center">Gals</th>
                      <th className="px-2 py-2 text-[10px] font-black text-slate-500 uppercase border-r w-20 text-center">Ltrs</th>
                      <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase border-r w-24 text-right">Rate Ctn</th>
                      <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase border-r w-28 text-right">Gross Amt</th>
                      <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase border-r w-16 text-center">Disc%</th>
                      <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase border-r w-24 text-right">Discount</th>
                      <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase w-28 text-right">Net Amount</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((line) => {
                      const query = line.itemCode.toLowerCase();
                      const filteredItems = availableItems.filter(i => 
                        i.code.toLowerCase().includes(query) || i.name.toLowerCase().includes(query)
                      ).sort((a, b) => {
                        const aStart = a.name.toLowerCase().startsWith(query) || a.code.toLowerCase().startsWith(query);
                        const bStart = b.name.toLowerCase().startsWith(query) || b.code.toLowerCase().startsWith(query);
                        if (aStart && !bStart) return -1;
                        if (!aStart && bStart) return 1;
                        return 0;
                      });

                      return (
                      <tr key={line.id} className={`group ${selectedLineId === line.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`} onClick={() => setSelectedLineId(line.id)}>
                        <td className="p-0 border-r relative">
                          <input 
                            type="text" 
                            value={line.itemCode} 
                            placeholder="Search..."
                            onChange={e => { updateItem(line.id, "itemCode", e.target.value); setShowItemSearch(line.id); setActiveIndex(0); }} 
                            onFocus={() => { setShowItemSearch(line.id); setActiveIndex(0); }}
                            onKeyDown={(e) => handleItemKeyDown(e, line.id, filteredItems)}
                            className="w-full px-3 py-2 text-xs font-bold outline-none bg-transparent" 
                          />
                          {showItemSearch === line.id && (
                            <div className="absolute top-full left-0 w-[450px] bg-slate-900 text-white border border-slate-700 rounded-xl shadow-2xl z-50 max-h-80 overflow-auto py-2">
                              {filteredItems.map((i, idx) => (
                                <div 
                                  key={i._id} 
                                  className={`px-4 py-3 cursor-pointer border-b border-slate-800 transition-all ${idx === activeIndex ? 'bg-maroon-800 text-white' : 'hover:bg-slate-800'}`}
                                  onClick={() => { updateItem(line.id, "itemId", i._id); setShowItemSearch(null); }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">{i.code}</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 rounded text-slate-400">{i.category || "Lubricants"}</span>
                                      </div>
                                      <div className="text-sm font-black mb-2">{i.name}</div>
                                      <div className="grid grid-cols-3 gap-2">
                                        <div className="flex flex-col">
                                          <span className="text-[8px] font-black uppercase text-slate-500">Cartons</span>
                                          <span className="text-xs font-black text-emerald-400">{i.stockQtyCartons || 0}</span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-[8px] font-black uppercase text-slate-500">Gallons</span>
                                          <span className="text-xs font-black text-blue-400">{(i.stockQtyCartons || 0) * 4}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                          <span className="text-[8px] font-black uppercase text-slate-500">Price</span>
                                          <span className="text-xs font-black text-yellow-400">Rs. {i.retailRate || 0}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs font-medium border-r">{line.description}</td>
                        <td className="p-0 border-r"><input type="number" value={line.cartons} onChange={e => updateItem(line.id, "cartons", parseFloat(e.target.value) || 0)} className="w-full px-2 py-2 text-xs font-black text-center outline-none bg-transparent" /></td>
                        <td className="p-0 border-r"><input type="number" value={line.gallons} onChange={e => updateItem(line.id, "gallons", parseFloat(e.target.value) || 0)} className="w-full px-2 py-2 text-xs font-black text-center outline-none bg-transparent" /></td>
                        <td className="p-0 border-r"><input type="number" value={line.liters} onChange={e => updateItem(line.id, "liters", parseFloat(e.target.value) || 0)} className="w-full px-2 py-2 text-xs font-black text-center outline-none bg-transparent" /></td>
                        <td className="p-0 border-r"><input type="number" value={line.ratePerCtn} onChange={e => updateItem(line.id, "ratePerCtn", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-xs font-black text-right outline-none bg-transparent" /></td>
                        <td className="px-3 py-2 text-xs font-black text-right border-r font-mono">{line.grossAmount.toFixed(2)}</td>
                        <td className="p-0 border-r"><input type="number" value={line.discPercent} onChange={e => updateItem(line.id, "discPercent", parseFloat(e.target.value) || 0)} className="w-full px-2 py-2 text-xs font-black text-center outline-none bg-transparent" /></td>
                        <td className="px-3 py-2 text-xs font-black text-right border-r font-mono text-rose-600">{line.discount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-xs font-black text-right font-mono text-blue-800">{line.netAmount.toFixed(2)}</td>
                        <td className="p-1"><button onClick={() => removeItem(line.id)} className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button></td>
                      </tr>
                      );
                    })}
                    <tr className="bg-slate-50"><td colSpan={11} className="p-2"><button onClick={addItem} className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase"><PlusCircle size={14}/> Add New Row</button></td></tr>
                  </tbody>
                </table>
             </div>
          </div>

          <div className="col-span-12 lg:col-span-3 bg-[#f8fafc] border border-[#cbd5e1] rounded shadow-sm flex flex-col">
             <div className="bg-[#1e293b] text-white p-2 text-xs font-black uppercase flex items-center gap-2"><Package size={14}/> Item Details</div>
             <div className="p-3 space-y-4 flex-1">
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-slate-400 uppercase">Purchase Price</div>
                  <div className="text-lg font-black text-slate-600 font-mono">Rs. {(selectedItemDetails?.purchaseRate || 0).toFixed(2)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-slate-400 uppercase">Sale Price</div>
                  <div className="text-xl font-black text-blue-700 font-mono">Rs. {(selectedItemDetails?.retailRate || 0).toFixed(2)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Balance Stock</div>
                  <div className="grid grid-cols-3 gap-1">
                    <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                      <div className="text-[8px] font-black text-emerald-600 uppercase">Ctns</div>
                      <div className="text-sm font-black text-emerald-700">{(selectedItemDetails?.stockQtyCartons || 0)}</div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded border border-blue-100">
                      <div className="text-[8px] font-black text-blue-600 uppercase">Gals</div>
                      <div className="text-sm font-black text-blue-700">{(selectedItemDetails?.stockQtyCartons || 0) * 4}</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded border border-purple-100">
                      <div className="text-[8px] font-black text-purple-600 uppercase">Ltrs</div>
                      <div className="text-sm font-black text-purple-700">{(selectedItemDetails?.stockQtyCartons || 0) * 16}</div>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 pb-8">
           <div className="col-span-12 lg:col-span-7 bg-white p-4 rounded border border-[#cbd5e1] shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <div className="flex items-center gap-2"><label className="text-xs font-bold w-24">Location</label><select value={formData.locationId} onChange={e => setFormData({...formData, locationId: e.target.value})} className="flex-1 border border-[#cbd5e1] rounded px-2 py-1 text-xs">{locations.map(l => (<option key={l._id} value={l._id}>{l.name}</option>))}</select></div>
                   <div className="flex items-center gap-2"><label className="text-xs font-bold w-24">Job No</label><input type="text" value={formData.jobNo} className="flex-1 border border-[#cbd5e1] rounded px-2 py-1 text-xs" /></div>
                </div>
                <div className="space-y-2">
                   <div className="flex items-center gap-2"><label className="text-xs font-bold w-24">Employee Ref</label><select value={formData.employeeRef} onChange={e => setFormData({...formData, employeeRef: e.target.value})} className="flex-1 border border-[#cbd5e1] rounded px-2 py-1 text-xs"><option value="">Select Employee</option>{employees.map(emp => (<option key={emp._id} value={emp._id}>{emp.name}</option>))}</select></div>
                   <div className="flex gap-2"><label className="text-xs font-bold w-24 pt-1">Remarks</label><textarea value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="flex-1 border border-[#cbd5e1] rounded px-2 py-1 text-xs h-16 resize-none" /></div>
                </div>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100"><div className="text-[10px] font-black text-slate-400 uppercase mb-1">Amount in Words</div><div className="text-xs font-black text-slate-700 italic">Rupees {netTotal.toLocaleString()} only.</div></div>
           </div>

           <div className="col-span-12 lg:col-span-5 bg-slate-800 text-white p-6 rounded border border-slate-900 shadow-xl space-y-4">
              <div className="space-y-3">
                 <div className="flex justify-between items-center border-b border-slate-700 pb-2"><span className="text-xs font-bold text-slate-400 uppercase">Gross Total</span><span className="text-lg font-black font-mono">{grossTotal.toFixed(2)}</span></div>
                 <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400 uppercase">Additional Discount</span><input type="number" value={formData.additionalDiscount} onChange={e => setFormData({...formData, additionalDiscount: Number(e.target.value)})} className="w-32 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-right font-black font-mono text-rose-400 outline-none" /></div>
                 <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400 uppercase">Car Service</span><input type="number" value={formData.carService} onChange={e => setFormData({...formData, carService: Number(e.target.value)})} className="w-32 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-right font-black font-mono text-blue-300 outline-none" /></div>
                 <div className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg border border-slate-600 mt-4"><span className="text-sm font-black text-white uppercase tracking-wider">Net Total</span><span className="text-3xl font-black font-mono text-yellow-400">{netTotal.toFixed(2)}</span></div>
                 <div className="flex justify-between items-center pt-4"><span className="text-xs font-bold text-slate-400 uppercase">Amount Received</span><input type="number" value={formData.amountReceived} onChange={e => setFormData({...formData, amountReceived: Number(e.target.value)})} className="w-40 bg-white text-slate-900 border-none rounded px-3 py-2 text-right text-lg font-black font-mono outline-none" /></div>
                 <div className="flex justify-between items-center pt-2"><span className="text-xs font-bold text-slate-400 uppercase">Balance</span><span className={`text-xl font-black font-mono ${balanceAmount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{balanceAmount.toFixed(2)}</span></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
