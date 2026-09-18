"use client";

import { useTransition } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteProductAction, deleteBatchAction } from "@/actions/inventory";

interface DeleteConfirmModalProps {
  item: {
    type: "PRODUCT" | "BATCH";
    id: string;
    name: string;
    subtext?: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteConfirmModal({ item, onClose, onSuccess }: DeleteConfirmModalProps) {
  const [isPending, startTransition] = useTransition();

  if (!item) return null;

  const handleDelete = () => {
    startTransition(async () => {
      let res;
      if (item.type === "PRODUCT") {
        res = await deleteProductAction(item.id);
      } else {
        res = await deleteBatchAction(item.id);
      }

      if (res.success) {
        toast.success(`${item.name} removed from inventory successfully.`);
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to remove item.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Confirm Deletion
              </h2>
              <p className="text-[11px] text-slate-500">
                {item.type === "PRODUCT" ? "Remove Medication" : "Remove Stock Batch"}
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

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-700 leading-relaxed">
            Are you sure you want to permanently delete{" "}
            <span className="font-bold text-slate-900">{item.name}</span>?
          </p>
          {item.subtext && (
            <p className="text-[11px] text-rose-600 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {item.subtext}
            </p>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm shadow-rose-600/20 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isPending ? "Removing..." : "Delete Permanently"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
