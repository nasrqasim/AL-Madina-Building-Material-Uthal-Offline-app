"use client";

import { useState, useEffect } from "react";
import { getProductUnit } from "@/lib/dynamicUnits";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  X,
  Search,
  User,
  ShoppingCart,
  CreditCard,
  Banknote,
  Printer,
  ChevronRight,
  Calculator,
  LayoutGrid,
  Package
} from "lucide-react";

interface POSItem {
  id: string;
  name: string;
  price: number;
  quantity: number; // Dynamic quantity
  unit: string; // Product's unit
  total: number;
  // Legacy fields for backward compatibility
  cartons?: number;
  gallons?: number;
  liters?: number;
}

interface POSCounterSaleFormProps {
  onClose: () => void;
}

export default function POSCounterSaleForm({ onClose }: POSCounterSaleFormProps) {
  const [cart, setCart] = useState<POSItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [itemsRes, partiesRes] = await Promise.all([
        fetch("/api/items"),
        fetch("/api/parties")
      ]);
      const [itemsJson, partiesJson] = await Promise.all([
        itemsRes.json(),
        partiesRes.json()
      ]);
      
      if (itemsJson.ok) setAvailableItems(itemsJson.data || []);
      if (partiesJson.ok) {
        const custs = partiesJson.data.filter((p: any) => p.type === "Customer");
        setCustomers(custs);
        if (custs.length > 0) setSelectedCustomerId(custs[0]._id);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleComplete = async (method: "Cash" | "Card") => {
    if (cart.length === 0) return alert("Cart is empty");
    if (!selectedCustomerId) return alert("Please select a customer");

    setIsProcessing(true);
    const payload = {
      invoiceNo: `POS-${Date.now().toString().slice(-6)}`,
      partyId: selectedCustomerId,
      paymentMethod: method,
      lines: (cart || []).map(item => {
        const originalItem = (availableItems || []).find(ai => ai._id === item.id);
        return {
          itemId: item.id,
          description: item.name,
          qty: item.quantity || item.cartons,
          unit: item.unit || "Per Piece",
          rate: item.price,
          discountPercent: 0,
          // Legacy fields for backward compatibility
          cartons: item.cartons,
          gallons: item.gallons,
          liters: item.liters
        };
      })
    };

    try {
      const res = await fetch("/api/sales/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(`POS Sale (${method}) completed successfully!`);
        setCart([]);
        onClose();
      } else {
        const json = await res.json();
        alert("Error: " + (json.message || json.error || "Unknown server error"));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to complete sale");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = (availableItems || []).filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: any) => {
    const existing = (cart || []).find(item => item.id === product._id);
    const stockAvailable = product.stockQtyCartons || 0;
    const unit = getProductUnit(product);

    if (existing) {
      const newQuantity = (existing.quantity || 0) + 1;
      if (newQuantity > stockAvailable) {
        return alert(`Insufficient Stock! Only ${stockAvailable} in stock.`);
      }
      setCart((cart || []).map(item =>
        item.id === product._id
          ? { ...item, quantity: newQuantity, unit: unit, total: newQuantity * item.price, cartons: newQuantity }
          : item
      ));
    } else {
      if (stockAvailable < 1) {
        return alert("Item out of stock!");
      }
      const price = product.retailRate || product.wholesaleRate || 0;
      setCart([...cart, { id: product._id, name: product.name, price: price, quantity: 1, unit: unit, total: price, cartons: 1, gallons: 0, liters: 0 }]);
    }
  };

  const updateItem = (id: string, field: "quantity", value: number) => {
    const product = (availableItems || []).find(p => p._id === id);
    const stockAvailable = product?.stockQtyCartons || 0;

    setCart((cart || []).map(item => {
      if (item.id === id) {
        let updated = { ...item, [field]: value };

        // Update legacy cartons field for backward compatibility
        updated.cartons = value;

        if (updated.cartons > stockAvailable) {
          alert(`Insufficient Stock! Only ${stockAvailable} in stock.`);
          return item;
        }
        if (updated.cartons < 0) return item;
        
        updated.total = updated.cartons * item.price;
        return updated;
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart((cart || []).filter(item => item.id !== id));
  };

  const subtotal = (cart || []).reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.05; // 5% GST
  const grandTotal = subtotal + tax;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-100 dark:bg-slate-800 overflow-hidden font-sans">
      {/* Left side: Product Selection (70%) */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 text-slate-400 dark:text-slate-500 hover:text-maroon-800 hover:bg-maroon-50 rounded-xl transition-all">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Counter Sale</h1>
          </div>
          <div className="flex-1 max-w-xl px-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Scan barcode or type item name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:border-maroon-800 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
             <select 
               value={selectedCustomerId} 
               onChange={(e) => setSelectedCustomerId(e.target.value)}
               className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 outline-none"
             >
               {(customers || []).map(c => <option key={c._id} value={c._id}>{c.companyName || c.name}</option>)}
             </select>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <button 
              key={product._id}
              onClick={() => addToCart(product)}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-maroon-800 hover:shadow-xl hover:shadow-maroon-800/5 transition-all text-left flex flex-col group active:scale-95"
            >
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-maroon-50 group-hover:text-maroon-800 transition-colors">
                <Package size={24} />
              </div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{product.code}</h3>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2 leading-tight">{product.name}</h3>
              {product.stockQtyCartons < 1 && (
                <span className="mb-2 px-2 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-widest rounded-md w-fit border border-rose-100">Out of Stock</span>
              )}
              <div className="mt-auto flex items-center justify-between">
                <p className="text-lg font-black text-maroon-800">Rs. {(product.retailRate || 0).toLocaleString()}</p>
                <span className={`text-[10px] font-bold ${product.stockQtyCartons < 5 ? 'text-rose-500' : 'text-slate-400'}`}>
                  Stock: {product.stockQtyCartons}
                </span>
              </div>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
               <Package size={48} className="mb-4 opacity-20" />
               <p className="text-xs font-black uppercase tracking-widest">No products found</p>
            </div>
          )}
        </main>
      </div>

      {/* Right side: Checkout (Responsive) */}
      <div className="w-full md:w-[400px] h-[50vh] md:h-full bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50/50">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white">
            <ShoppingCart size={20} className="text-maroon-800" />
            <h2 className="text-sm font-black uppercase tracking-widest">Customer Cart</h2>
          </div>
          <span className="bg-maroon-800 text-white text-[10px] font-black px-2 py-1 rounded-lg">{(cart || []).length} Items</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
              <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                <ShoppingCart size={32} />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Cart is empty</p>
            </div>
          ) : (
            (cart || []).map(item => (
              <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3 relative group">
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-rose-600 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight flex-1">{item.name}</h4>
                  <span className="text-xs font-black text-slate-900 dark:text-white">Rs.{item.total.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex flex-col items-center p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[8px] font-black text-slate-400 uppercase">Qty ({item.unit?.replace(/^Per\s+/i, '') || 'Pcs'})</span>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                      className="w-full text-[10px] font-black text-center bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1">
                    <button onClick={() => updateItem(item.id, "quantity", (item.quantity || 0) - 1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 rounded-lg text-slate-400 dark:text-slate-500">-</button>
                    <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                    <button onClick={() => updateItem(item.id, "quantity", (item.quantity || 0) + 1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 rounded-lg text-slate-400 dark:text-slate-500">+</button>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">@ {item.price}/{item.unit?.replace(/^Per\s+/i, '') || 'Pcs'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <span>GST (5%)</span>
              <span>Rs. {tax.toLocaleString()}</span>
            </div>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Payable Amount</span>
              <span className="text-3xl font-black text-maroon-800 tracking-tighter">Rs. {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleComplete("Cash")}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center gap-2 py-4 bg-white dark:bg-slate-900 border-2 border-emerald-100 text-emerald-700 rounded-3xl hover:bg-emerald-50 transition-all font-black text-[10px] uppercase tracking-widest group active:scale-95 disabled:opacity-50"
            >
              <Banknote size={20} className="group-hover:scale-110 transition-transform" />
              Cash
            </button>
            <button 
              onClick={() => handleComplete("Card")}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center gap-2 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-all font-black text-[10px] uppercase tracking-widest group active:scale-95 disabled:opacity-50"
            >
              <CreditCard size={20} className="group-hover:scale-110 transition-transform" />
              Card
            </button>
          </div>

          <button 
            onClick={() => handleComplete("Cash")}
            disabled={isProcessing}
            className="w-full py-5 bg-maroon-800 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-maroon-800/20 hover:bg-maroon-900 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : (
              <>
                <Printer size={18} />
                Complete & Print
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
