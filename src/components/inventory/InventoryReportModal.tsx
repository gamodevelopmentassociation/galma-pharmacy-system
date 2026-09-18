"use client";

import { useState } from "react";
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Layers,
  Package,
  CheckCircle2,
  DollarSign,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { PharmacySettings, SessionUser } from "@/lib/types";
import {
  downloadInventoryCSV,
  printA4InventoryReport,
  generateInventoryCSVRows,
} from "@/lib/inventoryExport";
import { format } from "date-fns";
import { toast } from "sonner";

interface InventoryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  allProducts?: any[];
  settings: PharmacySettings;
  user: SessionUser;
  activeFilterSummary?: string;
}

export function InventoryReportModal({
  isOpen,
  onClose,
  products,
  allProducts,
  settings,
  user,
  activeFilterSummary,
}: InventoryReportModalProps) {
  const [scope, setScope] = useState<"all" | "filtered">(
    allProducts && allProducts.length !== products.length ? "all" : "filtered"
  );
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");

  if (!isOpen) return null;

  const dataToExport =
    scope === "all" && allProducts && allProducts.length > 0 ? allProducts : products;

  const {
    rows,
    totalProducts,
    totalBatches,
    totalUnits,
    totalCostValuation,
    totalRetailValuation,
  } = generateInventoryCSVRows(dataToExport);

  const handleCSVDownload = () => {
    try {
      downloadInventoryCSV(dataToExport, settings.pharmacyName, user.name);
      toast.success("Full inventory CSV downloaded successfully!");
    } catch (err: any) {
      toast.error("Failed to download CSV: " + err.message);
    }
  };

  const handlePrintA4 = () => {
    try {
      printA4InventoryReport(dataToExport, settings, user, orientation);
      toast.info("A4 print dialog opened. Choose 'Save as PDF' to download PDF.");
    } catch (err: any) {
      toast.error("Failed to open print dialog: " + err.message);
    }
  };

  const reportRef = `AUD-INV-${format(new Date(), "yyyyMMdd")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <FileSpreadsheet className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Full Inventory & Batch Report (A4 & CSV)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Official stock valuation, batch verification, and regulatory inventory audit
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Scope Toggle if filtered */}
            {allProducts && allProducts.length !== products.length && (
              <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setScope("all")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    scope === "all"
                      ? "bg-slate-900 text-white font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({allProducts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setScope("filtered")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    scope === "filtered"
                      ? "bg-slate-900 text-white font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Filtered ({products.length})
                </button>
              </div>
            )}

            {/* Orientation Switcher */}
            <div className="hidden sm:flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setOrientation("landscape")}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  orientation === "landscape"
                    ? "bg-emerald-600 text-white font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Recommended for full table width"
              >
                A4 Landscape
              </button>
              <button
                type="button"
                onClick={() => setOrientation("portrait")}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  orientation === "portrait"
                    ? "bg-emerald-600 text-white font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                A4 Portrait
              </button>
            </div>

            {/* Direct CSV Download */}
            <button
              type="button"
              onClick={handleCSVDownload}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Download raw spreadsheet data"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>

            {/* Direct A4 Print / PDF */}
            <button
              type="button"
              onClick={handlePrintA4}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Print or Save as A4 PDF document"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print / A4 PDF</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live A4 Document Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70">
          <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 text-slate-900 text-xs">
            {/* Document Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b-2 border-emerald-600">
              <div>
                <h1 className="text-lg font-black tracking-tight text-emerald-800">
                  {settings.pharmacyName}
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">{settings.tagline}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {settings.address} &bull; Tel: {settings.phone} &bull; Email: {settings.email}
                </p>
              </div>
              <div className="sm:text-right">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                  Official A4 Audit Sheet
                </span>
                <p className="text-[11px] font-bold text-slate-900 mt-1.5">
                  Ref: <span className="font-mono text-slate-700">{reportRef}</span>
                </p>
                <p className="text-[10px] text-slate-500">
                  Generated: {format(new Date(), "MMM dd, yyyy HH:mm")}
                </p>
                <p className="text-[10px] text-slate-500">
                  Auditor: {user.name} ({user.role})
                </p>
              </div>
            </div>

            {/* Summary Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 my-4">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                  Catalog Drugs
                </span>
                <span className="text-sm font-black text-slate-900">{totalProducts}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                  Tracked Batches
                </span>
                <span className="text-sm font-black text-slate-900">{totalBatches}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                  Total Units
                </span>
                <span className="text-sm font-black text-slate-900">
                  {totalUnits.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                  Cost Valuation
                </span>
                <span className="text-sm font-black text-slate-900">
                  {settings.currencySymbol}{" "}
                  {Number(totalCostValuation).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-[9px] uppercase tracking-wider text-emerald-800 font-bold block">
                  Retail Valuation
                </span>
                <span className="text-sm font-black text-emerald-700">
                  {settings.currencySymbol}{" "}
                  {Number(totalRetailValuation).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-[10px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[9px]">
                    <th className="py-2 px-2 text-center w-8">#</th>
                    <th className="py-2 px-2">SKU</th>
                    <th className="py-2 px-2">Medication</th>
                    <th className="py-2 px-2">Category</th>
                    <th className="py-2 px-2">Batch #</th>
                    <th className="py-2 px-2 text-center">Expiry</th>
                    <th className="py-2 px-2 text-center">Status</th>
                    <th className="py-2 px-2 text-right">Qty</th>
                    <th className="py-2 px-2 text-right">Cost</th>
                    <th className="py-2 px-2 text-right">Price</th>
                    <th className="py-2 px-2 text-right">Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.slice(0, 40).map((r, idx) => {
                    let statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    if (r.expiryStatus === "EXPIRED" || r.stockStatus === "OUT_OF_STOCK") {
                      statusBadge = "bg-rose-50 text-rose-700 border-rose-200";
                    } else if (
                      r.expiryStatus === "NEAR_EXPIRY" ||
                      r.stockStatus === "LOW_STOCK"
                    ) {
                      statusBadge = "bg-amber-50 text-amber-700 border-amber-200";
                    }

                    return (
                      <tr key={`${r.sku}-${r.batchNumber}-${idx}`} className="hover:bg-slate-50/80">
                        <td className="py-1.5 px-2 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-mono text-[9.5px] font-semibold text-slate-700">
                          {r.sku}
                        </td>
                        <td className="py-1.5 px-2">
                          <span className="font-bold text-slate-900 block">{r.brandName}</span>
                          <span className="text-[9px] text-slate-500 block truncate max-w-[140px]">
                            {r.genericName}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-slate-600">{r.category}</td>
                        <td className="py-1.5 px-2 font-mono font-semibold text-slate-800">
                          {r.batchNumber}
                        </td>
                        <td className="py-1.5 px-2 text-center text-slate-600">{r.expiryDate}</td>
                        <td className="py-1.5 px-2 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold border ${statusBadge}`}
                          >
                            {r.expiryStatus}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-right font-bold text-slate-900">
                          {r.batchQuantity}{" "}
                          <span className="text-[8.5px] font-normal text-slate-400">{r.unit}</span>
                        </td>
                        <td className="py-1.5 px-2 text-right text-slate-600">
                          {Number(r.purchasePrice).toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 text-right font-semibold text-slate-900">
                          {Number(r.sellingPrice).toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 text-right font-bold text-slate-900">
                          {Number(r.totalCostValuation).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {rows.length > 40 && (
                <div className="py-2.5 px-4 bg-slate-50 border-t border-slate-200 text-center text-slate-500 text-[10px]">
                  Showing preview of first 40 rows. Printing or exporting to CSV will include all{" "}
                  <strong>{rows.length}</strong> items.
                </div>
              )}
            </div>

            {/* Sign-off Blocks */}
            <div className="grid grid-cols-3 gap-6 pt-8 mt-6 border-t border-slate-200 text-center">
              <div className="border-t border-slate-400 pt-2">
                <span className="text-[10px] font-bold text-slate-800 block">Prepared By</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">
                  {user.name} ({user.role})
                </span>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <span className="text-[10px] font-bold text-slate-800 block">
                  Verified By Lead Pharmacist
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">
                  Signature & Stamp
                </span>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <span className="text-[10px] font-bold text-slate-800 block">
                  Approved By Management
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">
                  Audit Sign-off & Date
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500">
            Export includes <strong>{totalProducts}</strong> medications and{" "}
            <strong>{totalBatches}</strong> batch records
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCSVDownload}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrintA4}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print / A4 PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
