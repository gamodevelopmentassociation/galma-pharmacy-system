"use client";

import { useState, useTransition } from "react";
import { X, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { adjustStockAction, StockAdjustmentInput } from "@/actions/inventory";

interface StockAdjustmentModalProps {
  batch: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function StockAdjustmentModal({ batch, onClose, onSuccess }: StockAdjustmentModalProps) {
  const [type, setType] = useState<"DAMAGED" | "EXPIRED" | "RETURNED" | "CORRECTION">("DAMAGED");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!batch) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Please enter a valid audit explanation reason for this adjustment.");
      return;
    }

    // Determine sign: Damaged and Expired reduce stock (negative). Returned and Correction can be positive or negative.
    let adjustedQty = Math.abs(quantity);
    if (type === "DAMAGED" || type === "EXPIRED") {
      adjustedQty = -adjustedQty;
    }

    if (adjustedQty < 0 && Math.abs(adjustedQty) > batch.quantity) {
      toast.error(`Cannot deduct ${Math.abs(adjustedQty)} units. Batch balance is only ${batch.quantity}.`);
      return;
    }

    const payload: StockAdjustmentInput = {
      batchId: batch.id,
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
              <h2 className="text-sm font-bold text-slate-900">Log Stock Adjustment / Waste</h2>
              <p className="text-xs text-slate-500 truncate max-w-xs">
                {batch.product?.brandName || "Drug"} (Batch: {batch.batchNumber})
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
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">Current Batch Balance:</span>
            <span className="font-bold text-slate-900">{batch.quantity} units</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Adjustment Reason Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "DAMAGED", label: "Broken / Damaged", desc: "Reduces stock" },
                { id: "EXPIRED", label: "Expired & Discarded", desc: "Reduces stock" },
                { id: "RETURNED", label: "Customer Return", desc: "Adds to stock" },
                { id: "CORRECTION", label: "Audit Count Error", desc: "Reconciliation" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setType(opt.id as any)}
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
              placeholder="Detail why this inventory adjustment is being logged (e.g. broken vial during handling, manufacturer recall)..."
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
              disabled={isPending}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-sm shadow-amber-600/20 flex items-center gap-1.5"
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
