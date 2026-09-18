"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ShoppingCart, Clock, Plus } from "lucide-react";
import { SessionUser } from "@/lib/types";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AddProductModal } from "@/components/inventory/AddProductModal";
import { toast } from "sonner";

interface AppHeaderProps {
  user: SessionUser;
  totalAlerts?: number;
}

export function AppHeader({ user, totalAlerts = 0 }: AppHeaderProps) {
  const router = useRouter();
  const [time, setTime] = useState<string>("");
  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false);
  const canAddMedication = user.role === "ADMIN" || user.role === "PHARMACIST";

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTime(
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <span>Welcome back, {user.name}</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-500">
            {new Date().toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Visual Theme Switcher */}
        <ThemeToggle />

        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-mono text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{time || "--:--:--"}</span>
        </div>

        {/* Stock Alert Badge */}
        {user.role !== "CASHIER" && (
          <Link
            href="/inventory?tab=near-expiry"
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title={`${totalAlerts} Stock / Expiry Alerts`}
          >
            <Bell className="w-4 h-4" />
            {totalAlerts > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {totalAlerts}
              </span>
            )}
          </Link>
        )}

        {/* Quick Add Medication Button */}
        {canAddMedication && (
          <button
            type="button"
            onClick={() => setIsAddMedicationOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Register new medication & lot"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Medication</span>
          </button>
        )}

        {/* Fast POS Launch button */}
        <Link
          href="/pos"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all shadow-emerald-600/20 active:scale-95"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>POS Checkout</span>
        </Link>
      </div>

      {/* Add Medication Modal */}
      <AddProductModal
        isOpen={isAddMedicationOpen}
        onClose={() => setIsAddMedicationOpen(false)}
        onSuccess={() => {
          setIsAddMedicationOpen(false);
          toast.success("Medication registered successfully!");
          router.refresh();
        }}
      />
    </header>
  );
}
