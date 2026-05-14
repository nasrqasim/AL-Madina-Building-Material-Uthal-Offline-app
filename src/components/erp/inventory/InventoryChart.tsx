"use client";

import { useState, useEffect, useMemo } from "react";
import { Folder, Search, Box, Save, X, Plus, Trash2, List, FileText } from "lucide-react";
import clsx from "clsx";

type Category = {
  _id: string;
  name: string;
  type: "main" | "sub";
  parentId: string | null;
  code?: string;
};

type Item = {
  _id: string;
  code: string;
  name: string;
  mainCategoryId?: string;
  subCategoryId?: string;
  litersInCtn: number;
  gallonsInCtn: number;
  purchaseRate: number;
  wholesaleRate: number;
  retailRate: number;
  reorderLevel: number;
  stockQtyCartons: number;
};

export default function InventoryChart() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  
  const [selectedMainCatId, setSelectedMainCatId] = useState<string | null>(null);
  const [selectedSubCatId, setSelectedSubCatId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<"item" | "main" | "sub" | null>(null);
  
  const [formData, setFormData] = useState<Partial<Item>>({});
  const [catFormData, setCatFormData] = useState<Partial<Category>>({});

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/items")
      ]);
      const catData = await catRes.json();
      const itemData = await itemRes.json();
      
      if (catData.ok) setCategories(catData.data);
      if (itemData.ok) setItems(itemData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const mainCategories = useMemo(() => {
    return categories.filter(c => c.type === "main");
  }, [categories]);

  const subCategories = useMemo(() => {
    if (!selectedMainCatId) return [];
    return categories.filter(c => c.type === "sub" && c.parentId === selectedMainCatId);
  }, [categories, selectedMainCatId]);

  const filteredItems = useMemo(() => {
    let result = items;
    
    if (selectedSubCatId) {
      result = result.filter(i => i.subCategoryId === selectedSubCatId);
    } else if (selectedMainCatId) {
      result = result.filter(i => i.mainCategoryId === selectedMainCatId);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.name.toLowerCase().includes(q) || 
        i.code.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [items, selectedMainCatId, selectedSubCatId, searchQuery]);

  const handleMainCatClick = (id: string) => {
    setSelectedMainCatId(id);
    setSelectedSubCatId(null);
    setSelectedItemId(null);
    setEditMode(null);
    setIsEditing(false);
  };

  const handleSubCatClick = (id: string) => {
    setSelectedSubCatId(id);
    setSelectedItemId(null);
    setEditMode(null);
    setIsEditing(false);
  };

  const handleItemClick = (item: Item) => {
    setSelectedItemId(item._id);
    setFormData(item);
    setEditMode("item");
    setIsEditing(false);
  };

  const handleAdd = (type: "main" | "sub" | "item") => {
    setIsEditing(true);
    setEditMode(type);
    if (type === "item") {
      setFormData({
        code: "",
        name: "",
        mainCategoryId: selectedMainCatId || "",
        subCategoryId: selectedSubCatId || "",
        purchaseRate: 0,
        wholesaleRate: 0,
        retailRate: 0,
        litersInCtn: 0,
        gallonsInCtn: 0,
        reorderLevel: 0
      });
    } else {
      setCatFormData({
        name: "",
        type: type,
        parentId: type === "sub" ? selectedMainCatId : null
      });
    }
  };

  const handleSave = async () => {
    try {
      if (editMode === "item") {
        const method = formData._id ? "PUT" : "POST";
        const url = formData._id ? `/api/items/${formData._id}` : "/api/items";
        
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          fetchData();
          setIsEditing(false);
        }
      } else if (editMode === "main" || editMode === "sub") {
        const method = catFormData._id ? "PUT" : "POST";
        const url = catFormData._id ? `/api/categories/${catFormData._id}` : "/api/categories";
        
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(catFormData)
        });
        if (res.ok) {
          fetchData();
          setIsEditing(false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    
    try {
      if (editMode === "item" && formData._id) {
        await fetch(`/api/items/${formData._id}`, { method: "DELETE" });
        setSelectedItemId(null);
      } else if ((editMode === "main" || editMode === "sub") && catFormData._id) {
        await fetch(`/api/categories/${catFormData._id}`, { method: "DELETE" });
        if (editMode === "main") setSelectedMainCatId(null);
        if (editMode === "sub") setSelectedSubCatId(null);
      }
      fetchData();
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-full flex-col space-y-4 rounded-xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search Items..."
              className="w-64 rounded-md border py-1.5 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center space-x-1 rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <Search className="h-4 w-4" />
            <span>Find</span>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => fetchData()} className="flex items-center space-x-1 rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <List className="h-4 w-4" />
            <span>Chart</span>
          </button>
          <button className="flex items-center space-x-1 rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <FileText className="h-4 w-4" />
            <span>Price List</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Main Categories Column */}
        <div className="flex w-1/5 flex-col rounded-md border dark:border-slate-800">
          <div className="flex items-center justify-between border-b bg-slate-50 px-3 py-2 text-sm font-semibold dark:border-slate-800 dark:bg-slate-800/50">
            <span>Main Categories</span>
            <button onClick={() => handleAdd("main")} className="text-slate-500 hover:text-indigo-600">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {mainCategories.map(cat => (
              <div
                key={cat._id}
                onClick={() => handleMainCatClick(cat._id)}
                className={clsx(
                  "cursor-pointer rounded-md px-3 py-2 text-sm transition-colors flex items-center space-x-2",
                  selectedMainCatId === cat._id 
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 font-medium" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <Folder className="h-4 w-4 text-indigo-400" />
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sub Categories Column */}
        <div className="flex w-1/5 flex-col rounded-md border dark:border-slate-800">
          <div className="flex items-center justify-between border-b bg-slate-50 px-3 py-2 text-sm font-semibold dark:border-slate-800 dark:bg-slate-800/50">
            <span>Sub Categories</span>
            {selectedMainCatId && (
              <button onClick={() => handleAdd("sub")} className="text-slate-500 hover:text-indigo-600">
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {subCategories.map(cat => (
              <div
                key={cat._id}
                onClick={() => handleSubCatClick(cat._id)}
                className={clsx(
                  "cursor-pointer rounded-md px-3 py-2 text-sm transition-colors flex items-center space-x-2",
                  selectedSubCatId === cat._id 
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 font-medium" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <Folder className="h-4 w-4 text-emerald-400" />
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Items List Column */}
        <div className="flex w-1/3 flex-col rounded-md border dark:border-slate-800">
          <div className="flex items-center justify-between border-b bg-slate-50 px-3 py-2 text-sm font-semibold dark:border-slate-800 dark:bg-slate-800/50">
            <span>Inventory Items</span>
            <button onClick={() => handleAdd("item")} className="text-slate-500 hover:text-indigo-600">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filteredItems.map(item => (
              <div
                key={item._id}
                onClick={() => handleItemClick(item)}
                className={clsx(
                  "cursor-pointer rounded-md px-3 py-2 text-sm transition-colors flex items-center justify-between",
                  selectedItemId === item._id 
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 font-medium" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <div className="flex items-center space-x-2">
                  <Box className="h-4 w-4 text-slate-400" />
                  <span>{item.name}</span>
                </div>
                <span className="text-xs text-slate-500">{item.code}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Details Panel */}
        <div className="flex flex-1 flex-col rounded-md border bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20">
          <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-800">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              {editMode === "item" ? "Item Details" : editMode === "main" ? "Main Category Details" : editMode === "sub" ? "Sub Category Details" : "Details"}
            </h3>
            <div className="flex space-x-2">
              {(isEditing || formData._id || catFormData._id) && (
                <>
                  {isEditing ? (
                    <button onClick={handleSave} className="flex items-center space-x-1 rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700">
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                  ) : (
                    <button onClick={() => setIsEditing(true)} className="flex items-center space-x-1 rounded border px-3 py-1 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                      <span>Edit</span>
                    </button>
                  )}
                  {isEditing && (
                    <button onClick={() => setIsEditing(false)} className="flex items-center space-x-1 rounded border px-3 py-1 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  )}
                  {(!isEditing && (formData._id || catFormData._id)) && (
                    <button onClick={handleDelete} className="flex items-center space-x-1 rounded bg-red-50 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40">
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {editMode === "item" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Item Code</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    className="w-full rounded border px-3 py-1.5 text-sm disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:disabled:bg-slate-900"
                    value={formData.code || ""}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Item Name</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    className="w-full rounded border px-3 py-1.5 text-sm disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:disabled:bg-slate-900"
                    value={formData.name || ""}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Purchase Price / Ctn</label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    className="w-full rounded border px-3 py-1.5 text-sm disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:disabled:bg-slate-900"
                    value={formData.purchaseRate || 0}
                    onChange={e => setFormData({...formData, purchaseRate: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Wholesale Price / Ctn</label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    className="w-full rounded border px-3 py-1.5 text-sm disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:disabled:bg-slate-900"
                    value={formData.wholesaleRate || 0}
                    onChange={e => setFormData({...formData, wholesaleRate: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Retail Price / Ctn</label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    className="w-full rounded border px-3 py-1.5 text-sm disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:disabled:bg-slate-900"
                    value={formData.retailRate || 0}
                    onChange={e => setFormData({...formData, retailRate: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Re-order Quantity</label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    className="w-full rounded border px-3 py-1.5 text-sm disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:disabled:bg-slate-900"
                    value={formData.reorderLevel || 0}
                    onChange={e => setFormData({...formData, reorderLevel: Number(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Liters in Ctn</label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    className="w-full rounded border px-3 py-1.5 text-sm disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:disabled:bg-slate-900"
                    value={formData.litersInCtn || 0}
                    onChange={e => setFormData({...formData, litersInCtn: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Gallons in Ctn</label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    className="w-full rounded border px-3 py-1.5 text-sm disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:disabled:bg-slate-900"
                    value={formData.gallonsInCtn || 0}
                    onChange={e => setFormData({...formData, gallonsInCtn: Number(e.target.value)})}
                  />
                </div>
              </div>
            )}
            
            {(editMode === "main" || editMode === "sub") && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Category Name</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    className="w-full max-w-sm rounded border px-3 py-1.5 text-sm disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:disabled:bg-slate-900"
                    value={catFormData.name || ""}
                    onChange={e => setCatFormData({...catFormData, name: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            {!editMode && (
              <div className="flex h-full items-center justify-center text-slate-400">
                <p>Select an item or category to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
