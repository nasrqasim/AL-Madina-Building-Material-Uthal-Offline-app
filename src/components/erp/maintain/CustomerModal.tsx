"use client";

import { useState, useEffect } from "react";
import ERPModal from "../ui/ERPModal";
import { Save, User, Building, Phone, MapPin, CreditCard, Info, Globe2, FileText, Hash, Wallet, MessageCircle } from "lucide-react";
import WhatsAppShareModal from "../whatsapp/WhatsAppShareModal";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: any;
  onSave?: (data: any) => void;
}

export default function CustomerModal({ isOpen, onClose, customer, onSave }: CustomerModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    contactPerson: "",
    phone: "",
    ntn: "",
    strn: "",
    address: "",
    region: "",
    area: "",
    postalCode: "",
    country: "Pakistan",
    category: "Cash Customer",
    creditLimit: 0,
    creditDays: 30,
    receivable: 0,
    advance: 0,
    status: "Settled",
    notes: "",
  });

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [shopProfile, setShopProfile] = useState<any>(null);

  useEffect(() => {
    const fetchShopProfile = async () => {
      try {
        const res = await fetch("/api/shop-profile");
        const json = await res.json();
        if (json.ok) setShopProfile(json.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    if (isOpen) {
      fetchShopProfile();
    }
  }, [isOpen]);

  useEffect(() => {
    if (customer) {
      // Calculate receivable and advance from existing data
      let receivable = 0;
      let advance = 0;
      let status = "Settled";

      if (customer.openingBalance) {
        if (customer.openingBalance > 0) {
          receivable = customer.openingBalance;
        } else {
          advance = Math.abs(customer.openingBalance);
        }
      }

      // Add manual debit/credit if they exist
      if (customer.manualDebit) receivable += customer.manualDebit;
      if (customer.manualCredit) advance += customer.manualCredit;

      // Auto-adjust
      if (receivable > 0 && advance > 0) {
        const offset = Math.min(receivable, advance);
        receivable -= offset;
        advance -= offset;
      }

      // Determine status
      if (receivable > 0 && advance === 0) {
        status = "Customer Owes";
      } else if (advance > 0 && receivable === 0) {
        status = "Advance Available";
      }

      setFormData({
        code: customer.code || "",
        name: customer.companyName || customer.name || "",
        contactPerson: customer.contactPerson || "",
        phone: customer.phone || "",
        ntn: customer.ntn || "",
        strn: customer.strn || "",
        address: customer.address || "",
        region: customer.region || "",
        area: customer.area || "",
        postalCode: customer.postalCode || "",
        country: customer.country || "Pakistan",
        category: customer.category || "Cash Customer",
        creditLimit: customer.creditLimit || 0,
        creditDays: customer.creditDays || 30,
        receivable,
        advance,
        status,
        notes: customer.notes || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        contactPerson: "",
        phone: "",
        ntn: "",
        strn: "",
        address: "",
        region: "",
        area: "",
        postalCode: "",
        country: "Pakistan",
        category: "Cash Customer",
        creditLimit: 0,
        creditDays: 30,
        receivable: 0,
        advance: 0,
        status: "Settled",
        notes: "",
      });
    }
  }, [customer, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      // Auto-adjust receivable and advance before saving
      let receivable = Number(formData.receivable) || 0;
      let advance = Number(formData.advance) || 0;
      
      if (receivable > 0 && advance > 0) {
        const offset = Math.min(receivable, advance);
        receivable -= offset;
        advance -= offset;
      }

      // Calculate opening balance from receivable/advance
      let openingBalance = 0;
      if (receivable > 0) {
        openingBalance = receivable;
      } else if (advance > 0) {
        openingBalance = -advance;
      }

      onSave({
        ...formData,
        receivable,
        advance,
        openingBalance
      });
    }
    onClose();
  };

  return (
    <ERPModal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? "Edit Customer" : "Add New Customer"}
      size="xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div>
            {customer && formData.phone && formData.phone.replace(/[^0-9]/g, "").length >= 10 && (
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-sm font-black shadow-lg shadow-[#25D366]/20 transition-all"
              >
                <MessageCircle size={18} className="fill-white/10" />
                WhatsApp Details
              </button>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button 
              onClick={onClose} 
              className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-2.5 bg-maroon-800 text-white rounded-xl text-sm font-black hover:bg-maroon-900 transition-all shadow-xl shadow-maroon-900/20"
            >
              <Save size={18} />
              {customer ? "Update" : "Create"}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-2 space-y-8">
        {/* Row 0: Account Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} className="text-maroon-800" /> Account Code
              <span className="text-[9px] text-slate-400 font-normal">(Auto-generated if left blank)</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="Auto-generated if left blank"
            />
          </div>
        </div>

        {/* Row 1: Company & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-maroon-800" /> Customer Name <span className="text-red-500 font-black">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="Full Name"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-maroon-800" /> Contact Person
            </label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="Ahmed Khan"
            />
          </div>
        </div>

        {/* Row 2: Email & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Category <span className="text-red-500 font-black">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white"
              required
            >
              <option value="Cash Customer">Cash Customer</option>
              <option value="Credit Customer">Credit Customer</option>
              <option value="Cash Customer (Jama)">Cash Customer (Jama)</option>
              <option value="Credit Customer (Counter)">Credit Customer (Counter)</option>
              <option value="Credit Customer Max">Credit Customer Max</option>
              <option value="Credit Customer (Haji Gul)">Credit Customer (Haji Gul)</option>
              <option value="Credit Customer (Makkah)">Credit Customer (Makkah)</option>
              <option value="Credit Customer (Radbook)">Credit Customer (Radbook)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Phone size={14} className="text-maroon-800" /> Phone <span className="text-red-500 font-black">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="+92 300 1234567"
              required
            />
          </div>
        </div>

        {/* Row 3: Tax Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} className="text-maroon-800" /> NTN (National Tax Number)
            </label>
            <input
              type="text"
              value={formData.ntn}
              onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="1234567-8"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} className="text-maroon-800" /> STRN (Sales Tax Registration)
            </label>
            <input
              type="text"
              value={formData.strn}
              onChange={(e) => setFormData({ ...formData, strn: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="12-34-5678-901-23"
            />
          </div>
        </div>

        {/* Row 4: Address */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <MapPin size={14} className="text-maroon-800" /> Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white min-h-[100px] resize-none"
            placeholder="Street address, area"
          />
        </div>

        {/* Row 5: Region & Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Region
            </label>
            <select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all dark:text-white"
            >
              <option value="">Select Region</option>
              <option>Punjab</option>
              <option>Sindh</option>
              <option>KPK</option>
              <option>Balochistan</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Area
            </label>
            <input
              type="text"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="e.g. Gulberg, DHA"
            />
          </div>
        </div>

        {/* Row 6: Postal Code & Country */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Postal Code
            </label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="74000"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="Pakistan"
            />
          </div>
        </div>

        {/* Row 7: Credit Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <CreditCard size={14} className="text-maroon-800" /> Credit Limit (PKR)
            </label>
            <input
              type="number"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Credit Days
            </label>
            <input
              type="number"
              value={formData.creditDays}
              onChange={(e) => setFormData({ ...formData, creditDays: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="30"
            />
          </div>
        </div>

        {/* Row 8: Customer Receivable, Advance Balance, Net Balance & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Wallet size={14} className="text-rose-600" /> Customer Receivable (Customer Owes)
            </label>
            <input
              type="number"
              value={formData.receivable}
              onChange={(e) => setFormData({ ...formData, receivable: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all dark:text-white"
              placeholder="0"
            />
            <p className="text-[9px] text-slate-400 uppercase tracking-widest">Amount owed by customer</p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Wallet size={14} className="text-emerald-600" /> Advance Balance (We Owe Customer)
            </label>
            <input
              type="number"
              value={formData.advance}
              onChange={(e) => setFormData({ ...formData, advance: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white"
              placeholder="0"
            />
            <p className="text-[9px] text-slate-400 uppercase tracking-widest">Payments received from customer</p>
          </div>
        </div>

        {/* Row 8b: Net Balance & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <CreditCard size={14} className="text-maroon-800" /> Net Balance
            </label>
            <input
              type="text"
              value={`PKR ${((formData.receivable || 0) - (formData.advance || 0)).toLocaleString()}`}
              readOnly
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 cursor-not-allowed"
              placeholder="PKR 0"
            />
            <p className="text-[9px] text-slate-400 uppercase tracking-widest">Auto-calculated (Receivable - Advance)</p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Status
            </label>
            <input
              type="text"
              value={(() => {
                const receivable = formData.receivable || 0;
                const advance = formData.advance || 0;
                if (receivable > 0 && advance === 0) return "🔴 Customer Owes";
                if (advance > 0 && receivable === 0) return "🟢 Advance Available";
                if (receivable > 0 && advance > 0) return "🟡 Mixed Balance";
                return "⚪ Settled";
              })()}
              readOnly
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 cursor-not-allowed"
              placeholder="Settled"
            />
            <p className="text-[9px] text-slate-400 uppercase tracking-widest">Auto-calculated based on balances</p>
          </div>
        </div>

        {/* Row 9: Notes */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white min-h-[80px] resize-none"
            placeholder="Optional notes or additional information"
          />
        </div>
      </form>

      <WhatsAppShareModal 
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        party={{
          ...customer,
          phone: formData.phone,
          name: formData.name,
          status: formData.status,
          balance: (formData.receivable || 0) - (formData.advance || 0),
          type: "Customer"
        }}
        type="Reminder"
        shopProfile={shopProfile}
      />
    </ERPModal>
  );
}
