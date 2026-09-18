import { format, differenceInDays } from "date-fns";
import { PharmacySettings, SessionUser } from "./types";

export interface InventoryExportRow {
  sku: string;
  barcode: string;
  brandName: string;
  genericName: string;
  category: string;
  dosageForm: string;
  manufacturer: string;
  unit: string;
  reorderLevel: number;
  productTotalStock: number;
  stockStatus: string;
  batchNumber: string;
  batchQuantity: number;
  purchasePrice: number;
  sellingPrice: number;
  totalCostValuation: number;
  totalRetailValuation: number;
  expiryDate: string;
  daysToExpiry: string | number;
  expiryStatus: string;
  supplier: string;
}

export function generateInventoryCSVRows(products: any[]): {
  rows: InventoryExportRow[];
  totalProducts: number;
  totalBatches: number;
  totalUnits: number;
  totalCostValuation: number;
  totalRetailValuation: number;
} {
  const now = new Date();
  const rows: InventoryExportRow[] = [];
  let totalBatches = 0;
  let totalUnits = 0;
  let totalCostValuation = 0;
  let totalRetailValuation = 0;

  products.forEach((product) => {
    const totalStock =
      product.totalStock ??
      (product.batches || []).reduce((sum: number, b: any) => sum + (b.quantity || 0), 0);
    const stockStatus =
      totalStock === 0
        ? "OUT_OF_STOCK"
        : totalStock <= product.reorderLevel
        ? "LOW_STOCK"
        : "IN_STOCK";

    if (!product.batches || product.batches.length === 0) {
      rows.push({
        sku: product.sku || "N/A",
        barcode: product.barcode || "",
        brandName: product.brandName || "Unknown",
        genericName: product.genericName || "",
        category: product.category || "General",
        dosageForm: product.dosageForm || "",
        manufacturer: product.manufacturer || "",
        unit: product.unit || "Box",
        reorderLevel: product.reorderLevel ?? 15,
        productTotalStock: 0,
        stockStatus: "OUT_OF_STOCK",
        batchNumber: "NO_BATCH",
        batchQuantity: 0,
        purchasePrice: 0,
        sellingPrice: 0,
        totalCostValuation: 0,
        totalRetailValuation: 0,
        expiryDate: "N/A",
        daysToExpiry: "N/A",
        expiryStatus: "N/A",
        supplier: "N/A",
      });
      return;
    }

    product.batches.forEach((batch: any) => {
      totalBatches += 1;
      const batchQty = batch.quantity || 0;
      totalUnits += batchQty;

      const costVal = batchQty * (batch.purchasePrice || 0);
      const retailVal = batchQty * (batch.sellingPrice || 0);
      totalCostValuation += costVal;
      totalRetailValuation += retailVal;

      let expStr = "N/A";
      let daysRemaining: number | string = "N/A";
      let expStatus = "ACTIVE";

      if (batch.expiryDate) {
        const expDate = new Date(batch.expiryDate);
        expStr = format(expDate, "yyyy-MM-dd");
        const diff = differenceInDays(expDate, now);
        daysRemaining = diff;

        if (batchQty === 0) {
          expStatus = "DEPLETED";
        } else if (diff < 0) {
          expStatus = "EXPIRED";
        } else if (diff <= 30) {
          expStatus = "NEAR_EXPIRY";
        } else {
          expStatus = "ACTIVE";
        }
      }

      rows.push({
        sku: product.sku || "N/A",
        barcode: product.barcode || "",
        brandName: product.brandName || "Unknown",
        genericName: product.genericName || "",
        category: product.category || "General",
        dosageForm: product.dosageForm || "",
        manufacturer: product.manufacturer || "",
        unit: product.unit || "Box",
        reorderLevel: product.reorderLevel ?? 15,
        productTotalStock: totalStock,
        stockStatus,
        batchNumber: batch.batchNumber || "N/A",
        batchQuantity: batchQty,
        purchasePrice: batch.purchasePrice || 0,
        sellingPrice: batch.sellingPrice || 0,
        totalCostValuation: costVal,
        totalRetailValuation: retailVal,
        expiryDate: expStr,
        daysToExpiry: daysRemaining,
        expiryStatus: expStatus,
        supplier: batch.supplier || "N/A",
      });
    });
  });

  return {
    rows,
    totalProducts: products.length,
    totalBatches,
    totalUnits,
    totalCostValuation,
    totalRetailValuation,
  };
}

