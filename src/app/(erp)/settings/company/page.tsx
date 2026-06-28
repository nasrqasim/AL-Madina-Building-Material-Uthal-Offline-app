"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Building2, 
  Upload, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Receipt, 
  Coins, 
  Save,
  Image as ImageIcon,
  CheckCircle2
} from "lucide-react";

export default function CompanySettingsPage() {
  const [logo, setLogo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    companyName: "Al Hadeed Traders",
    tradeName: "Al Hadeed Traders",
    address: "Uthal Lasbela",
    city: "Bela",
    province: "Select Province",
    country: "Pakistan",
    postalCode: "",
    phone: "03152914836",
    mobile: "03152914836",
    email: "nasrqasimroonjha10@gmail.com",
    website: "",
    ntn: "1234567-8",
    gstRegistration: "",
    stn: "",
    fiscalYearStart: "July",
    currency: "PKR (Rs.)",
    amountDecimalPlaces: "2 - Standard (0.00)",
    quantityDecimalPlaces: "2 - Standard (0.00)",
  });

  useEffect(() => {
    fetch("/api/shop-profile")
      .then(res => res.json())
      .then(res => {
        if (res.ok && res.data) {
          const { _id, __v, createdAt, updatedAt, ...rest } = res.data;
          setFormData(prev => ({ ...prev, ...rest }));
          if (res.data.logo) setLogo(res.data.logo);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogo(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = { ...formData, logo };
      const res = await fetch("/api/shop-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold">Loading Settings...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">My Company</h1>
        <div className="flex items-center gap-3">
          {/* Subscribe button removed */}
        </div>
      </div>

      <div className="space-y-1 mb-8">
        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">Company Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">Configure your company information, logo, tax numbers, and currency settings.</p>
      </div>

      {/* Company Information */}
      <section className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-800 rounded-2xl">
            <Building2 size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Company Information</h2>
        </div>
        <div className="p-8 lg:p-12 space-y-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
            <label htmlFor="logo-upload" className="w-48 h-48 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 group hover:border-maroon-300 hover:bg-maroon-50/30 transition-all cursor-pointer relative overflow-hidden">
              {logo ? (
                <Image 
                  src={logo} 
                  alt="Logo Preview" 
                  width={192}
                  height={192}
                  unoptimized
                  className="w-full h-full object-contain p-6" 
                />
              ) : (
                <>
                  <ImageIcon size={40} className="text-slate-300 group-hover:text-maroon-400 transition-colors" />
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">No Logo</span>
                </>
              )}
            </label>
            <div className="flex-1 space-y-6 text-center md:text-left">
              <input 
                type="file" 
                id="logo-upload" 
                className="hidden" 
                accept="image/*"
                onChange={handleLogoUpload}
              />
              <label 
                htmlFor="logo-upload"
                className="inline-flex items-center gap-3 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                <Upload size={20} />
                Upload Logo
              </label>
              <div className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold space-y-2 uppercase tracking-wider">
                <p>Recommended size: 200x200 pixels</p>
                <p>Maximum file size: 2MB</p>
                <p>Formats: PNG, JPG, GIF</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Company Name *</label>
              <input 
                type="text" 
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Trade Name</label>
              <input 
                type="text" 
                name="tradeName"
                value={formData.tradeName}
                onChange={handleChange}
                className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-800 rounded-2xl">
            <MapPin size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Contact Information</h2>
        </div>
        <div className="p-8 lg:p-12 space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Address *</label>
            <textarea 
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">City *</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Province</label>
              <select name="province" value={formData.province} onChange={handleChange} className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 appearance-none cursor-pointer">
                <option>Select Province</option>
                <option>Balochistan</option>
                <option>Sindh</option>
                <option>Punjab</option>
                <option>KPK</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Country</label>
              <input type="text" name="country" value={formData.country} onChange={handleChange} className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Postal Code</label>
              <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="e.g., 54000" className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Phone *</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Mobile</label>
              <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Website</label>
              <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="www.company.com" className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100" />
            </div>
          </div>
        </div>
      </section>

      {/* Tax Information */}
      <section className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-800 rounded-2xl">
            <Receipt size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Tax Information</h2>
        </div>
        <div className="p-8 lg:p-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">NTN (National Tax Number)</label>
            <input type="text" name="ntn" value={formData.ntn} onChange={handleChange} className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">GST Registration Number</label>
            <input type="text" name="gstRegistration" value={formData.gstRegistration} onChange={handleChange} placeholder="Registration number" className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">STN (Sales Tax Number)</label>
            <input type="text" name="stn" value={formData.stn} onChange={handleChange} placeholder="If different from GST" className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100" />
          </div>
        </div>
      </section>

      {/* Currency & Financial Settings */}
      <section className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-800 rounded-2xl">
            <Coins size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Currency & Financial Settings</h2>
        </div>
        <div className="p-8 lg:p-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Fiscal Year Start</label>
              <select name="fiscalYearStart" value={formData.fiscalYearStart} onChange={handleChange} className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 appearance-none cursor-pointer">
                <option>July</option>
                <option>January</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Currency</label>
              <select name="currency" value={formData.currency} onChange={handleChange} className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 appearance-none cursor-pointer">
                <option>PKR (Rs.)</option>
                <option>USD ($)</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Amount Decimal Places</label>
              <select name="amountDecimalPlaces" value={formData.amountDecimalPlaces} onChange={handleChange} className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 appearance-none cursor-pointer">
                <option>2 - Standard (0.00)</option>
                <option>0 - No Decimals (0)</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Quantity Decimal Places</label>
              <select name="quantityDecimalPlaces" value={formData.quantityDecimalPlaces} onChange={handleChange} className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 appearance-none cursor-pointer">
                <option>2 - Standard (0.00)</option>
                <option>3 - Precise (0.000)</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Currency Preview</label>
            <div className="w-full px-6 py-5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
              Rs. 1,234,567.89
            </div>
          </div>
        </div>
      </section>

      {/* Fixed Save Button */}
      <div className="fixed bottom-8 left-64 right-0 px-8 flex justify-end z-50 pointer-events-none">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-3 px-10 py-4 bg-maroon-800 text-white rounded-2xl font-black shadow-2xl shadow-maroon-900/40 hover:bg-maroon-700 hover:-translate-y-1 transition-all active:scale-95 pointer-events-auto disabled:opacity-70 disabled:pointer-events-none"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={20} />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-28 right-8 flex items-center gap-3 px-6 py-4 bg-emerald-500 text-white rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <CheckCircle2 size={20} />
          <span className="font-bold text-sm">Company settings saved successfully!</span>
        </div>
      )}
    </div>
  );
}
