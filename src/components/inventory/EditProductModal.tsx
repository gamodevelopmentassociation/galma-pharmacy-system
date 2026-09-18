"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Save, Edit3, Plus } from "lucide-react";
import { toast } from "sonner";
import { updateProductAction, UpdateProductInput, getDistinctCategories } from "@/actions/inventory";

interface EditProductModalProps {
  product: any | null;
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

export function EditProductModal({ product, onClose, onSuccess }: EditProductModalProps) {
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

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getDistinctCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    });
  }, []);

  useEffect(() => {
    if (product) {
      setSku(product.sku || "");
      setBarcode(product.barcode || "");
      setBrandName(product.brandName || "");
      setGenericName(product.genericName || "");
      setCategory(product.category || DEFAULT_CATEGORIES[0]);
      setDosageForm(product.dosageForm || "");
      setManufacturer(product.manufacturer || "");
      setReorderLevel(product.reorderLevel || 15);
      setUnit(product.unit || UNITS[0]);
      setDescription(product.description || "");
    }
  }, [product]);

  if (!product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!brandName || !genericName || !sku || !dosageForm || !manufacturer) {
      toast.error("Please fill in all mandatory product details.");
      return;
    }

    const payload: UpdateProductInput = {
      id: product.id,
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
    };

    startTransition(async () => {
      const res = await updateProductAction(payload);
      if (res.success) {
        toast.success(`Medication "${brandName}" updated successfully!`);
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to update product");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Edit Medication Details</h2>
              <p className="text-xs text-slate-500">Update drug formula, classification, and reorder levels</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Brand Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
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
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Barcode</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

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
                Dosage Form / Strength <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
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
                Reorder Alert Threshold
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

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Description & Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
            />
          </div>

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
              <Save className="w-4 h-4" />
              <span>{isPending ? "Updating..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