export function downloadInventoryCSV(
  products: any[],
  pharmacyName = "Galma Pharmacy",
  userName = "Staff"
) {
  const {
    rows,
    totalProducts,
    totalBatches,
    totalUnits,
    totalCostValuation,
    totalRetailValuation,
  } = generateInventoryCSVRows(products);

  const escapeCSV = (str: string | number | undefined | null) => {
    if (str === undefined || str === null) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const headers = [
    "SKU",
    "Barcode",
    "Brand Name",
    "Generic Name",
    "Category",
    "Dosage Form",
    "Manufacturer",
    "Packaging Unit",
    "Reorder Level",
    "Product Total Stock",
    "Stock Status",
    "Batch / Lot Number",
    "Batch Quantity",
    "Unit Cost Price (ETB)",
    "Unit Selling Price (ETB)",
    "Batch Cost Valuation (ETB)",
    "Batch Retail Valuation (ETB)",
    "Expiry Date",
    "Days to Expiry",
    "Expiry Status",
    "Supplier",
  ];

  const csvRows = rows.map((r) => [
    escapeCSV(r.sku),
    escapeCSV(r.barcode),
    escapeCSV(r.brandName),
    escapeCSV(r.genericName),
    escapeCSV(r.category),
    escapeCSV(r.dosageForm),
    escapeCSV(r.manufacturer),
    escapeCSV(r.unit),
    r.reorderLevel,
    r.productTotalStock,
    escapeCSV(r.stockStatus),
    escapeCSV(r.batchNumber),
    r.batchQuantity,
    Number(r.purchasePrice).toFixed(2),
    Number(r.sellingPrice).toFixed(2),
    Number(r.totalCostValuation).toFixed(2),
    Number(r.totalRetailValuation).toFixed(2),
    escapeCSV(r.expiryDate),
    escapeCSV(r.daysToExpiry),
    escapeCSV(r.expiryStatus),
    escapeCSV(r.supplier),
  ]);

  const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss");

  const summarySection = [
    "",
    "=== OFFICIAL INVENTORY AUDIT SUMMARY ===",
    `Pharmacy Name,${escapeCSV(pharmacyName)}`,
    `Generated Date & Time,${escapeCSV(timestamp)}`,
    `Generated By,${escapeCSV(userName)}`,
    `Total Catalog Medications,${totalProducts}`,
    `Total Batches Tracked,${totalBatches}`,
    `Total Inventory Units in Stock,${totalUnits}`,
    `Total Inventory Valuation at Cost (ETB),${totalCostValuation.toFixed(2)}`,
    `Total Potential Retail Valuation (ETB),${totalRetailValuation.toFixed(2)}`,
    `Potential Gross Margin (ETB),${(totalRetailValuation - totalCostValuation).toFixed(2)}`,
  ];

  const csvContent =
    "\uFEFF" +
    [headers.join(","), ...csvRows.map((e) => e.join(",")), ...summarySection].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `${pharmacyName.replace(/\s+/g, "_")}_Full_Inventory_A4_${format(
    new Date(),
    "yyyy-MM-dd"
  )}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printA4InventoryReport(
  products: any[],
  settings: PharmacySettings,
  user: SessionUser,
  orientation: "landscape" | "portrait" = "landscape"
) {
  const {
    rows,
    totalProducts,
    totalBatches,
    totalUnits,
    totalCostValuation,
    totalRetailValuation,
  } = generateInventoryCSVRows(products);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.print();
    return;
  }

  const generatedDate = format(new Date(), "EEEE, MMMM do yyyy, h:mm a");
  const reportRef = `AUD-INV-${format(new Date(), "yyyyMMdd")}-${Math.floor(1000 + Math.random() * 9000)}`;

  const tableRowsHtml = rows
    .map((r, idx) => {
      let statusColor = "#16a34a"; // green
      let statusBg = "#f0fdf4";
      if (r.expiryStatus === "EXPIRED" || r.stockStatus === "OUT_OF_STOCK") {
        statusColor = "#dc2626"; // red
        statusBg = "#fef2f2";
      } else if (r.expiryStatus === "NEAR_EXPIRY" || r.stockStatus === "LOW_STOCK") {
        statusColor = "#d97706"; // amber
        statusBg = "#fffbeb";
      }

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10px; ${
          idx % 2 === 1 ? "background-color: #f8fafc;" : ""
        }">
          <td style="padding: 6px 8px; text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="padding: 6px 8px; font-family: monospace; font-size: 9.5px; font-weight: 600; color: #334155;">
            ${r.sku}
          </td>
          <td style="padding: 6px 8px;">
            <strong style="color: #0f172a; font-size: 11px;">${r.brandName}</strong>
            <div style="font-size: 9.5px; color: #64748b;">${r.genericName}</div>
          </td>
          <td style="padding: 6px 8px; color: #475569;">${r.category}</td>
          <td style="padding: 6px 8px; color: #475569;">${r.dosageForm || "-"}</td>
          <td style="padding: 6px 8px; font-family: monospace; font-size: 10px; color: #0f172a; font-weight: 600;">
            ${r.batchNumber}
          </td>
          <td style="padding: 6px 8px; text-align: center; font-size: 9.5px; color: #334155;">
            ${r.expiryDate}
          </td>
          <td style="padding: 6px 8px; text-align: center;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8.5px; font-weight: 700; background-color: ${statusBg}; color: ${statusColor};">
              ${r.expiryStatus}
            </span>
          </td>
          <td style="padding: 6px 8px; text-align: right; font-weight: 700; color: #0f172a;">
            ${r.batchQuantity} <span style="font-size: 8.5px; font-weight: normal; color: #64748b;">${r.unit}</span>
          </td>
          <td style="padding: 6px 8px; text-align: right; color: #475569;">
            ${Number(r.purchasePrice).toFixed(2)}
          </td>
          <td style="padding: 6px 8px; text-align: right; color: #0f172a; font-weight: 600;">
            ${Number(r.sellingPrice).toFixed(2)}
          </td>
          <td style="padding: 6px 8px; text-align: right; font-weight: 700; color: #0f172a;">
            ${Number(r.totalCostValuation).toFixed(2)}
          </td>
        </tr>
      `;
    })
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Galma Pharmacy - Inventory Audit Report A4</title>
        <style>
          @page {
            size: A4 ${orientation};
            margin: 10mm 12mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            background: #fff;
            padding: 12px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #059669;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 800;
            color: #065f46;
            letter-spacing: -0.5px;
          }
          .brand-tagline {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          .brand-contact {
            font-size: 10px;
            color: #475569;
            margin-top: 4px;
          }
          .doc-meta {
            text-align: right;
          }
          .doc-title {
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
          }
          .doc-badge {
            display: inline-block;
            background: #ecfdf5;
            color: #047857;
            font-size: 9px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 9999px;
            border: 1px solid #a7f3d0;
            margin-top: 4px;
          }
          .meta-text {
            font-size: 9.5px;
            color: #64748b;
            margin-top: 3px;
          }
          .kpi-container {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin-bottom: 14px;
          }
          .kpi-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px 10px;
            background: #f8fafc;
          }
          .kpi-label {
            font-size: 8.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
          }
          .kpi-value {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #f1f5f9;
            border-bottom: 2px solid #cbd5e1;
            padding: 7px 8px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #334155;
            text-align: left;
          }
          .signoff-section {
            margin-top: 24px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            page-break-inside: avoid;
          }
          .signoff-box {
            border-top: 1px solid #94a3b8;
            padding-top: 6px;
            text-align: center;
          }
          .signoff-role {
            font-size: 10px;
            font-weight: 700;
            color: #0f172a;
          }
          .signoff-name {
            font-size: 9px;
            color: #64748b;
            margin-top: 2px;
          }
          .footer-note {
            margin-top: 16px;
            text-align: center;
            font-size: 8.5px;
            color: #94a3b8;
            border-top: 1px dashed #e2e8f0;
            padding-top: 8px;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand-title">${settings.pharmacyName}</div>
            <div class="brand-tagline">${settings.tagline}</div>
            <div class="brand-contact">
              ${settings.address} &bull; Tel: ${settings.phone} &bull; Email: ${settings.email}
            </div>
          </div>
          <div class="doc-meta">
            <div class="doc-title">Full Inventory & Batch Audit</div>
            <div class="doc-badge">Official A4 Audit Document</div>
            <div class="meta-text"><strong>Reference:</strong> ${reportRef}</div>
            <div class="meta-text"><strong>Audit Date:</strong> ${generatedDate}</div>
            <div class="meta-text"><strong>Auditor:</strong> ${user.name} (${user.role})</div>
          </div>
        </div>

        <div class="kpi-container">
          <div class="kpi-card">
            <div class="kpi-label">Registered Drugs</div>
            <div class="kpi-value">${totalProducts}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Tracked Batches</div>
            <div class="kpi-value">${totalBatches}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Total Units in Stock</div>
            <div class="kpi-value">${totalUnits.toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Cost Valuation (${settings.currency})</div>
            <div class="kpi-value">${Number(totalCostValuation).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Retail Valuation (${settings.currency})</div>
            <div class="kpi-value" style="color: #059669;">${Number(totalRetailValuation).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 30px;">#</th>
              <th style="width: 80px;">SKU</th>
              <th>Medication & Generic</th>
              <th>Category</th>
              <th>Form</th>
              <th>Batch #</th>
              <th style="text-align: center;">Expiry</th>
              <th style="text-align: center;">Status</th>
              <th style="text-align: right;">Quantity</th>
              <th style="text-align: right;">Cost (${settings.currency})</th>
              <th style="text-align: right;">Price (${settings.currency})</th>
              <th style="text-align: right;">Valuation</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="signoff-section">
          <div class="signoff-box">
            <div class="signoff-role">Prepared By</div>
            <div class="signoff-name">${user.name} (${user.role})</div>
          </div>
          <div class="signoff-box">
            <div class="signoff-role">Verified By Lead Pharmacist</div>
            <div class="signoff-name">Signature & Professional Stamp</div>
          </div>
          <div class="signoff-box">
            <div class="signoff-role">Internal Auditor / Management</div>
            <div class="signoff-name">Signature & Approval Date</div>
          </div>
        </div>

        <div class="footer-note">
          CONFIDENTIAL &bull; Generated by Galma Pharmacy Management OS &bull; Page printed on ${new Date().toLocaleDateString()}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
