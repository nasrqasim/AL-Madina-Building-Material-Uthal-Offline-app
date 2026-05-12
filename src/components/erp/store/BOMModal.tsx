"use client";

import { useState, useEffect } from "react";
import ERPModal from "../ui/ERPModal";
import { Save, Plus, Trash2, Calendar, Box, Layers, Settings, MapPin } from "lucide-react";

interface BOMModalProps {
  isOpen: boolean;
  onClose: () => void;
  bom?: any;
  onSave?: (data: any) => void;
}

export default function BOMModal({ isOpen, onClose, bom, onSave }: BOMModalProps) {
  const [formData, setFormData] = useState({
    docNo: "Auto-generated",
    bomName: "",
    finishedItem: "",
    outputQty: 1,
    outputUom: "PCS",
    productionType: "In-House",
    version: "1",
    effectiveFrom: new Date().toISOString().split("T")[0],
    effectiveTo: "",
    location: "",
    status: "Draft",
    components: [
      { id: "1", item: "", description: "", qty: 1, uom: "PCS", scrapPercent: 0, unitCost: 0, lineCost: 0 }
    ]
  });

  useEffect(() => {
    if (bom) {
      setFormData(bom);
    } else {
      setFormData({
        docNo: "Auto-generated",
        bomName: "",
        finishedItem: "",
        outputQty: 1,
        outputUom: "PCS",
        productionType: "In-House",
        version: "1",
        effectiveFrom: new Date().toISOString().split("T")[0],
        effectiveTo: "",
        location: "",
        status: "Draft",
        components: [
          { id: "1", item: "", description: "", qty: 1, uom: "PCS", scrapPercent: 0, unitCost: 0, lineCost: 0 }
        ]
      });
    }
  }, [bom, isOpen]);

  const handleAddComponent = () => {
    setFormData({
      ...formData,
      components: [
        ...formData.components,
        { id: Date.now().toString(), item: "", description: "", qty: 1, uom: "PCS", scrapPercent: 0, unitCost: 0, lineCost: 0 }
      ]
    });
  };

  const handleRemoveComponent = (id: string) => {
    setFormData({
      ...formData,
      components: formData.components.filter(c => c.id !== id)
    });
  };

  const handleComponentChange = (id: string, field: string, value: any) => {
    const updatedComponents = formData.components.map(c => {
      if (c.id === id) {
        const updated = { ...c, [field]: value };
        if (field === "qty" || field === "unitCost") {
          updated.lineCost = Number(updated.qty) * Number(updated.unitCost);
        }
        return updated;
      }
      return c;
    });
    setFormData({ ...formData, components: updatedComponents });
  };

  const totalMaterialCost = formData.components.reduce((sum, c) => sum + c.lineCost, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave({ ...formData, totalMaterialCost });
    }
    onClose();
  };

  return (
    <ERPModal
      isOpen={isOpen}
      onClose={onClose}
      title={bom ? "Edit Bill of Materials" : "New Bill of Materials"}
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
              Save Draft
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-2.5 bg-maroon-800 text-white rounded-xl text-sm font-black hover:bg-maroon-900 transition-all shadow-xl shadow-maroon-900/20"
            >
              <Save size={18} />
              Activate
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-2 space-y-8">
        {/* BOM Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-maroon-800 uppercase tracking-[0.2em] flex items-center gap-2">
            <Settings size={14} />
            BOM Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Doc No</label>
              <input
                type="text"
                value={formData.docNo}
                disabled
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-400 dark:text-slate-500 outline-none"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">BOM Name *</label>
              <input
                type="text"
                value={formData.bomName}
                onChange={(e) => setFormData({ ...formData, bomName: e.target.value })}
                placeholder="Bill of Materials name"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Finished Item *</label>
              <div className="relative">
                <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                <select
                  value={formData.finishedItem}
                  onChange={(e) => setFormData({ ...formData, finishedItem: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
                  required
                >
                  <option value="">Select Item</option>
                  <option>Engine Oil 4L Pack</option>
                  <option>Gear Oil 1L Pack</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Output Quantity</label>
                <input
                  type="number"
                  value={formData.outputQty}
                  onChange={(e) => setFormData({ ...formData, outputQty: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Output UOM</label>
                <input
                  type="text"
                  value={formData.outputUom}
                  onChange={(e) => setFormData({ ...formData, outputUom: e.target.value })}
                  placeholder="Unit of measure"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Production Type</label>
              <select
                value={formData.productionType}
                onChange={(e) => setFormData({ ...formData, productionType: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
              >
                <option>In-House</option>
                <option>Outsourced</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Version</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Effective From</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                <input
                  type="date"
                  value={formData.effectiveFrom}
                  onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Effective To</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                <input
                  type="date"
                  value={formData.effectiveTo}
                  onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <option>Production Unit 1</option>
                  <option>Main Warehouse</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Status</label>
              <input
                type="text"
                value={formData.status}
                disabled
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-400 dark:text-slate-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Components Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-maroon-800 uppercase tracking-[0.2em] flex items-center gap-2">
              <Layers size={14} />
              Components
            </h3>
            <button
              type="button"
              onClick={handleAddComponent}
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
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-white">Component Item</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-white text-center">Qty</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-white text-center">UOM</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-white text-center">Scrap%</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-white text-right">Unit Cost</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Line Cost</th>
                  <th className="px-4 py-3 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {formData.components.map((comp, index) => (
                  <tr key={comp.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-white dark:bg-slate-900 transition-colors group">
                    <td className="px-4 py-2 text-xs font-bold text-slate-400 dark:text-slate-500">{index + 1}</td>
                    <td className="px-2 py-2">
                      <select
                        value={comp.item}
                        onChange={(e) => handleComponentChange(comp.id, "item", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-none text-xs font-bold focus:ring-0 outline-none"
                      >
                        <option value="">Select Item</option>
                        <option>Base Oil SN-500</option>
                        <option>Additive Package A1</option>
                        <option>Plastic Bottle 4L</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 w-20">
                      <input
                        type="number"
                        value={comp.qty}
                        onChange={(e) => handleComponentChange(comp.id, "qty", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-none text-xs font-bold text-center focus:ring-0 outline-none"
                      />
                    </td>
                    <td className="px-2 py-2 w-20 text-center">
                      <input
                        type="text"
                        value={comp.uom}
                        onChange={(e) => handleComponentChange(comp.id, "uom", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-none text-xs font-bold text-center focus:ring-0 outline-none"
                      />
                    </td>
                    <td className="px-2 py-2 w-20">
                      <input
                        type="number"
                        value={comp.scrapPercent}
                        onChange={(e) => handleComponentChange(comp.id, "scrapPercent", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-none text-xs font-bold text-center focus:ring-0 outline-none"
                      />
                    </td>
                    <td className="px-2 py-2 w-28 text-right">
                      <input
                        type="number"
                        value={comp.unitCost}
                        onChange={(e) => handleComponentChange(comp.id, "unitCost", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-none text-xs font-bold text-right focus:ring-0 outline-none font-mono"
                      />
                    </td>
                    <td className="px-4 py-2 text-xs font-black text-slate-900 dark:text-white text-right font-mono">
                      {comp.lineCost.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(comp.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800/30 font-black">
                  <td colSpan={6} className="px-4 py-3 text-[10px] text-slate-900 dark:text-white uppercase tracking-widest text-right">Total Material Cost (PKR)</td>
                  <td className="px-4 py-3 text-sm text-maroon-800 text-right font-black font-mono">
                    {totalMaterialCost.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </form>
    </ERPModal>
  );
}
