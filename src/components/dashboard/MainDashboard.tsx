"use client";

import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  AlertOctagon,
  ShoppingCart,
  Receipt,
  Users,
  ArrowRight,
  Sparkles,
  BarChart3,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { PharmacySettings, SessionUser } from "@/lib/types";
import { format } from "date-fns";

interface MainDashboardProps {
  kpis: any;
  alerts: any;
  recentSales: any[];
  settings: PharmacySettings;
  user: SessionUser;
}

export function MainDashboard({ kpis, alerts, recentSales, settings, user }: MainDashboardProps) {
  const isAdmin = user.role === "ADMIN";
  const isPharmacist = user.role === "PHARMACIST";

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-emerald-200 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Clinical & Pharmacy Management System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {settings.pharmacyName}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 leading-relaxed">
            Role: <span className="font-semibold text-white">{user.role}</span> | Active Session:{" "}
            <span className="text-white">{user.name}</span>
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Link
              href="/pos"
              className="px-5 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition-all shadow-md flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-700" />
              <span>Launch POS Terminal</span>
            </Link>

            {isAdmin && (
              <Link
                href="/reports"
                className="px-4 py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-900/80 border border-white/20 text-white font-semibold text-xs transition-all flex items-center gap-1.5"
              >
                <BarChart3 className="w-4 h-4 text-emerald-300" />
                <span>Consolidated Financials</span>
              </Link>
            )}

            {isPharmacist && (
              <Link
                href="/inventory"
                className="px-4 py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-900/80 border border-white/20 text-white font-semibold text-xs transition-all flex items-center gap-1.5"
              >
                <Package className="w-4 h-4 text-emerald-300" />
                <span>Inventory & Batches</span>
              </Link>
            )}
          </div>
        </div>

        {/* Ambient decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-40 -top-10 w-48 h-48 rounded-full bg-teal-400/20 blur-2xl pointer-events-none" />
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isAdmin ? (
          <>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Gross Revenue</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {settings.currencySymbol} {kpis.totalRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                {kpis.transactionCount || 0} invoices settled
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs bg-gradient-to-b from-white to-emerald-50/20">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  Net Profit
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-700">
                {settings.currencySymbol} {kpis.grossProfit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}
              </p>
              <p className="text-[11px] font-bold text-emerald-800 mt-1">
                {kpis.profitMargin || 0}% Profit Margin
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Sales Invoices</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{kpis.transactionCount || 0}</p>
              <p className="text-[11px] text-slate-400 mt-1">Processed transactions</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {settings.currencySymbol} {kpis.totalRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Total revenue collected</p>
            </div>
          </>
        )}

        {/* Low Stock Counter */}
        <Link
          href="/inventory?tab=low-stock"
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-300 transition-all block group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Warnings</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700">{alerts.lowStockItems?.length || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-amber-700">
            <span>Items below threshold</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        {/* Expiry Counter */}
        <Link
          href="/inventory?tab=near-expiry"
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-rose-300 transition-all block group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Near Expiry / Expired</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-700">
            {(alerts.expired?.length || 0) + (alerts.urgent30?.length || 0) + (alerts.near60?.length || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-rose-700">
            <span>Batches requiring review</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Link>
      </div>

      {/* Grid: Expiry Alert Feed & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Expiry & Stock Action Feed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-bold text-slate-900">Critical Stock & Expiry Action Items</h2>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {alerts.urgent30?.length === 0 && alerts.lowStockItems?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                All medications are well stocked and safely within expiration validity!
              </p>
            ) : (
              <>
                {alerts.urgent30?.map((b: any) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-900">{b.product?.brandName}</span>
                        <span className="text-[9px] font-mono font-bold bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded">
                          BN: {b.batchNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        Expires: {format(new Date(b.expiryDate), "MMM dd, yyyy")} ({b.quantity} units remaining)
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-600 text-white font-bold text-[10px] rounded-full">
                      Urgent (&le;30d)
                    </span>
                  </div>
                ))}

                {alerts.lowStockItems?.slice(0, 3).map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-900">{item.brandName}</span>
                        <span className="text-[10px] text-amber-800">({item.category})</span>
                      </div>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Current stock: <span className="font-bold">{item.totalStock}</span> {item.unit} (Reorder level: {item.reorderLevel})
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold text-[10px] rounded-full">
                      Low Stock
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Latest Sales Invoices</h2>
            </div>
            <Link
              href="/invoices"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>All Invoices</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentSales.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No sales registered yet.</p>
            ) : (
              recentSales.slice(0, 5).map((sale: any) => (
                <div key={sale.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-[11px]">
                        {sale.invoiceNumber}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-bold">
                        {sale.paymentMethod}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {sale.customerName || "Walk-in"} • {format(new Date(sale.createdAt), "MMM dd, HH:mm")}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-xs block">
                      {settings.currencySymbol} {sale.totalAmount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {sale.items?.length || 1} item(s)
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
