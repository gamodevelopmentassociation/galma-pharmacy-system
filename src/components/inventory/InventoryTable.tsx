"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Search,
  Plus,
  Package,
  Layers,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  Edit3,
  Trash2,
  Download,
  Printer,
  FileSpreadsheet,
  PackageMinus,
} from "lucide-react";
import { AddProductModal } from "./AddProductModal";
import { EditProductModal } from "./EditProductModal";
import { AddBatchModal } from "./AddBatchModal";
import { StockAdjustmentModal } from "./StockAdjustmentModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { InventoryReportModal } from "./InventoryReportModal";
import { getInventoryProducts, getDistinctCategories } from "@/actions/inventory";
import { PharmacySettings, SessionUser } from "@/lib/types";
import { downloadInventoryCSV } from "@/lib/inventoryExport";
import { differenceInDays, format } from "date-fns";
import { toast } from "sonner";

interface InventoryTableProps {
  initialProducts: any[];
  settings: PharmacySettings;
  user: SessionUser;
  initialTab?: string;
  initialAddOpen?: boolean;
}

export function InventoryTable({
  initialProducts,
  settings,
  user,
  initialTab = "all",
  initialAddOpen = false,
}: InventoryTableProps) {
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [categories, setCategories] = useState<string[]>([]);
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getDistinctCategories().then((cats) => {
      if (cats && cats.length > 0) setCategories(cats);
    });
  }, []);

  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState(initialAddOpen);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<any | null>(null);
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<any | null>(null);
  const [selectedBatchForAdjustment, setSelectedBatchForAdjustment] = useState<any | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "PRODUCT" | "BATCH";
    id: string;
    name: string;
    subtext?: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleQuickDownloadCSV = async () => {
    try {
      setIsExporting(true);
      const allData = await getInventoryProducts("", "ALL");
      downloadInventoryCSV(
        allData && allData.length > 0 ? allData : products,
        settings.pharmacyName,
        user.name
      );
      toast.success("Full inventory CSV downloaded successfully!");
    } catch (err: any) {
      toast.error("Failed to download CSV: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const refreshData = () => {
    startTransition(async () => {
      const data = await getInventoryProducts(search, category);
      setProducts(data);
    });
  };

  const handleSearch = (q: string, cat = category) => {
    setSearch(q);
    startTransition(async () => {
      const data = await getInventoryProducts(q, cat);
      setProducts(data);
    });
  };

  const toggleExpand = (productId: string) => {
    setExpandedProductIds((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  // Filter products according to active tab
  const filteredProducts = products.filter((p) => {
    if (activeTab === "low-stock") {
      return p.isLowStock;
    }
    if (activeTab === "near-expiry") {
      return p.hasNearExpiry;
    }
    if (activeTab === "expired") {
      return p.hasExpired;
    }
    return true;
  });

  // Calculate summary stats
  const totalProducts = products.length;
  const totalBatches = products.reduce((acc, p) => acc + p.batches.length, 0);
  const totalLowStock = products.filter((p) => p.isLowStock).length;
  const totalNearExpiry = products.filter((p) => p.hasNearExpiry || p.hasExpired).length;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Inventory & Batch Management</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {totalProducts} Drugs
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time drug catalog, full CRUD operations, batch-level tracking, and expiration monitoring
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download CSV */}
          <button
            type="button"
            onClick={handleQuickDownloadCSV}
            disabled={isExporting}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
            title="Download full inventory and batches as A4 CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isExporting ? "Exporting..." : "Download CSV"}</span>
          </button>

          {/* A4 Report / PDF */}
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="Preview and print official A4 inventory audit sheet"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span>A4 Report (PDF)</span>
          </button>

          {user.role !== "CASHIER" && (
            <>
              <button
                type="button"
                onClick={() => setIsAdjustOpen(true)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Adjust stock by batch number for expiry, damage, counting errors or return to supplier"
              >
                <PackageMinus className="w-3.5 h-3.5 text-amber-600" />
                <span>Adjust Stock</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddProductOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Medication</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Package className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Total Products
            </span>
            <span className="text-lg font-bold text-slate-900">{totalProducts}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Active Batches
            </span>
            <span className="text-lg font-bold text-teal-900">{totalBatches}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <span className="text-lg font-bold text-amber-700">{totalLowStock}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <AlertOctagon className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Urgent / Expiring
            </span>
            <span className="text-lg font-bold text-rose-700">{totalNearExpiry}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: `All Items (${totalProducts})` },
              { id: "low-stock", label: `Low Stock (${totalLowStock})` },
              { id: "near-expiry", label: `Near Expiry (${totalNearExpiry})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === t.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search and Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search drug, generic, SKU..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <select
              value={category}
              onChange={(e) => handleSearch(search, e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {Array.from(new Set([...categories, ...products.map((p) => p.category)]))
                .filter(Boolean)
                .sort()
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>

            <button
              onClick={refreshData}
              className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Refresh inventory"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Product & Batches Table */}
        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[780px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3 w-8"></th>
                <th className="py-3 px-3">Medication Name</th>
                <th className="py-3 px-3">Category & Specs</th>
                <th className="py-3 px-3">SKU / Code</th>
                <th className="py-3 px-3 text-center">Batches</th>
                <th className="py-3 px-3 text-right">Total Stock</th>
                <th className="py-3 px-3 text-right">Price Range</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-xs">No medications match your filter.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isExpanded = !!expandedProductIds[p.id];
                  const totalQty = p.totalStock || 0;
                  const minPrice =
                    p.batches.length > 0 ? Math.min(...p.batches.map((b: any) => b.sellingPrice)) : 0;
                  const maxPrice =
                    p.batches.length > 0 ? Math.max(...p.batches.map((b: any) => b.sellingPrice)) : 0;

                  return (
                    <div key={p.id} className="contents">
                      {/* Product Main Row */}
                      <tr
                        onClick={() => toggleExpand(p.id)}
                        className={`cursor-pointer transition-colors hover:bg-slate-50/80 ${
                          isExpanded ? "bg-slate-50/60" : ""
                        }`}
                      >
                        <td className="py-3 px-3 text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900 leading-tight">{p.brandName}</p>
                          <p className="text-[11px] text-slate-500">{p.genericName}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                            {p.category}
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {p.dosageForm} • {p.manufacturer}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">{p.sku}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px]">
                            {p.batches.length} batch(es)
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="font-bold text-slate-900">{totalQty}</span>{" "}
                          <span className="text-[10px] text-slate-400">{p.unit}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-800">
                          {minPrice === maxPrice
                            ? `${settings.currencySymbol} ${minPrice.toFixed(2)}`
                            : `${settings.currencySymbol} ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {totalQty === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              Out of Stock
                            </span>
                          ) : p.isLowStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Low Stock (&le;{p.reorderLevel})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {user.role !== "CASHIER" && (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setSelectedProductForBatch(p)}
                                className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200/80"
                                title="Add stock intake batch"
                              >
                                + Batch
                              </button>
                              <button
                                onClick={() => setSelectedProductForEdit(p)}
                                className="p-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                title="Edit medication details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  setItemToDelete({
                                    type: "PRODUCT",
                                    id: p.id,
                                    name: `${p.brandName} (${p.sku})`,
                                    subtext: `Warning: This will permanently delete ${p.brandName} and all its ${p.batches.length} inventory batches.`,
                                  })
                                }
                                className="p-1 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                                title="Remove medication from inventory"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Batch Details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="bg-slate-50/70 p-4 border-y border-slate-200">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                              <div className="p-3 bg-slate-100/60 border-b border-slate-200 flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                                  <span>Active Batches for {p.brandName}</span>
                                </h4>
                                {user.role !== "CASHIER" && (
                                  <button
                                    onClick={() => setSelectedProductForBatch(p)}
                                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>New Stock Intake</span>
                                  </button>
                                )}
                              </div>

                              <div className="divide-y divide-slate-100">
                                {p.batches.length === 0 ? (
                                  <p className="p-4 text-xs text-slate-400 text-center">
                                    No active stock batches. Click &quot;+ Add Batch&quot; to record intake.
                                  </p>
                                ) : (
                                  p.batches.map((b: any) => {
                                    const daysRemaining = differenceInDays(new Date(b.expiryDate), new Date());
                                    const isExpired = daysRemaining <= 0;
                                    const isUrgent = daysRemaining > 0 && daysRemaining <= 30;
                                    const isNear = daysRemaining > 30 && daysRemaining <= 60;

                                    return (
                                      <div
                                        key={b.id}
                                        className="p-3 grid grid-cols-1 md:grid-cols-6 items-center gap-3 text-xs hover:bg-slate-50/50"
                                      >
                                        <div className="md:col-span-2">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                              {b.batchNumber}
                                            </span>
                                            {b.supplier && (
                                              <span className="text-[10px] text-slate-400 truncate">
                                                ({b.supplier})
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div>
                                          <span className="text-[10px] text-slate-400 block font-medium">
                                            Stock Quantity
                                          </span>
                                          <span className="font-bold text-slate-900">
                                            {b.quantity} / {b.initialQty} {p.unit}
                                          </span>
                                        </div>

                                        <div>
                                          <span className="text-[10px] text-slate-400 block font-medium">
                                            Cost / Selling
                                          </span>
                                          <span className="text-slate-600 font-medium">
                                            {settings.currencySymbol} {b.purchasePrice.toFixed(2)} &rarr;{" "}
                                            <span className="font-bold text-emerald-700">
                                              {settings.currencySymbol} {b.sellingPrice.toFixed(2)}
                                            </span>
                                          </span>
                                        </div>

                                        <div>
                                          <span className="text-[10px] text-slate-400 block font-medium">
                                            Expiry Date
                                          </span>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="font-medium text-slate-800">
                                              {format(new Date(b.expiryDate), "MMM dd, yyyy")}
                                            </span>
                                            <span
                                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                                isExpired
                                                  ? "bg-rose-600 text-white"
                                                  : isUrgent
                                                  ? "bg-rose-100 text-rose-800"
                                                  : isNear
                                                  ? "bg-amber-100 text-amber-800"
                                                  : "bg-emerald-50 text-emerald-700"
                                              }`}
                                            >
                                              {isExpired
                                                ? "EXPIRED"
                                                : isUrgent
                                                ? `${daysRemaining}d left`
                                                : isNear
                                                ? `${daysRemaining}d`
                                                : "Safe"}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="text-right flex items-center justify-end gap-1.5">
                                          {user.role !== "CASHIER" && (
                                            <>
                                              <button
                                                onClick={() =>
                                                  setSelectedBatchForAdjustment({ ...b, product: p })
                                                }
                                                className="px-2 py-1 text-[10px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200/80 transition-colors"
                                              >
                                                Adjust
                                              </button>
                                              <button
                                                onClick={() =>
                                                  setItemToDelete({
                                                    type: "BATCH",
                                                    id: b.id,
                                                    name: `Batch ${b.batchNumber} (${p.brandName})`,
                                                    subtext: `Permanently removes this batch with ${b.quantity} remaining units.`,
                                                  })
                                                }
                                                className="p-1 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                                                title="Delete batch"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </div>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSuccess={() => {
          refreshData();
          getDistinctCategories().then((cats) => {
            if (cats && cats.length > 0) setCategories(cats);
          });
        }}
      />

      {selectedProductForEdit && (
        <EditProductModal
          product={selectedProductForEdit}
          onClose={() => setSelectedProductForEdit(null)}
          onSuccess={() => {
            refreshData();
            getDistinctCategories().then((cats) => {
              if (cats && cats.length > 0) setCategories(cats);
            });
          }}
        />
      )}

      {selectedProductForBatch && (
        <AddBatchModal
          product={selectedProductForBatch}
          onClose={() => setSelectedProductForBatch(null)}
          onSuccess={refreshData}
        />
      )}

      {selectedBatchForAdjustment && (
        <StockAdjustmentModal
          key={selectedBatchForAdjustment.id}
          batch={selectedBatchForAdjustment}
          onClose={() => setSelectedBatchForAdjustment(null)}
          onSuccess={refreshData}
        />
      )}

      {isAdjustOpen && (
        <StockAdjustmentModal
          onClose={() => setIsAdjustOpen(false)}
          onSuccess={() => {
            refreshData();
            setIsAdjustOpen(false);
          }}
        />
      )}

      {itemToDelete && (
        <DeleteConfirmModal
          item={itemToDelete}
          onClose={() => setItemToDelete(null)}
          onSuccess={refreshData}
        />
      )}

      {/* Inventory A4 Report & CSV Modal */}
      <InventoryReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        products={filteredProducts}
        allProducts={products}
        settings={settings}
        user={user}
        activeFilterSummary={
          search
            ? `Search query: "${search}"`
            : category !== "ALL"
            ? `Category: ${category}`
            : undefined
        }
      />
    </div>
  );
}
