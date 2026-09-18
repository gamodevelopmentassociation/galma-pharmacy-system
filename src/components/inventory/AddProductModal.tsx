"use client";

import { useState, useEffect, useTransition } from "react";
import { X, Plus, Package, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createProductAction, CreateProductInput, getDistinctCategories } from "@/actions/inventory";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_CATEGORIES = [
  "Antibiotics",
  "Analgesics",
  "Antidiabetic",
  "Cardiovascular",
  "Gastrointestinal",
  "Respiratory",
  "Antihistamine",
  "Vitamins & Supplements",
  "Topical",
  "Syrups",
  "Injections",
  "Ophthalmic",
];

const UNITS = ["Box", "Strip", "Bottle", "Vial", "Ampoule", "Tube", "Canister", "Piece"];

export function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [brandName, setBrandName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [dosageForm, setDosageForm] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [reorderLevel, setReorderLevel] = useState<number>(15);
  const [unit, setUnit] = useState(UNITS[0]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    getDistinctCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    });
  }, []);

  // Optional initial batch fields
  const [includeInitialBatch, setIncludeInitialBatch] = useState(true);
  const [batchNumber, setBatchNumber] = useState("");
  const [quantity, setQuantity] = useState<number>(50);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [expiryDate, setExpiryDate] = useState("");
  const [supplier, setSupplier] = useState("");

  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!brandName || !genericName || !sku || !dosageForm || !manufacturer) {
      toast.error("Please fill in all mandatory product details.");
      return;
    }

    if (includeInitialBatch && (!batchNumber || !expiryDate || sellingPrice <= 0)) {
      toast.error("Please complete the initial batch details with valid pricing and expiry date.");
      return;
    }

    const payload: CreateProductInput = {
      sku,
      barcode: barcode || undefined,
      brandName,
      genericName,
      category,
      dosageForm,
      manufacturer,
      description: description || undefined,
      reorderLevel,
      unit,
      initialBatch: includeInitialBatch
        ? {
            batchNumber,
            quantity,
            purchasePrice,
            sellingPrice,
            expiryDate,
            supplier: supplier || undefined,
          }
        : undefined,
    };

    startTransition(async () => {
      const res = await createProductAction(payload);
      if (res.success) {
        toast.success(`Product "${brandName}" added successfully!`);
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to create product");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Add New Medication / Product</h2>
              <p className="text-xs text-slate-500">Register a new drug into the inventory catalog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Basic Drug Info */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              1. Drug Identification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Brand Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Augmentin Duo"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Generic Formula <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amoxicillin + Clavulanate"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  SKU / Item Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DRG-AUG-625"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Barcode (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 8901088012345"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Classification & Dosage */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              2. Classification & Specs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(!isAddingCategory)}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isAddingCategory ? "Select Existing" : "+ New"}</span>
                  </button>
                </div>

                {isAddingCategory ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. Dermatology"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-emerald-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = newCategoryName.trim();
                        if (!trimmed) {
                          toast.error("Please enter a category name");
                          return;
                        }
                        if (!categories.includes(trimmed)) {
                          setCategories((prev) => [...prev, trimmed].sort());
                        }
                        setCategory(trimmed);
                        setNewCategoryName("");
                        setIsAddingCategory(false);
                        toast.success(`Category "${trimmed}" added!`);
                      }}
                      className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === "__NEW__") {
                        setIsAddingCategory(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__NEW__">+ Add Custom Category...</option>
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Dosage / Strength <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 625mg Tablets"
                  value={dosageForm}
                  onChange={(e) => setDosageForm(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Manufacturer <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GSK Pharma"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Unit Packaging</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reorder Alert Level
                </label>
                <input
                  type="number"
                  min="1"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(Number(e.target.value) || 10)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Initial Batch Details (Toggleable) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeInitialBatch}
                  onChange={(e) => setIncludeInitialBatch(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  Include Initial Stock Intake Batch
                </span>
              </label>
            </div>

            {includeInitialBatch && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Batch Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={includeInitialBatch}
                    placeholder="e.g. BN-2026-09"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Initial Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required={includeInitialBatch}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Expiry Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required={includeInitialBatch}
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Purchase Cost Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={purchasePrice === 0 ? "" : purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Retail Selling Price <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required={includeInitialBatch}
                    placeholder="0.00"
                    value={sellingPrice === 0 ? "" : sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold text-emerald-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Supplier / Distributor</label>
                  <input
                    type="text"
                    placeholder="e.g. National Pharma"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isPending ? "Registering..." : "Save Medication"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
