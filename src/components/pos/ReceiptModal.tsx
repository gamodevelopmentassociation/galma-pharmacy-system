"use client";

import { useState } from "react";
import Image from "next/image";
import { Printer, X, CheckCircle2, FileText, Download, Receipt as ReceiptIcon } from "lucide-react";
import { PharmacySettings } from "@/lib/types";

interface ReceiptModalProps {
  sale: any;
  settings: PharmacySettings;
  onClose: () => void;
  isNewSale?: boolean;
}

export function ReceiptModal({ sale, settings, onClose, isNewSale = false }: ReceiptModalProps) {
  const [formatMode, setFormatMode] = useState<"a4" | "thermal">("a4");

  if (!sale) return null;

  const formattedDate = new Date(sale.createdAt || new Date()).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadA4PDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    const itemsHtml = (sale.items || [])
      .map(
        (item: any, idx: number) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
            <strong style="color: #0f172a; font-size: 13px;">${item.productName || "Item"}</strong>
            <div style="font-size: 11px; color: #64748b;">${item.genericName || ""}</div>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px; color: #334155;">
            ${item.batch?.batchNumber || "N/A"}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
            ${item.batch?.expiryDate ? new Date(item.batch.expiryDate).toLocaleDateString() : "N/A"}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 500;">
            ${Number(item.unitPrice || 0).toFixed(2)}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 600;">
            ${item.quantity}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a;">
            ${(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)}
          </td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice-${sale.invoiceNumber}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            body {
              background: #fff;
              color: #1e293b;
              font-size: 12px;
              line-height: 1.5;
              padding: 20px;
            }
            .header-table {
              width: 100%;
              border-bottom: 2px solid #059669;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }
            .pharmacy-title {
              font-size: 22px;
              font-weight: 800;
              color: #064e3b;
              text-transform: uppercase;
              letter-spacing: -0.5px;
            }
            .pharmacy-tagline {
              font-size: 11px;
              color: #059669;
              font-weight: 600;
              margin-bottom: 4px;
            }
            .pharmacy-info {
              font-size: 11px;
              color: #64748b;
            }
            .invoice-badge {
              background: #ecfdf5;
              border: 1px solid #a7f3d0;
              color: #065f46;
              padding: 6px 14px;
              border-radius: 8px;
              display: inline-block;
              font-size: 14px;
              font-weight: 800;
              letter-spacing: 1px;
            }
            .meta-section {
              width: 100%;
              margin-bottom: 24px;
            }
            .meta-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px 16px;
            }
            .meta-card h4 {
              font-size: 11px;
              text-transform: uppercase;
              color: #64748b;
              font-weight: 700;
              margin-bottom: 6px;
              letter-spacing: 0.5px;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin-bottom: 3px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .items-table th {
              background: #f1f5f9;
              color: #334155;
              font-weight: 700;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 10px 8px;
              border-top: 1px solid #cbd5e1;
              border-bottom: 2px solid #cbd5e1;
            }
            .totals-container {
              width: 100%;
              display: flex;
              justify-content: flex-end;
              margin-bottom: 30px;
            }
            .totals-table {
              width: 320px;
              border-collapse: collapse;
            }
            .totals-table td {
              padding: 6px 8px;
              font-size: 12px;
            }
            .grand-total {
              background: #ecfdf5;
              border-top: 2px solid #059669;
              border-bottom: 2px solid #059669;
              font-size: 15px !important;
              font-weight: 800;
              color: #064e3b;
            }
            .footer-section {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px dashed #cbd5e1;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .terms-box {
              max-width: 380px;
              font-size: 10px;
              color: #64748b;
              line-height: 1.4;
            }
            .signature-box {
              text-align: center;
              width: 220px;
            }
            .signature-line {
              border-top: 1px solid #94a3b8;
              margin-top: 40px;
              padding-top: 4px;
              font-size: 11px;
              font-weight: 600;
              color: #334155;
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td style="vertical-align: top;">
                <div class="pharmacy-title">${settings.pharmacyName}</div>
                <div class="pharmacy-tagline">${settings.tagline}</div>
                <div class="pharmacy-info">${settings.address}</div>
                <div class="pharmacy-info">Tel: ${settings.phone} | Email: ${settings.email}</div>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <div class="invoice-badge">TAX INVOICE</div>
                <div style="font-family: monospace; font-size: 14px; font-weight: 700; margin-top: 6px; color: #0f172a;">
                  #${sale.invoiceNumber}
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                  Date: ${formattedDate}
                </div>
              </td>
            </tr>
          </table>

          <table class="meta-section">
            <tr>
              <td style="width: 50%; padding-right: 10px; vertical-align: top;">
                <div class="meta-card">
                  <h4>Billed To (Customer / Patient)</h4>
                  <div class="meta-row"><strong>Name:</strong> <span>${sale.customerName || "Walk-in Customer"}</span></div>
                  ${sale.customerPhone ? `<div class="meta-row"><strong>Phone:</strong> <span>${sale.customerPhone}</span></div>` : ""}
                  <div class="meta-row"><strong>Payment Status:</strong> <span style="color: #059669; font-weight: 700;">${sale.paymentStatus || "PAID"}</span></div>
                </div>
              </td>
              <td style="width: 50%; padding-left: 10px; vertical-align: top;">
                <div class="meta-card">
                  <h4>Transaction & Dispensing Meta</h4>
                  <div class="meta-row"><strong>Cashier / Pharmacist:</strong> <span>${sale.cashier?.name || "Cashier"}</span></div>
                  <div class="meta-row"><strong>Payment Method:</strong> <span>${sale.paymentMethod?.replace("_", " ") || "CASH"}</span></div>
                  <div class="meta-row"><strong>Currency:</strong> <span>${settings.currency} (${settings.currencySymbol})</span></div>
                </div>
              </td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 4%;">#</th>
                <th style="width: 36%;">Medication / Item</th>
                <th style="width: 14%;">Batch No.</th>
                <th style="width: 12%;">Expiry</th>
                <th style="width: 12%; text-align: right;">Unit Price</th>
                <th style="width: 8%; text-align: center;">Qty</th>
                <th style="width: 14%; text-align: right;">Total (${settings.currencySymbol})</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals-container">
            <table class="totals-table">
              <tr>
                <td style="color: #64748b;">Subtotal:</td>
                <td style="text-align: right; font-weight: 600;">${settings.currencySymbol} ${Number(sale.subtotal || 0).toFixed(2)}</td>
              </tr>
              ${
                Number(sale.discount || 0) > 0
                  ? `<tr>
                      <td style="color: #059669;">Discount Applied:</td>
                      <td style="text-align: right; color: #059669; font-weight: 600;">- ${settings.currencySymbol} ${Number(sale.discount || 0).toFixed(2)}</td>
                    </tr>`
                  : ""
              }
              ${
                Number(sale.tax || 0) > 0
                  ? `<tr>
                      <td style="color: #64748b;">VAT / Tax (${settings.taxRate}%):</td>
                      <td style="text-align: right; font-weight: 600;">${settings.currencySymbol} ${Number(sale.tax || 0).toFixed(2)}</td>
                    </tr>`
                  : ""
              }
              <tr class="grand-total">
                <td>GRAND TOTAL:</td>
                <td style="text-align: right;">${settings.currencySymbol} ${Number(sale.totalAmount || 0).toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="footer-section">
            <div class="terms-box">
              <strong style="color: #334155;">Terms & Conditions:</strong><br/>
              • Medicines once sold cannot be returned or exchanged without prior authorization.<br/>
              • Please verify medications, strength, and expiration date before leaving.<br/>
              • ${settings.receiptFooter || "Thank you for trusting us with your health care needs."}
            </div>
            <div class="signature-box">
              <div class="signature-line">Authorized Pharmacist Signature & Stamp</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-slate-200 transition-all ${
          formatMode === "a4" ? "max-w-3xl" : "max-w-md"
        }`}
      >
        {/* Modal Action Bar (Hidden on Print) */}
        <div className="no-print bg-slate-50 border-b border-slate-200 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{isNewSale ? "Sale Completed Successfully" : "Official Sales Receipt"}</span>
          </div>

          {/* Format Toggle */}
          <div className="inline-flex rounded-xl bg-slate-200/80 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFormatMode("a4")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                formatMode === "a4"
                  ? "bg-white text-emerald-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>A4 PDF Invoice</span>
            </button>
            <button
              type="button"
              onClick={() => setFormatMode("thermal")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                formatMode === "thermal"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ReceiptIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Thermal Slip</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadA4PDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Download or Print standard A4 PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>A4 PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Container */}
        <div id="printable-receipt" className="p-6 bg-white overflow-y-auto max-h-[75vh]">
          {formatMode === "a4" ? (
            /* ================= FULL A4 TAX INVOICE PREVIEW ================= */
            <div className="space-y-5 text-slate-800 font-sans text-xs">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b-2 border-emerald-600 gap-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={52}
                    height={52}
                    className="object-contain"
                  />
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-emerald-900 uppercase">
                      {settings.pharmacyName}
                    </h2>
                    <p className="text-xs font-semibold text-emerald-600">{settings.tagline}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{settings.address}</p>
                    <p className="text-[11px] text-slate-500">
                      Tel: {settings.phone} | Email: {settings.email}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 font-extrabold text-xs tracking-wider border border-emerald-200">
                    TAX INVOICE
                  </span>
                  <div className="font-mono font-bold text-sm text-slate-900 mt-1">
                    #{sale.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Date: {formattedDate}</div>
                </div>
              </div>

              {/* Two Column Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Billed To (Customer / Patient)
                  </span>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Customer Name:</span>
                    <span className="font-bold text-slate-900">{sale.customerName || "Walk-in Customer"}</span>
                  </div>
                  {sale.customerPhone && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">Phone Number:</span>
                      <span className="text-slate-700">{sale.customerPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Payment Status:</span>
                    <span className="font-bold text-emerald-600">{sale.paymentStatus || "PAID"}</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Dispensing Details
                  </span>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Cashier / Pharmacist:</span>
                    <span className="font-bold text-slate-900">{sale.cashier?.name || "Cashier"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Payment Method:</span>
                    <span className="font-bold text-slate-800">
                      {sale.paymentMethod?.replace("_", " ") || "CASH"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Currency:</span>
                    <span className="font-medium text-slate-700">
                      {settings.currency} ({settings.currencySymbol})
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-8">#</th>
                      <th className="py-2.5 px-3">Medication / Prescription</th>
                      <th className="py-2.5 px-3">Batch No.</th>
                      <th className="py-2.5 px-3">Expiry</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Total ({settings.currencySymbol})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sale.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <p className="font-bold text-slate-900">{item.productName}</p>
                          <p className="text-[10px] text-slate-500">{item.genericName}</p>
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                          {item.batch?.batchNumber || "N/A"}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-500">
                          {item.batch?.expiryDate
                            ? new Date(item.batch.expiryDate).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="py-2 px-3 text-right font-medium">
                          {Number(item.unitPrice || 0).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Summary */}
              <div className="flex justify-end">
                <div className="w-full sm:w-72 space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-medium">
                      {settings.currencySymbol} {Number(sale.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  {Number(sale.discount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount:</span>
                      <span>
                        - {settings.currencySymbol} {Number(sale.discount || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {Number(sale.tax || 0) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>VAT / Tax ({settings.taxRate}%):</span>
                      <span className="font-medium">
                        {settings.currencySymbol} {Number(sale.tax || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-300">
                    <span>GRAND TOTAL:</span>
                    <span className="text-emerald-700">
                      {settings.currencySymbol} {Number(sale.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer & Signature */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-[11px] text-slate-500">
                <div className="max-w-sm space-y-1">
                  <p className="font-bold text-slate-700">Notice:</p>
                  <p>• Medicines once dispensed cannot be returned without original cash invoice.</p>
                  <p>• Please store medicines according to prescribed temperature requirements.</p>
                  <p className="italic text-emerald-700 font-medium mt-1">
                    {settings.receiptFooter || "Wishing you good health and a speedy recovery!"}
                  </p>
                </div>

                <div className="text-center sm:text-right w-full sm:w-auto">
                  <div className="border-t border-slate-400 pt-1.5 w-48 mx-auto sm:ml-auto font-semibold text-slate-700">
                    Authorized Pharmacist
                  </div>
                  <span className="text-[10px] text-slate-400">Signature & Official Stamp</span>
                </div>
              </div>
            </div>
          ) : (
            /* ================= COMPACT THERMAL SLIP PREVIEW ================= */
            <div className="text-slate-800 text-xs font-mono">
              <div className="text-center pb-4 border-b border-dashed border-slate-300">
                <div className="flex justify-center mb-2">
                  <Image src="/logo.png" alt="Logo" width={44} height={44} className="object-contain" />
                </div>
                <h2 className="text-base font-bold tracking-tight text-slate-900 font-sans uppercase">
                  {settings.pharmacyName}
                </h2>
                <p className="text-[11px] text-slate-500 font-sans">{settings.tagline}</p>
                <p className="text-[11px] text-slate-600 mt-1">{settings.address}</p>
                <p className="text-[11px] text-slate-600">
                  Tel: {settings.phone} | Email: {settings.email}
                </p>
              </div>

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

              <div className="py-3 border-b border-dashed border-slate-300 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>
                    {settings.currencySymbol} {Number(sale.subtotal || 0).toFixed(2)}
                  </span>
                </div>
                {Number(sale.discount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount:</span>
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

              <div className="pt-4 text-center space-y-2">
                <div className="flex justify-center items-center py-1">
                  <div className="tracking-[4px] font-bold text-sm bg-slate-100 px-4 py-1.5 rounded border border-slate-200">
                    *{sale.invoiceNumber}*
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-sans italic">{settings.receiptFooter}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="no-print bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {isNewSale ? "Start New Sale" : "Close"}
          </button>
          <button
            type="button"
            onClick={handleDownloadA4PDF}
            className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs shadow-emerald-600/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download A4 PDF</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2 text-xs font-semibold text-slate-800 bg-slate-200 rounded-xl hover:bg-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print ({formatMode === "a4" ? "A4" : "Thermal"})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
