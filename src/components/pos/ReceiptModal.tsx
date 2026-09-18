"use client";

import Image from "next/image";
import { Printer, X, CheckCircle2 } from "lucide-react";
import { PharmacySettings } from "@/lib/types";

interface ReceiptModalProps {
  sale: any;
  settings: PharmacySettings;
  onClose: () => void;
  isNewSale?: boolean;
}

export function ReceiptModal({ sale, settings, onClose, isNewSale = false }: ReceiptModalProps) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.createdAt || new Date()).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Modal Action Bar (Hidden when printing) */}
        <div className="no-print bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{isNewSale ? "Sale Completed Successfully" : "Official Sales Receipt"}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Container */}
        <div id="printable-receipt" className="p-6 text-slate-800 text-xs font-mono bg-white">
          {/* Header with Logo */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <div className="flex justify-center mb-2">
              <Image
                src="/logo.png"
                alt="Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 font-sans uppercase">
              {settings.pharmacyName}
            </h2>
            <p className="text-[11px] text-slate-500 font-sans">{settings.tagline}</p>
            <p className="text-[11px] text-slate-600 mt-1">{settings.address}</p>
            <p className="text-[11px] text-slate-600">Tel: {settings.phone} | Email: {settings.email}</p>
          </div>

          {/* Invoice Meta */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice No:</span>
              <span className="font-bold text-slate-900">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date/Time:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span>{sale.cashier?.name || "Cashier"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-medium">{sale.customerName || "Walk-in Customer"}</span>
            </div>
            {sale.customerPhone && (
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span>{sale.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Payment:</span>
              <span className="font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 text-[10px]">
                {sale.paymentMethod?.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Purchased Items Table */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <div className="grid grid-cols-12 font-bold text-slate-700 pb-1.5 border-b border-slate-200">
              <span className="col-span-6">Item / Drug</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Total</span>
            </div>
            <div className="divide-y divide-slate-100 pt-1.5 space-y-1.5">
              {sale.items?.map((item: any, idx: number) => (
                <div key={idx} className="grid grid-cols-12 items-center text-[11px] pt-1">
                  <div className="col-span-6 pr-1">
                    <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{item.genericName}</p>
                    {item.batch?.batchNumber && (
                      <p className="text-[9px] text-slate-400">BN: {item.batch.batchNumber}</p>
                    )}
                  </div>
                  <span className="col-span-2 text-center font-medium">{item.quantity}</span>
                  <span className="col-span-2 text-right">{Number(item.unitPrice || 0).toFixed(2)}</span>
                  <span className="col-span-2 text-right font-bold">
                    {(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Calculation Summary */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>
                {settings.currencySymbol} {Number(sale.subtotal || 0).toFixed(2)}
              </span>
            </div>
            {Number(sale.discount || 0) > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount Applied:</span>
                <span>
                  - {settings.currencySymbol} {Number(sale.discount || 0).toFixed(2)}
                </span>
              </div>
            )}
            {Number(sale.tax || 0) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax ({settings.taxRate}%):</span>
                <span>
                  {settings.currencySymbol} {Number(sale.tax || 0).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>GRAND TOTAL:</span>
              <span className="text-emerald-700">
                {settings.currencySymbol} {Number(sale.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Barcode / Footer */}
          <div className="pt-4 text-center space-y-2">
            <div className="flex justify-center items-center py-1">
              <div className="tracking-[4px] font-bold text-sm bg-slate-100 px-4 py-1.5 rounded border border-slate-200">
                *{sale.invoiceNumber}*
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-sans italic">
              {settings.receiptFooter}
            </p>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden on Print) */}
        <div className="no-print bg-slate-50 border-t border-slate-200 p-4 flex justify-between gap-3">
          <button
            onClick={onClose}
            className="w-1/2 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {isNewSale ? "Start New Sale" : "Close"}
          </button>
          <button
            onClick={handlePrint}
            className="w-1/2 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs shadow-emerald-600/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
}
