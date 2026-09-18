"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function searchPOSProducts(query = "", category = "") {
  try {
    const products = await prisma.product.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [
                  { brandName: { contains: query } },
                  { genericName: { contains: query } },
                  { sku: { contains: query } },
                  { barcode: { contains: query } },
                ],
              }
            : {},
          category && category !== "ALL" ? { category: { equals: category } } : {},
        ],
      },
      include: {
        batches: {
          where: {
            quantity: { gt: 0 },
            expiryDate: { gt: new Date() }, // Only non-expired items in POS
          },
          orderBy: {
            expiryDate: "asc", // FIFO: Dispense earliest expiring stock first
          },
        },
      },
      orderBy: {
        brandName: "asc",
      },
    });

    return products.map((p) => {
      const totalStock = p.batches.reduce((sum, b) => sum + b.quantity, 0);
      const minSellingPrice = p.batches.length > 0 ? Math.min(...p.batches.map((b) => b.sellingPrice)) : 0;
      return {
        ...p,
        totalStock,
        minSellingPrice,
        availableBatches: p.batches,
      };
    });
  } catch (error: any) {
    console.error("searchPOSProducts error:", error);
    return [];
  }
}

export interface CheckoutItemPayload {
  batchId: string;
  quantity: number;
}

export interface ProcessSaleInput {
  customerName?: string;
  customerPhone?: string;
  items: CheckoutItemPayload[];
  discount: number;
  paymentMethod: "CASH" | "CARD" | "MOBILE_MONEY" | "CREDIT";
  notes?: string;
}

export async function processSaleTransaction(data: ProcessSaleInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, error: "Cart is empty. Add items before checking out." };
    }

    // Get pharmacy settings for tax calculation
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });
    const taxRate = settings?.taxRate || 0;

    // Use Prisma interactive transaction for atomic stock validation & sale recording
    const result = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const saleItemsToCreate: any[] = [];

      for (const item of data.items) {
        if (item.quantity <= 0) {
          throw new Error("Invalid quantity specified.");
        }

        const batch = await tx.inventoryBatch.findUnique({
          where: { id: item.batchId },
          include: { product: true },
        });

        if (!batch) {
          throw new Error(`Batch ID ${item.batchId} not found.`);
        }

        if (batch.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for ${batch.product.brandName} (${batch.batchNumber}). Requested: ${item.quantity}, Available: ${batch.quantity}`
          );
        }

        if (new Date(batch.expiryDate) <= new Date()) {
          throw new Error(`Batch ${batch.batchNumber} for ${batch.product.brandName} is expired and cannot be sold.`);
        }

        // Decrement batch inventory
        await tx.inventoryBatch.update({
          where: { id: batch.id },
          data: {
            quantity: { decrement: item.quantity },
          },
        });

        const lineTotal = item.quantity * batch.sellingPrice;
        subtotal += lineTotal;

        saleItemsToCreate.push({
          batchId: batch.id,
          productName: batch.product.brandName,
          genericName: batch.product.genericName,
          quantity: item.quantity,
          unitPrice: batch.sellingPrice,
          purchasePrice: batch.purchasePrice,
          totalPrice: lineTotal,
        });
      }

      // Calculate totals
      const discount = Math.max(0, data.discount || 0);
      const discountedSubtotal = Math.max(0, subtotal - discount);
      const tax = (discountedSubtotal * taxRate) / 100;
      const totalAmount = discountedSubtotal + tax;

      // Generate formatted sequential invoice number: INV-YYYYMMDD-XXXX
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

      // Create Sale Record
      const createdSale = await tx.sale.create({
        data: {
          invoiceNumber,
          cashierId: user.id,
          customerName: data.customerName?.trim() || "Walk-in Customer",
          customerPhone: data.customerPhone?.trim() || null,
          subtotal,
          discount,
          tax,
          totalAmount,
          paymentMethod: data.paymentMethod,
          paymentStatus: "PAID",
          notes: data.notes?.trim() || null,
          items: {
            create: saleItemsToCreate,
          },
        },
        include: {
          cashier: {
            select: { name: true, email: true },
          },
          items: {
            include: {
              batch: true,
            },
          },
        },
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "SALE_COMPLETED",
          entity: "Sale",
          entityId: createdSale.id,
          details: `Invoice ${createdSale.invoiceNumber} processed for ${createdSale.customerName}. Total: ${totalAmount.toFixed(2)} ${settings?.currency || "ETB"} (${data.paymentMethod})`,
        },
      });

      return createdSale;
    });

    return {
      success: true,
      sale: result,
      settings: settings || {
        pharmacyName: "Galma Pharmacy & Healthcare",
        address: "Bole Medhanialem Road, Addis Ababa, Ethiopia",
        phone: "+251 911 234 567",
        email: "care@galmapharmacy.com",
        taxRate: 5.0,
        currency: "ETB",
        currencySymbol: "ETB",
        receiptFooter: "Thank you for choosing Galma Pharmacy!",
      },
    };
  } catch (error: any) {
    console.error("processSaleTransaction error:", error);
    return { success: false, error: error.message || "Failed to process transaction." };
  }
}

export async function getRecentInvoices(limit = 10) {
  try {
    return await prisma.sale.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        cashier: { select: { name: true } },
        items: true,
      },
    });
  } catch (error) {
    console.error("getRecentInvoices error:", error);
    return [];
  }
}
