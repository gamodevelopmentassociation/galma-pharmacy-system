"use client";

import { useState, useTransition } from "react";
import { Settings, Store, Receipt, Percent, Save, Palette, Check } from "lucide-react";
import { toast } from "sonner";
import { updatePharmacySettingsAction, UpdateSettingsInput } from "@/actions/settings";
import { PharmacySettings, SessionUser } from "@/lib/types";
import { useTheme, Theme } from "@/components/theme/ThemeProvider";

interface SettingsFormProps {
  initialSettings: PharmacySettings;
  user: SessionUser;
}

export function SettingsForm({ initialSettings, user }: SettingsFormProps) {
  const { theme, setTheme } = useTheme();

  const [pharmacyName, setPharmacyName] = useState(initialSettings.pharmacyName);
  const [tagline, setTagline] = useState(initialSettings.tagline || "");
  const [address, setAddress] = useState(initialSettings.address);
  const [phone, setPhone] = useState(initialSettings.phone);
  const [email, setEmail] = useState(initialSettings.email);
  const [taxRate, setTaxRate] = useState<number>(initialSettings.taxRate);
  const [currency, setCurrency] = useState(initialSettings.currency);
  const [currencySymbol, setCurrencySymbol] = useState(initialSettings.currencySymbol);
  const [receiptFooter, setReceiptFooter] = useState(initialSettings.receiptFooter);

  const [isPending, startTransition] = useTransition();

  const themeCards: { id: Theme; title: string; desc: string; previewClass: string }[] = [
    {
      id: "light",
      title: "Clean Light",
      desc: "Fresh Clinical Emerald & Crisp White",
      previewClass: "bg-emerald-600 text-white",
    },
    {
      id: "dark",
      title: "Dark Obsidian",
      desc: "Deep Modern Slate for Night / Low Light",
      previewClass: "bg-slate-900 text-white",
    },
    {
      id: "brown",
      title: "Warm Sepia",
      desc: "Warm Earthy Brown & Amber Sand",
      previewClass: "bg-[#78350f] text-white",
    },
    {
      id: "gray",
      title: "Slate Gray",
      desc: "Monochrome Minimalist Industrial Steel",
      previewClass: "bg-[#475569] text-white",
    },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pharmacyName || !address || !phone || !email || !currency) {
      toast.error("Please fill in all mandatory store configuration fields.");
      return;
    }

    const payload: UpdateSettingsInput = {
      pharmacyName,
      tagline,
      address,
      phone,
      email,
      taxRate: Number(taxRate) || 0,
      currency,
      currencySymbol,
      receiptFooter,
    };

    startTransition(async () => {
      const res = await updatePharmacySettingsAction(payload);
      if (res.success) {
        toast.success("Pharmacy settings and receipt templates updated successfully!");
      } else {
        toast.error(res.error || "Failed to update settings.");
      }
    });
  };

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Pharmacy Profile & System Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure business details, visual themes, tax rates, currencies, and printable receipt headers/footers
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 0: Visual Theme Selector */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Palette className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              System Appearance & Theme
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {themeCards.map((tc) => (
              <button
                type="button"
                key={tc.id}
                onClick={() => setTheme(tc.id)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  theme === tc.id
                    ? "border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm bg-emerald-50/30"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-6 h-6 rounded-lg ${tc.previewClass} flex items-center justify-center text-[10px] font-bold shadow-xs`}>
                    Aa
                  </span>
                  {theme === tc.id && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="font-bold text-xs text-slate-900">{tc.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{tc.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Section 1: Store Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Store Identification & Branding
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Pharmacy / Business Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tagline / Slogan
              </label>
              <input
                type="text"
                placeholder="e.g. Precision Care & Trusted Pharmaceuticals"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Physical Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Official Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Fiscal & Currency Settings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Percent className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Tax & Currency Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Sales Tax Rate (%) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Currency Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="ETB, USD, EUR..."
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Display Currency Symbol <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="ETB, $, €..."
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Receipt Template */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Printable Invoice Receipt Template
            </h2>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Receipt Footer Message
            </label>
            <textarea
              rows={2}
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              This message appears at the bottom of every customer invoice and thermal POS slip.
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isPending ? "Saving Changes..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
