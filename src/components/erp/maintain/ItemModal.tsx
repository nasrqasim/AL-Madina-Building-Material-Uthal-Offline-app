"use client";

import { useState, useEffect } from "react";
import ERPModal from "../ui/ERPModal";
import { Save } from "lucide-react";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: any;
  onSave: (data: any) => void;
}

export default function ItemModal({ isOpen, onClose, item, onSave }: ItemModalProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    mainCategoryId: "",
    subCategoryId: "",
    brandId: "",
    model: "",
    color: "",
    design: "",
    size: "",
    thickness: "",
    length: "",
    width: "",
    weight: "",
    grade: "",
    pattern: "",
    finish: "",
    quality: "",
    unit: "Per Piece",
    baseUnit: "Per Piece",
    purchaseUnit: "Per Piece",
    saleUnit: "Per Piece",
    conversionFactor: 1,
    hsCode: "",
    barcode: "",
    qrCode: "",
    purchaseRate: 0,
    wholesaleRate: 0,
    retailRate: 0,
    dealerRate: 0,
    contractRate: 0,
    discount: 0,
    taxPercent: 0,
    stockQtyCartons: 0, // openingStock
    reorderLevel: 5,
    maxStock: 1000,
    location: "",
    rack: "",
    godown: "",
    warehouse: "",
    remarks: "",
    status: "Active",
  });

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.ok) setCategories(json.data || []);
    } catch (e) {
      console.error("Error fetching categories:", e);
    }
  };

  useEffect(() => {
    if (item) {
      setFormData({
        code: item.code || "",
        name: item.name || "",
        mainCategoryId: item.mainCategoryId || "",
        subCategoryId: item.subCategoryId || "",
        brandId: item.brandId || "",
        model: item.model || "",
        color: item.color || "",
        design: item.design || "",
        size: item.size || "",
        thickness: item.thickness || "",
        length: item.length || "",
        width: item.width || "",
        weight: item.weight || "",
        grade: item.grade || "",
        pattern: item.pattern || "",
        finish: item.finish || "",
        quality: item.quality || "",
        unit: item.unit || "Per Piece",
        baseUnit: item.baseUnit || "Per Piece",
        purchaseUnit: item.purchaseUnit || "Per Piece",
        saleUnit: item.saleUnit || "Per Piece",
        conversionFactor: item.conversionFactor || 1,
        hsCode: item.hsCode || "",
        barcode: item.barcode || "",
        qrCode: item.qrCode || "",
        purchaseRate: item.purchaseRate || 0,
        wholesaleRate: item.wholesaleRate || 0,
        retailRate: item.retailRate || 0,
        dealerRate: item.dealerRate || 0,
        contractRate: item.contractRate || 0,
        discount: item.discount || 0,
        taxPercent: item.taxPercent || 0,
        stockQtyCartons: item.stockQtyCartons || 0,
        reorderLevel: item.reorderLevel || 5,
        maxStock: item.maxStock || 1000,
        location: item.location || "",
        rack: item.rack || "",
        godown: item.godown || "",
        warehouse: item.warehouse || "",
        remarks: item.remarks || "",
        status: item.status || "Active",
      });
    } else {
      setFormData({
        code: `ITEM-${Date.now().toString().slice(-6)}`,
        name: "",
        mainCategoryId: "",
        subCategoryId: "",
        brandId: "",
        model: "",
        color: "",
        design: "",
        size: "",
        thickness: "",
        length: "",
        width: "",
        weight: "",
        grade: "",
        pattern: "",
        finish: "",
        quality: "",
        unit: "Per Piece",
        baseUnit: "Per Piece",
        purchaseUnit: "Per Piece",
        saleUnit: "Per Piece",
        conversionFactor: 1,
        hsCode: "",
        barcode: "",
        qrCode: "",
        purchaseRate: 0,
        wholesaleRate: 0,
        retailRate: 0,
        dealerRate: 0,
        contractRate: 0,
        discount: 0,
        taxPercent: 0,
        stockQtyCartons: 0,
        reorderLevel: 5,
        maxStock: 1000,
        location: "",
        rack: "",
        godown: "",
        warehouse: "",
        remarks: "",
        status: "Active",
      });
    }
    fetchCategories();
  }, [item, isOpen]);

  const mainCats = (categories || []).filter((c) => c.type === "main");
  const subCats = (categories || []).filter(
    (c) => c.type === "sub" && String(c.parentId) === String(formData.mainCategoryId)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) onSave(formData);
    onClose();
  };

  const handleFieldChange = (field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <ERPModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? "Edit Product Master" : "Add Product Master"}
      size="xl"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-8 py-2.5 bg-maroon-800 text-white rounded-xl text-sm font-black hover:bg-maroon-900 transition-all shadow-xl shadow-maroon-900/20"
          >
            <Save size={18} />
            {item ? "Update Product" : "Save Product"}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-2 max-h-[70vh] overflow-y-auto pr-3">
        {/* Basic Attributes */}
        <h4 className="text-[10px] font-black text-maroon-800 uppercase tracking-widest border-b pb-1">Basic Info</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Item Code *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleFieldChange("code", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none focus:border-maroon-800"
              required
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Item Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none focus:border-maroon-800"
              placeholder="e.g. Cement, Steel Pipe, Ceramic Tile"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Selling Unit</label>
            <select
              value={formData.unit}
              onChange={(e) => handleFieldChange("unit", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none focus:border-maroon-800"
            >
              <option value="Per Bag">Per Bag</option>
              <option value="Per Piece">Per Piece</option>
              <option value="Per KG">Per KG</option>
              <option value="Per Ton">Per Ton</option>
              <option value="Per Feet">Per Feet</option>
              <option value="Per Meter">Per Meter</option>
              <option value="Per Box">Per Box</option>
              <option value="Per Carton">Per Carton</option>
              <option value="Per Sheet">Per Sheet</option>
              <option value="Per Bundle">Per Bundle</option>
              <option value="Per Square Feet">Per Square Feet</option>
              <option value="Per Square Meter">Per Square Meter</option>
            </select>
          </div>
        </div>

        {/* Unit Configuration */}
        <h4 className="text-[10px] font-black text-maroon-800 uppercase tracking-widest border-b pb-1 pt-2">Unit Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Base Unit</label>
            <select
              value={formData.baseUnit}
              onChange={(e) => handleFieldChange("baseUnit", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none focus:border-maroon-800"
            >
              <option value="Per Bag">Per Bag</option>
              <option value="Per Piece">Per Piece</option>
              <option value="Per KG">Per KG</option>
              <option value="Per Ton">Per Ton</option>
              <option value="Per Feet">Per Feet</option>
              <option value="Per Meter">Per Meter</option>
              <option value="Per Box">Per Box</option>
              <option value="Per Carton">Per Carton</option>
              <option value="Per Sheet">Per Sheet</option>
              <option value="Per Bundle">Per Bundle</option>
              <option value="Per Square Feet">Per Square Feet</option>
              <option value="Per Square Meter">Per Square Meter</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Purchase Unit</label>
            <select
              value={formData.purchaseUnit}
              onChange={(e) => handleFieldChange("purchaseUnit", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none focus:border-maroon-800"
            >
              <option value="Per Bag">Per Bag</option>
              <option value="Per Piece">Per Piece</option>
              <option value="Per KG">Per KG</option>
              <option value="Per Ton">Per Ton</option>
              <option value="Per Feet">Per Feet</option>
              <option value="Per Meter">Per Meter</option>
              <option value="Per Box">Per Box</option>
              <option value="Per Carton">Per Carton</option>
              <option value="Per Sheet">Per Sheet</option>
              <option value="Per Bundle">Per Bundle</option>
              <option value="Per Square Feet">Per Square Feet</option>
              <option value="Per Square Meter">Per Square Meter</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Sale Unit</label>
            <select
              value={formData.saleUnit}
              onChange={(e) => handleFieldChange("saleUnit", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none focus:border-maroon-800"
            >
              <option value="Per Bag">Per Bag</option>
              <option value="Per Piece">Per Piece</option>
              <option value="Per KG">Per KG</option>
              <option value="Per Ton">Per Ton</option>
              <option value="Per Feet">Per Feet</option>
              <option value="Per Meter">Per Meter</option>
              <option value="Per Box">Per Box</option>
              <option value="Per Carton">Per Carton</option>
              <option value="Per Sheet">Per Sheet</option>
              <option value="Per Bundle">Per Bundle</option>
              <option value="Per Square Feet">Per Square Feet</option>
              <option value="Per Square Meter">Per Square Meter</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Conversion Factor</label>
            <input
              type="number"
              value={formData.conversionFactor}
              onChange={(e) => handleFieldChange("conversionFactor", parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none focus:border-maroon-800"
              min="0.01"
              step="0.01"
            />
          </div>
        </div>

        {/* Categories & Subcategories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Category *</label>
            <select
              value={formData.mainCategoryId}
              onChange={(e) => {
                handleFieldChange("mainCategoryId", e.target.value);
                handleFieldChange("subCategoryId", "");
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none focus:border-maroon-800"
              required
            >
              <option value="">Select Category</option>
              {(mainCats || []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Sub Category</label>
            <select
              value={formData.subCategoryId}
              onChange={(e) => handleFieldChange("subCategoryId", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none focus:border-maroon-800"
            >
              <option value="">Select Sub Category</option>
              {subCats.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dimensions & Specifications */}
        <h4 className="text-[10px] font-black text-maroon-800 uppercase tracking-widest border-b pb-1 pt-2">Specifications</h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Brand</label>
            <input
              type="text"
              value={formData.brandId}
              onChange={(e) => handleFieldChange("brandId", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Model</label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => handleFieldChange("model", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Color</label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => handleFieldChange("color", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Size / Dimensions</label>
            <input
              type="text"
              value={formData.size}
              onChange={(e) => handleFieldChange("size", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none"
              placeholder="e.g. 12x24"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Thickness</label>
            <input
              type="text"
              value={formData.thickness}
              onChange={(e) => handleFieldChange("thickness", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none"
              placeholder="e.g. 4mm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Grade</label>
            <input
              type="text"
              value={formData.grade}
              onChange={(e) => handleFieldChange("grade", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none"
              placeholder="e.g. Grade-60"
            />
          </div>
        </div>

        {/* Dynamic details row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Length</label>
            <input
              type="text"
              value={formData.length}
              onChange={(e) => handleFieldChange("length", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Width</label>
            <input
              type="text"
              value={formData.width}
              onChange={(e) => handleFieldChange("width", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Weight (kg)</label>
            <input
              type="text"
              value={formData.weight}
              onChange={(e) => handleFieldChange("weight", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Barcode</label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => handleFieldChange("barcode", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Quality</label>
            <input
              type="text"
              value={formData.quality}
              onChange={(e) => handleFieldChange("quality", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
              placeholder="Premium, Commercial"
            />
          </div>
        </div>

        {/* Rates & Prices */}
        <h4 className="text-[10px] font-black text-maroon-800 uppercase tracking-widest border-b pb-1 pt-2">Pricing & Taxes</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Purchase Price</label>
            <input
              type="number"
              value={formData.purchaseRate}
              onChange={(e) => handleFieldChange("purchaseRate", parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Retail Sale Price</label>
            <input
              type="number"
              value={formData.retailRate}
              onChange={(e) => handleFieldChange("retailRate", parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-blue-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Wholesale Price</label>
            <input
              type="number"
              value={formData.wholesaleRate}
              onChange={(e) => handleFieldChange("wholesaleRate", parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-emerald-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Dealer Price</label>
            <input
              type="number"
              value={formData.dealerRate}
              onChange={(e) => handleFieldChange("dealerRate", parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Contract Price</label>
            <input
              type="number"
              value={formData.contractRate}
              onChange={(e) => handleFieldChange("contractRate", parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Sales Tax (%)</label>
            <input
              type="number"
              value={formData.taxPercent}
              onChange={(e) => handleFieldChange("taxPercent", parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Default Discount (%)</label>
            <input
              type="number"
              value={formData.discount}
              onChange={(e) => handleFieldChange("discount", parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleFieldChange("status", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Stock & Storage */}
        <h4 className="text-[10px] font-black text-maroon-800 uppercase tracking-widest border-b pb-1 pt-2">Inventory & Locations</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Opening Stock</label>
            <input
              type="number"
              value={formData.stockQtyCartons}
              onChange={(e) => handleFieldChange("stockQtyCartons", parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black"
              disabled={!!item} // prevent modifications to opening stock on edits
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Min Stock (Reorder)</label>
            <input
              type="number"
              value={formData.reorderLevel}
              onChange={(e) => handleFieldChange("reorderLevel", parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-rose-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Max Stock Limit</label>
            <input
              type="number"
              value={formData.maxStock}
              onChange={(e) => handleFieldChange("maxStock", parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Warehouse / Godown</label>
            <input
              type="text"
              value={formData.warehouse}
              onChange={(e) => handleFieldChange("warehouse", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
              placeholder="e.g. Godown A"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Location / Aisle</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleFieldChange("location", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Rack Number</label>
            <input
              type="text"
              value={formData.rack}
              onChange={(e) => handleFieldChange("rack", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Remarks / Notes</label>
            <input
              type="text"
              value={formData.remarks}
              onChange={(e) => handleFieldChange("remarks", e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
            />
          </div>
        </div>
      </form>
    </ERPModal>
  );
}
