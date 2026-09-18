"use client";

import { useState } from "react";
import { Search, Receipt, Eye, Printer, Filter, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { PharmacySettings, SessionUser } from "@/lib/types";
import { ReceiptModal } from "@/components/pos/ReceiptModal";

interface InvoicesListProps {
  sales: any[];
  settings: PharmacySettings;
  user: SessionUser;
}

export function InvoicesList({ sales, settings, user }: InvoicesListProps) {
  const [search, setSearch] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("ALL");
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  const filteredSales = sales.filter((s) => {
    const matchSearch =
      s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (s.cashier?.name && s.cashier.name.toLowerCase().includes(search.toLowerCase()));

    const matchPayment = selectedPayment === "ALL" || s.paymentMethod === selectedPayment;

    return matchSearch && matchPayment;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Sales & Invoicing History</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {sales.length} Invoices
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lookup past transactions, itemized sales receipts, and reprint invoice tickets
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name, cashier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Payment:</span>
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="ALL">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="MOBILE_MONEY">Mobile / Telebirr</option>
            <option value="CARD">Card</option>
            <option value="CREDIT">Credit</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Cashier</th>
              <th className="py-3 px-4">Items</th>
              <th className="py-3 px-4 text-center">Payment</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">No invoices match your search.</p>
                </td>
              </tr>
            ) : (
              filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-slate-900 text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                      {s.invoiceNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {format(new Date(s.createdAt), "MMM dd, yyyy HH:mm")}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{s.customerName || "Walk-in"}</p>
                    {s.customerPhone && <p className="text-[10px] text-slate-400">{s.customerPhone}</p>}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {s.cashier?.name || "Cashier"}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="font-semibold">{s.items?.length || 0} line item(s)</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {s.paymentMethod?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 text-xs">
                    {settings.currencySymbol} {s.totalAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedSale(s)}
                      className="px-3 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors inline-flex items-center gap-1 border border-emerald-200/80"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Modal */}
      {selectedSale && (
        <ReceiptModal
          sale={selectedSale}
          settings={settings}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
}
