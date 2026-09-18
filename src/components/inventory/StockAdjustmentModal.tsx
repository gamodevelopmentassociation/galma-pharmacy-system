"use client";

import { useEffect, useState, useTransition } from "react";
import { X, AlertTriangle, Check, Search, PackageSearch, Layers, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  adjustStockAction,
  searchBatchesByNumber,
  StockAdjustmentInput,
} from "@/actions/inventory";

interface StockAdjustmentModalProps {
  batch?: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

type AdjustType = "DAMAGED" | "EXPIRED" | "RETURNED" | "RETURN_TO_SUPPLIER" | "CORRECTION";

const TYPE_OPTIONS: { id: AdjustType; label: string; desc: string }[] = [
  { id: "EXPIRED", label: "Expired Date", desc: "Reduces stock" },
  { id: "DAMAGED", label: "Damaged", desc: "Reduces stock" },
  { id: "RETURN_TO_SUPPLIER", label: "Return to Supplier", desc: "Reduces stock" },
  { id: "CORRECTION", label: "Counting Error", desc: "Reconciliation" },
  { id: "RETURNED", label: "Customer Return", desc: "Adds to stock" },
];

export function StockAdjustmentModal({ batch: initialBatch, onClose, onSuccess }: StockAdjustmentModalProps) {
  const [selectedBatch, setSelectedBatch] = useState<any | null>(initialBatch || null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [type, setType] = useState<AdjustType>("DAMAGED");
  const [direction, setDirection] = useState<"ADD" | "DEDUCT">("DEDUCT");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  // Live batch-number search (only when no batch is pre-selected from the table row)
  useEffect(() => {
    if (selectedBatch) return;
    const t = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      const res = await searchBatchesByNumber(query);
      setResults(res);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, selectedBatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBatch) {
      toast.error("Please search for and select a batch by its batch number.");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please enter a valid audit explanation reason for this adjustment.");
      return;
    }

    const isCorrection = type === "CORRECTION";
    const sign =
      type === "RETURNED" ? 1 : isCorrection ? (direction === "ADD" ? 1 : -1) : -1;
    const adjustedQty = Math.abs(quantity) * sign;

    if (adjustedQty < 0 && Math.abs(adjustedQty) > selectedBatch.quantity) {
      toast.error(`Cannot deduct ${Math.abs(adjustedQty)} units. Batch balance is only ${selectedBatch.quantity}.`);
      return;
    }

    const payload: StockAdjustmentInput = {
      batchId: selectedBatch.id,
      type,
      quantity: adjustedQty,
      reason,
    };

    startTransition(async () => {
      const res = await adjustStockAction(payload);
      if (res.success) {
        toast.success("Stock adjustment logged and inventory updated successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to adjust stock");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Stock Adjustment</h2>
              <p className="text-xs text-slate-500 truncate max-w-xs">
                {selectedBatch
                  ? `${selectedBatch.product?.brandName || "Drug"} (Batch: ${selectedBatch.batchNumber})`
                  : "Search for a batch by its lot number"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {/* Batch search (when no pre-selected batch) */}
          {!selectedBatch ? (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Find Batch by Number / Product <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type batch number, e.g. BN-AUG-2026-04, or brand / SKU..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
                {searching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 animate-pulse">
                    Searching...
                  </span>
                )}
              </div>

              {results.length > 0 && (
                <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-52 overflow-y-auto">
                  {results.map((b) => (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => {
                        setSelectedBatch(b);
                        setResults([]);
                        setQuery("");
                      }}
                      className="w-full text-left p-3 hover:bg-amber-50/60 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="font-mono font-bold text-xs text-slate-900 truncate">
                          {b.batchNumber}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{b.product?.brandName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Exp: {format(new Date(b.expiryDate), "MMM dd, yyyy")} • {b.quantity} in stock
                        </p>
                      </div>
                      {b.supplier && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
                          {b.supplier}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {!searching && results.length === 0 && query.trim().length >= 2 && (
                <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <PackageSearch className="w-3.5 h-3.5" />
                  No batches match &quot;{query.trim()}&quot;. Check the batch number and try again.
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-mono font-bold text-xs text-slate-900 truncate">
                    {selectedBatch.batchNumber}
                  </span>
                  {selectedBatch.supplier && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      {selectedBatch.supplier}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBatch(null)}
                  className="text-[10px] font-semibold text-slate-400 hover:text-amber-700 transition-colors"
                >
                  Change
                </button>
              </div>
              <p className="text-xs font-semibold text-slate-800">{selectedBatch.product?.brandName}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Exp: {format(new Date(selectedBatch.expiryDate), "MMM dd, yyyy")}</span>
                <span>
                  Balance:{" "}
                  <span className="font-bold text-slate-900">{selectedBatch.quantity} units</span>
                </span>
              </div>
            </div>
          )}

          {/* Reason Type */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Adjustment Reason Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setType(opt.id)}
                  className={`p-2 rounded-xl border text-left text-xs transition-all ${
                    type === opt.id
                      ? "bg-amber-50 border-amber-600 text-amber-900 font-semibold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <p className="font-bold text-xs">{opt.label}</p>
                  <p className="text-[10px] text-slate-400">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Direction toggle for counting errors */}
          {type === "CORRECTION" && (
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: "DEDUCT", label: "Reduce Stock", icon: Minus },
                  { id: "ADD", label: "Add Stock", icon: Plus },
                ] as const
              ).map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setDirection(opt.id)}
                  className={`p-2 rounded-xl border text-xs flex items-center justify-center gap-1.5 transition-all ${
                    direction === opt.id
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <opt.icon className="w-3.5 h-3.5" />
                  <span className="font-semibold">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Quantity Affected <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Audit Explanation & Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder={
                type === "RETURN_TO_SUPPLIER"
                  ? "e.g. Batch returned to supplier for damaged packaging / recall / short-dated stock..."
                  : type === "EXPIRED"
                  ? "e.g. Expired stock discarded from shelf during expiry date check..."
                  : "Detail why this inventory adjustment is being logged (e.g. broken vial during handling, physical recount mismatch)..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedBatch}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-sm shadow-amber-600/20 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>{isPending ? "Logging..." : "Confirm Stock Adjustment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
