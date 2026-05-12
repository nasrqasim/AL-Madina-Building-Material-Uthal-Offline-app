"use client";

import { useState, useEffect } from "react";
import ERPModal from "../ui/ERPModal";
import { Save, Plus, Trash2, Calendar, Clock, Truck, User, MapPin, ClipboardCheck } from "lucide-react";

interface InwardGatePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  gatePass?: any;
  onSave?: (data: any) => void;
}

export default function InwardGatePassModal({ isOpen, onClose, gatePass, onSave }: InwardGatePassModalProps) {
  const [formData, setFormData] = useState({
    docNo: "Auto-generated",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    purpose: "Purchase",
    vendor: "",
    vehicleNo: "",
    driverName: "",
    receivedBy: "",
    status: "Pending",
    location: "",
    notes: "",
    items: [
      { id: "1", item: "", description: "", qty: 1, uom: "PCS", remarks: "" }
    ]
  });

  useEffect(() => {
    if (gatePass) {
      setFormData(gatePass);
    } else {
      setFormData({
        docNo: "Auto-generated",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        purpose: "Purchase",
        vendor: "",
        vehicleNo: "",
        driverName: "",
        receivedBy: "",
        status: "Pending",
        location: "",
        notes: "",
        items: [
          { id: "1", item: "", description: "", qty: 1, uom: "PCS", remarks: "" }
        ]
      });
    }
  }, [gatePass, isOpen]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { id: Date.now().toString(), item: "", description: "", qty: 1, uom: "PCS", remarks: "" }
      ]
    });
  };

  const handleRemoveItem = (id: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== id)
    });
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    const updatedItems = formData.items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setFormData({ ...formData, items: updatedItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
    onClose();
  };

  return (
    <ERPModal
      isOpen={isOpen}
      onClose={onClose}
      title={gatePass ? "Edit Inward Gate Pass" : "New Inward Gate Pass"}
      size="2xl"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 rounded-xl transition-all">
            Cancel
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-maroon-50 text-maroon-800 rounded-xl text-sm font-black hover:bg-maroon-100 transition-all"
            >
              Save
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-2.5 bg-maroon-800 text-white rounded-xl text-sm font-black hover:bg-maroon-900 transition-all shadow-xl shadow-maroon-900/20"
            >
              <Save size={18} />
              Verify
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-2 space-y-8">
        {/* Gate Pass Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-maroon-800 uppercase tracking-[0.2em] flex items-center gap-2">
            <ClipboardCheck size={14} />
            Gate Pass Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Doc No</label>
              <input
                type="text"
                value={formData.docNo}
                disabled
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-400 dark:text-slate-500 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Time *</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Purpose *</label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
                required
              >
                <option>Purchase</option>
                <option>Return</option>
                <option>Transfer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Vendor</label>
              <select
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
              >
                <option value="">Select Vendor</option>
                <option>Shell Pakistan Ltd</option>
                <option>Total Parco</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Vehicle No</label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                  <input
                    type="text"
                    value={formData.vehicleNo}
                    onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                    placeholder="LEC-1234"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Driver Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                  <input
                    type="text"
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    placeholder="Enter name"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Received By *</label>
              <input
                type="text"
                value={formData.receivedBy}
                onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                placeholder="Receiver name"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
                >
                  <option value="">-- Select Location --</option>
                  <option>Main Warehouse</option>
                  <option>Karachi Yard</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-maroon-800 uppercase tracking-[0.2em] flex items-center gap-2">
              <Plus size={14} />
              Items
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-4 py-1.5 bg-maroon-50 text-maroon-800 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-maroon-100 transition-all border border-maroon-200"
            >
              + Add Row
            </button>
          </div>

          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/50/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-white">#</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-white">Item</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-white text-center">Qty</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-white text-center">UOM</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Remarks</th>
                  <th className="px-4 py-3 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-white dark:bg-slate-900 transition-colors group">
                    <td className="px-4 py-2 text-xs font-bold text-slate-400 dark:text-slate-500">{index + 1}</td>
                    <td className="px-2 py-2">
                      <select
                        value={item.item}
                        onChange={(e) => handleItemChange(item.id, "item", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-none text-xs font-bold focus:ring-0 outline-none"
                      >
                        <option value="">Select Item</option>
                        <option>Mobil Special 20W-50</option>
                        <option>Shell Helix HX5</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 w-20">
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => handleItemChange(item.id, "qty", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-none text-xs font-bold text-center focus:ring-0 outline-none"
                      />
                    </td>
                    <td className="px-2 py-2 w-20 text-center">
                      <input
                        type="text"
                        value={item.uom}
                        onChange={(e) => handleItemChange(item.id, "uom", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-none text-xs font-bold text-center focus:ring-0 outline-none"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={item.remarks}
                        onChange={(e) => handleItemChange(item.id, "remarks", e.target.value)}
                        placeholder="Condition/Remarks"
                        className="w-full px-2 py-1.5 bg-transparent border-none text-xs font-bold focus:ring-0 outline-none"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes..."
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all min-h-[80px] resize-none"
          />
        </div>
      </form>
    </ERPModal>
  );
}
