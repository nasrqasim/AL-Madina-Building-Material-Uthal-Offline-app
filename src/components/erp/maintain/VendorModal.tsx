"use client";

import { useState, useEffect } from "react";
import ERPModal from "../ui/ERPModal";
import { Save, User, Building, Phone, MapPin, CreditCard, Banknote, ShieldCheck, Mail, Hash, Wallet, MessageCircle } from "lucide-react";
import WhatsAppShareModal from "../whatsapp/WhatsAppShareModal";

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor?: any;
  onSave?: (data: any) => void;
}

export default function VendorModal({ isOpen, onClose, vendor, onSave }: VendorModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    contactPerson: "",
    phone: "",
    mobile: "",
    email: "",
    ntn: "",
    gst: "",
    address: "",
    region: "",
    area: "",
    postalCode: "",
    country: "Pakistan",
    type: "Supplier",
    creditLimit: 0,
    paymentTerms: 30,
    payable: 0,
    advance: 0,
    status: "Active",
    whtApplicable: false,
    bankName: "",
    accountNo: "",
    branch: "",
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
    if (vendor) {
      let payable = 0;
      let advance = 0;

      if (vendor.openingBalance) {
        if (vendor.openingBalance > 0) {
          payable = vendor.openingBalance;
        } else {
          advance = Math.abs(vendor.openingBalance);
        }
      }

      if (vendor.manualCredit || vendor.credit) payable += Number(vendor.manualCredit || vendor.credit || 0);
      if (vendor.manualDebit || vendor.debit) advance += Number(vendor.manualDebit || vendor.debit || 0);

      // Auto-offset
      if (payable > 0 && advance > 0) {
        const offset = Math.min(payable, advance);
        payable -= offset;
        advance -= offset;
      }

      setFormData({
        code: vendor.code || "",
        name: vendor.companyName || vendor.name || "",
        contactPerson: vendor.contactPerson || "",
        phone: vendor.phone || "",
        mobile: vendor.mobile || "",
        email: vendor.email || "",
        ntn: vendor.ntn || "",
        gst: vendor.gst || vendor.strn || "",
        address: vendor.address || "",
        region: vendor.region || "",
        area: vendor.area || "",
        postalCode: vendor.postalCode || "",
        country: vendor.country || "Pakistan",
        type: vendor.type || "Supplier",
        creditLimit: vendor.creditLimit || 0,
        paymentTerms: vendor.paymentTerms || vendor.creditDays || 30,
        payable: vendor.payable !== undefined ? vendor.payable : payable,
        advance: vendor.advance !== undefined ? vendor.advance : advance,
        status: vendor.status || "Active",
        whtApplicable: vendor.whtApplicable || false,
        bankName: vendor.bankName || "",
        accountNo: vendor.accountNo || "",
        branch: vendor.branch || "",
        notes: vendor.notes || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        contactPerson: "",
        phone: "",
        mobile: "",
        email: "",
        ntn: "",
        gst: "",
        address: "",
        region: "",
        area: "",
        postalCode: "",
        country: "Pakistan",
        type: "Supplier",
        creditLimit: 0,
        paymentTerms: 30,
        payable: 0,
        advance: 0,
        status: "Active",
        whtApplicable: false,
        bankName: "",
        accountNo: "",
        branch: "",
        notes: "",
      });
    }
  }, [vendor, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      let payable = Number(formData.payable) || 0;
      let advance = Number(formData.advance) || 0;

      if (payable > 0 && advance > 0) {
        const offset = Math.min(payable, advance);
        payable -= offset;
        advance -= offset;
      }

      let openingBalance = 0;
      if (payable > 0) {
        openingBalance = payable;
      } else if (advance > 0) {
        openingBalance = -advance;
      }

      onSave({
        ...formData,
        companyName: formData.name,
        payable,
        advance,
        openingBalance,
        credit: payable,
        debit: advance,
      });
    }
    onClose();
  };

  const netBalance = (Number(formData.payable) || 0) - (Number(formData.advance) || 0);

  return (
    <ERPModal
      isOpen={isOpen}
      onClose={onClose}
      title={vendor ? "Edit Vendor" : "Add New Vendor"}
      size="xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div>
            {vendor && (formData.phone || formData.mobile) && (formData.phone || formData.mobile).replace(/[^0-9]/g, "").length >= 10 && (
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
              className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-2.5 bg-maroon-800 text-white rounded-xl text-sm font-black hover:bg-maroon-900 transition-all shadow-xl shadow-maroon-900/20"
            >
              <Save size={18} />
              {vendor ? "Update" : "Create"}
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
              placeholder="e.g. VEND-1001"
            />
          </div>
        </div>

        {/* Row 1: Company & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-maroon-800" /> Vendor Name <span className="text-red-500 font-black">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="Business/Company name"
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
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="Primary contact name"
            />
          </div>
        </div>

        {/* Row 2: Type & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Vendor Type <span className="text-red-500 font-black">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white"
              required
            >
              <option value="Supplier">Supplier</option>
              <option value="Manufacturer">Manufacturer</option>
              <option value="Wholesaler">Wholesaler</option>
              <option value="Importer">Importer</option>
              <option value="Distributor">Distributor</option>
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
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="e.g., 1234567-8"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} className="text-maroon-800" /> GST Number (Sales Tax Registration)
            </label>
            <input
              type="text"
              value={formData.gst}
              onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="GST registration number"
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
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white min-h-[100px] resize-none"
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
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white"
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
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
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
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
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
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
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
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Credit Days / Payment Terms
            </label>
            <input
              type="number"
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="30"
            />
          </div>
        </div>

        {/* Row 8: Vendor Payable & Advance Balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Wallet size={14} className="text-rose-600" /> Vendor Payable (We Owe Vendor)
            </label>
            <input
              type="number"
              value={formData.payable}
              onChange={(e) => setFormData({ ...formData, payable: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all dark:text-white"
              placeholder="0"
            />
            <p className="text-[9px] text-slate-400 uppercase tracking-widest">Goods purchased from vendor</p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Wallet size={14} className="text-emerald-600" /> Advance Balance (Vendor Owes Us)
            </label>
            <input
              type="number"
              value={formData.advance}
              onChange={(e) => setFormData({ ...formData, advance: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white"
              placeholder="0"
            />
            <p className="text-[9px] text-slate-400 uppercase tracking-widest">Payments made to vendor</p>
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
              value={`PKR ${Math.abs(netBalance).toLocaleString()}`}
              readOnly
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 cursor-not-allowed"
              placeholder="PKR 0"
            />
            <p className="text-[9px] text-slate-400 uppercase tracking-widest">Auto-calculated (Payable - Advance)</p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Status
            </label>
            <input
              type="text"
              value={(() => {
                const payable = formData.payable || 0;
                const advance = formData.advance || 0;
                if (payable > 0 && advance === 0) return "🔴 We Owe Vendor";
                if (advance > 0 && payable === 0) return "🟢 Advance Available";
                if (payable > 0 && advance > 0) return "🟡 Mixed Balance";
                return "⚪ Settled";
              })()}
              readOnly
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 cursor-not-allowed"
              placeholder="Settled"
            />
            <p className="text-[9px] text-slate-400 uppercase tracking-widest">Auto-calculated based on balances</p>
          </div>
        </div>

        {/* Bank Details */}
        <section className="space-y-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <Banknote size={16} className="text-maroon-800" /> Bank Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
                placeholder="e.g., HBL, MCB, UBL"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Account Number</label>
              <input
                type="text"
                value={formData.accountNo}
                onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
                placeholder="Bank account number"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Branch</label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
                placeholder="Branch name"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="wht-vendor"
                checked={formData.whtApplicable}
                onChange={(e) => setFormData({ ...formData, whtApplicable: e.target.checked })}
                className="w-4 h-4 rounded text-maroon-800 focus:ring-maroon-500"
              />
              <label htmlFor="wht-vendor" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Deduct Withholding Tax on payments
              </label>
            </div>
          </div>
        </section>

        {/* Row 9: Notes */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
            What things I purchased / Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white min-h-[90px] resize-none"
            placeholder="Items purchased or internal notes about this vendor..."
          />
        </div>
      </form>

      <WhatsAppShareModal 
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        party={{
          ...vendor,
          phone: formData.phone || formData.mobile,
          name: formData.name,
          status: formData.status,
          balance: netBalance,
          type: "Vendor"
        }}
        type="Reminder"
        shopProfile={shopProfile}
      />
    </ERPModal>
  );
}
