"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, ShoppingCart, Clock, Menu } from "lucide-react";
import { SessionUser } from "@/lib/types";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface AppHeaderProps {
  user: SessionUser;
  totalAlerts?: number;
  onOpenMobileMenu?: () => void;
}

export function AppHeader({ user, totalAlerts = 0, onOpenMobileMenu }: AppHeaderProps) {
  const [time, setTime] = useState<string>("");

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
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer shrink-0"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="overflow-hidden">
          <h1 className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="truncate">{user.name}</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block truncate">
            {new Date().toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
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

        {/* Fast POS Launch button */}
        <Link
          href="/pos"
          className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all shadow-emerald-600/20 active:scale-95"
          title="Launch POS Terminal"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">POS Checkout</span>
          <span className="sm:hidden font-bold">POS</span>
        </Link>
      </div>
    </header>
  );
}
