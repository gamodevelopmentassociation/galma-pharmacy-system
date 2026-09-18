"use client";

import { useState, useTransition, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Percent,
  Receipt,
  Download,
  Eye,
  Sparkles,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  UserCheck,
  CreditCard,
  Package,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { PharmacySettings, SessionUser } from "@/lib/types";
import { getConsolidatedFinancialReport } from "@/actions/reports";
import { format } from "date-fns";
import { ReceiptModal } from "@/components/pos/ReceiptModal";

interface CashierOption {
  id: string;
  name: string;
  role: string;
}

interface FinancialDashboardProps {
  initialReport: any;
  cashiers?: CashierOption[];
  settings: PharmacySettings;
  user: SessionUser;
}

const COLORS = ["#10b981", "#0284c7", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6", "#6366f1"];

export function FinancialDashboard({
  initialReport,
  cashiers = [],
  settings,
  user,
}: FinancialDashboardProps) {
  const [report, setReport] = useState<any>(initialReport || {});
  const [activePreset, setActivePreset] = useState<"today" | "week" | "month" | "all" | "custom">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [cashierFilter, setCashierFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [selectedSaleForView, setSelectedSaleForView] = useState<any | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleApplyFilter = () => {
    setActivePreset("custom");
    startTransition(async () => {
      const data = await getConsolidatedFinancialReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        cashierId: cashierFilter !== "ALL" ? cashierFilter : undefined,
        paymentMethod: paymentFilter !== "ALL" ? paymentFilter : undefined,
      });
      setReport(data);
    });
  };

  const handlePreset = (preset: "today" | "week" | "month" | "all") => {
    setActivePreset(preset);
    const now = new Date();
    // Use local YYYY-MM-DD
    const pad = (n: number) => String(n).padStart(2, "0");
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    let s = "";
    let e = todayStr;

    if (preset === "today") {
      s = todayStr;
      e = todayStr;
    } else if (preset === "week") {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      s = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    } else if (preset === "month") {
      s = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    } else if (preset === "all") {
      s = "";
      e = "";
    }

    setStartDate(s);
    setEndDate(e);

    startTransition(async () => {
      const data = await getConsolidatedFinancialReport({
        startDate: s || undefined,
        endDate: e || undefined,
        cashierId: cashierFilter !== "ALL" ? cashierFilter : undefined,
        paymentMethod: paymentFilter !== "ALL" ? paymentFilter : undefined,
      });
      setReport(data);
    });
  };

  // Full CSV Export utility
  const exportToCSV = () => {
    const headers = [
      "Invoice Number",
      "Date & Time",
      "Customer",
      "Cashier",
      "Payment Method",
      "Gross Subtotal",
      "Discount",
      "Tax",
      "Total Amount",
    ];

    const salesList = report.allFilteredSales || report.recentSales || [];
    const rows = salesList.map((s: any) => {
      let dateStr = "";
      try {
        dateStr = format(new Date(s.createdAt), "yyyy-MM-dd HH:mm:ss");
      } catch {
        dateStr = String(s.createdAt);
      }

      return [
        `"${s.invoiceNumber || ""}"`,
        `"${dateStr}"`,
        `"${(s.customerName || "Walk-in").replace(/"/g, '""')}"`,
        `"${(s.cashier?.name || "Cashier").replace(/"/g, '""')}"`,
        `"${s.paymentMethod || "CASH"}"`,
        Number(s.subtotal || 0).toFixed(2),
        Number(s.discount || 0).toFixed(2),
        Number(s.tax || 0).toFixed(2),
        Number(s.totalAmount || 0).toFixed(2),
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Galma_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const kpis = report?.kpis || {
    totalRevenue: 0,
    netSales: 0,
    grossSales: 0,
    totalCOGS: 0,
    grossProfit: 0,
    profitMargin: 0,
    totalTax: 0,
    totalDiscount: 0,
    transactionCount: 0,
    averageOrderValue: 0,
    inventoryValuationCost: 0,
    inventoryValuationRetail: 0,
    potentialInventoryProfit: 0,
  };

  const salesTrend = report?.salesTrend || [];
  const topProducts = report?.topProducts || [];
  const paymentBreakdown = report?.paymentBreakdown || [];
  const categoryBreakdown = report?.categoryBreakdown || [];
  const recentSales = report?.recentSales || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Consolidated Financials & Revenue Analytics</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Executive
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified sales volume, profit margins, cost of goods sold, and tax reporting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Presets */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: "today", label: "Today" },
            { id: "week", label: "7 Days" },
            { id: "month", label: "This Month" },
            { id: "all", label: "All Time" },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => handlePreset(p.id as any)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activePreset === p.id
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date Inputs & Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset("custom");
              }}
              className="bg-transparent text-slate-700 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset("custom");
              }}
              className="bg-transparent text-slate-700 focus:outline-hidden"
            />
          </div>

          {cashiers.length > 0 && (
            <select
              value={cashierFilter}
              onChange={(e) => setCashierFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Staff</option>
              {cashiers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role})
                </option>
              ))}
            </select>
          )}

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="CASH">Cash</option>
            <option value="MOBILE_MONEY">Mobile Money / Telebirr</option>
            <option value="CARD">Card</option>
            <option value="CREDIT">Credit</option>
          </select>

          <button
            onClick={handleApplyFilter}
            disabled={isPending}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Filtering..." : "Apply"}
          </button>
        </div>
      </div>

      {/* Primary Financial KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue / Total Invoiced */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Billed / Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {settings.currencySymbol} {kpis.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{kpis.transactionCount} completed sales</span>
          </div>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cost of Goods (COGS)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {settings.currencySymbol} {kpis.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Acquisition cost of sold stock</p>
        </div>

        {/* True Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs bg-gradient-to-b from-white to-emerald-50/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Gross Profit
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            {settings.currencySymbol} {kpis.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] font-semibold text-emerald-800 mt-1">
            Profit Margin: {kpis.profitMargin}%
          </p>
        </div>

        {/* Inventory Asset Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory Asset Value</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {settings.currencySymbol} {kpis.inventoryValuationRetail.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Cost Base: {settings.currencySymbol} {kpis.inventoryValuationCost.toLocaleString()} (Margin: +{settings.currencySymbol} {kpis.potentialInventoryProfit.toLocaleString()})
          </p>
        </div>
      </div>

      {/* Secondary Quick Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
        <div className="bg-white p-3 rounded-xl border border-slate-200/70">
          <span className="text-slate-400 block text-[11px]">Net Merchandise Sales</span>
          <span className="font-bold text-slate-900 text-sm">
            {settings.currencySymbol} {kpis.netSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/70">
          <span className="text-slate-400 block text-[11px]">Total Discounts Granted</span>
          <span className="font-bold text-amber-600 text-sm">
            {settings.currencySymbol} {kpis.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/70">
          <span className="text-slate-400 block text-[11px]">Tax Collected ({settings.taxRate}%)</span>
          <span className="font-bold text-slate-900 text-sm">
            {settings.currencySymbol} {kpis.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/70">
          <span className="text-slate-400 block text-[11px]">Average Ticket Size</span>
          <span className="font-bold text-slate-900 text-sm">
            {settings.currencySymbol} {kpis.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Charts Section: Revenue Trajectory & Payment Settlement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Profit Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Revenue & Profit Trajectory</h2>
              <p className="text-xs text-slate-400">Daily net merchandise sales and gross profit</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {!isMounted || salesTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {!isMounted ? "Loading charts..." : "No trend data recorded for selected timeframe"}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      border: "none",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Net Sales"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Gross Profit"
                    stroke="#0284c7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Payment Breakdown</h2>
            <p className="text-xs text-slate-400">Distribution by settlement channel</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {!isMounted || paymentBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400">No payment transactions recorded</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => `${settings.currencySymbol} ${Number(val).toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {paymentBreakdown.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span>{item.name}</span>
                </span>
                <span className="font-bold text-slate-900">
                  {settings.currencySymbol} {Number(item.value).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Performance & Top Medications Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Category Revenue Performance</h2>
              <p className="text-xs text-slate-400">Sales volume and gross revenue by pharmaceutical form</p>
            </div>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No category sales recorded
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-48 w-full">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryBreakdown.slice(0, 6)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <Tooltip
                        formatter={(val: any) => `${settings.currencySymbol} ${Number(val).toFixed(2)}`}
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          color: "#fff",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                {categoryBreakdown.slice(0, 4).map((c: any, idx: number) => (
                  <div key={idx} className="p-2 bg-slate-50 rounded-xl text-xs">
                    <span className="font-bold text-slate-900 block truncate">{c.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {settings.currencySymbol} {c.revenue.toFixed(2)} ({c.quantity} sold)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Performing Drugs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-0.5">Top Selling Medications</h2>
          <p className="text-xs text-slate-400 mb-3">Ranked by gross revenue and gross margin</p>

          <div className="divide-y divide-slate-100">
            {topProducts.length === 0 ? (
              <p className="p-8 text-xs text-slate-400 text-center">No sales recorded yet</p>
            ) : (
              topProducts.slice(0, 6).map((p: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{p.brandName}</p>
                      <p className="text-[10px] text-slate-400">{p.genericName}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-xs block">
                      {settings.currencySymbol} {p.revenue.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      {p.quantity} units sold (+{settings.currencySymbol} {p.profit.toFixed(2)} profit)
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Sales Invoices</h2>
            <p className="text-xs text-slate-400">Detailed transaction ledger for the selected filter</p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {recentSales.length} invoice(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Invoice</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Cashier</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3 text-right">Subtotal</th>
                <th className="py-2.5 px-3 text-right">Total Paid</th>
                <th className="py-2.5 px-3 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No transactions found for the specified criteria.
                  </td>
                </tr>
              ) : (
                recentSales.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {s.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {format(new Date(s.createdAt), "MMM dd, yyyy HH:mm")}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {s.customerName || "Walk-in Customer"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {s.cashier?.name || "Staff"}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {s.paymentMethod?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {settings.currencySymbol} {s.subtotal.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      {settings.currencySymbol} {s.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedSaleForView(s)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="View & Print Receipt"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt View Modal */}
      {selectedSaleForView && (
        <ReceiptModal
          sale={selectedSaleForView}
          settings={settings}
          onClose={() => setSelectedSaleForView(null)}
        />
      )}
    </div>
  );
}
