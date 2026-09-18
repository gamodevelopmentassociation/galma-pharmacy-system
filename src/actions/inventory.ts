"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getInventoryProducts(search = "", category = "") {
  try {
    const products = await prisma.product.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { brandName: { contains: search, mode: "insensitive" } },
                  { genericName: { contains: search, mode: "insensitive" } },
                  { sku: { contains: search, mode: "insensitive" } },
                  { barcode: { contains: search, mode: "insensitive" } },
                  { manufacturer: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          category && category !== "ALL" ? { category: { equals: category } } : {},
        ],
      },
      include: {
        batches: {
          orderBy: { expiryDate: "asc" },
        },
      },
      orderBy: { brandName: "asc" },
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return products.map((p) => {
      const totalStock = p.batches.reduce((sum, b) => sum + b.quantity, 0);
      const isLowStock = totalStock <= p.reorderLevel;
      const hasNearExpiry = p.batches.some(
        (b) => b.quantity > 0 && new Date(b.expiryDate) <= thirtyDaysFromNow
      );
      const hasExpired = p.batches.some(
        (b) => b.quantity > 0 && new Date(b.expiryDate) <= now
      );

      return {
        ...p,
        totalStock,
        isLowStock,
        hasNearExpiry,
        hasExpired,
      };
    });
  } catch (error: any) {
    console.error("getInventoryProducts error:", error);
    return [];
  }
}

export interface CreateProductInput {
  sku: string;
  barcode?: string;
  brandName: string;
  genericName: string;
  category: string;
  dosageForm: string;
  manufacturer: string;
  description?: string;
  reorderLevel: number;
  unit: string;
  initialBatch?: {
    batchNumber: string;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
    expiryDate: string;
    supplier?: string;
  };
}

export async function createProductAction(data: CreateProductInput) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    if (!data.sku || !data.brandName || !data.genericName || !data.category) {
      return { success: false, error: "Missing required fields" };
    }

    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: data.sku.trim() },
          data.barcode ? { barcode: data.barcode.trim() } : {},
        ],
      },
    });

    if (existing) {
      return { success: false, error: "A product with this SKU or Barcode already exists." };
    }

    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku: data.sku.trim().toUpperCase(),
          barcode: data.barcode?.trim() || null,
          brandName: data.brandName.trim(),
          genericName: data.genericName.trim(),
          category: data.category,
          dosageForm: data.dosageForm,
          manufacturer: data.manufacturer.trim(),
          description: data.description?.trim() || null,
          reorderLevel: Number(data.reorderLevel) || 15,
          unit: data.unit || "Box",
        },
      });

      if (data.initialBatch && data.initialBatch.batchNumber) {
        await tx.inventoryBatch.create({
          data: {
            productId: product.id,
            batchNumber: data.initialBatch.batchNumber.trim().toUpperCase(),
            quantity: Number(data.initialBatch.quantity) || 0,
            initialQty: Number(data.initialBatch.quantity) || 0,
            purchasePrice: Number(data.initialBatch.purchasePrice) || 0,
            sellingPrice: Number(data.initialBatch.sellingPrice) || 0,
            expiryDate: new Date(data.initialBatch.expiryDate),
            supplier: data.initialBatch.supplier?.trim() || null,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_PRODUCT",
          entity: "Product",
          entityId: product.id,
          details: `Created product "${product.brandName}" (${product.sku}) with dosage ${product.dosageForm}.`,
        },
      });

      return product;
    });

    revalidatePath("/inventory");
    return { success: true, product: created };
  } catch (error: any) {
    console.error("createProductAction error:", error);
    return { success: false, error: error.message || "Failed to create product" };
  }
}

export interface CreateBatchInput {
  productId: string;
  batchNumber: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  expiryDate: string;
  supplier?: string;
}

export async function createBatchAction(data: CreateBatchInput) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) return { success: false, error: "Product not found." };

    const batch = await prisma.$transaction(async (tx) => {
      const createdBatch = await tx.inventoryBatch.create({
        data: {
          productId: data.productId,
          batchNumber: data.batchNumber.trim().toUpperCase(),
          quantity: Number(data.quantity) || 0,
          initialQty: Number(data.quantity) || 0,
          purchasePrice: Number(data.purchasePrice) || 0,
          sellingPrice: Number(data.sellingPrice) || 0,
          expiryDate: new Date(data.expiryDate),
          supplier: data.supplier?.trim() || null,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "ADD_BATCH",
          entity: "InventoryBatch",
          entityId: createdBatch.id,
          details: `Added new batch ${createdBatch.batchNumber} (${createdBatch.quantity} units @ ${createdBatch.sellingPrice}) for ${product.brandName}.`,
        },
      });

      return createdBatch;
    });

    revalidatePath("/inventory");
    return { success: true, batch };
  } catch (error: any) {
    console.error("createBatchAction error:", error);
    return { success: false, error: error.message || "Failed to add batch" };
  }
}

export interface StockAdjustmentInput {
  batchId: string;
  type: "DAMAGED" | "EXPIRED" | "RETURNED" | "CORRECTION";
  quantity: number; // positive for addition, negative for deduction
  reason: string;
}

export async function adjustStockAction(data: StockAdjustmentInput) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    if (!data.batchId || !data.reason || data.quantity === 0) {
      return { success: false, error: "Invalid adjustment parameters." };
    }

    const batch = await prisma.inventoryBatch.findUnique({
      where: { id: data.batchId },
      include: { product: true },
    });

    if (!batch) return { success: false, error: "Batch not found." };

    if (data.quantity < 0 && batch.quantity + data.quantity < 0) {
      return {
        success: false,
        error: `Cannot reduce ${Math.abs(data.quantity)} units. Current batch balance is ${batch.quantity}.`,
      };
    }

    const adjustment = await prisma.$transaction(async (tx) => {
      const createdAdj = await tx.stockAdjustment.create({
        data: {
          batchId: data.batchId,
          userId: user.id,
          type: data.type,
          quantity: Number(data.quantity),
          reason: data.reason.trim(),
        },
      });

      await tx.inventoryBatch.update({
        where: { id: data.batchId },
        data: {
          quantity: { increment: Number(data.quantity) },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "ADJUST_STOCK",
          entity: "InventoryBatch",
          entityId: data.batchId,
          details: `Stock Adjusted for ${batch.product.brandName} (${batch.batchNumber}): ${data.quantity > 0 ? "+" : ""}${data.quantity} (${data.type}) - Reason: ${data.reason}`,
        },
      });

      return createdAdj;
    });

    revalidatePath("/inventory");
    return { success: true, adjustment };
  } catch (error: any) {
    console.error("adjustStockAction error:", error);
    return { success: false, error: error.message || "Failed to adjust stock." };
  }
}

export async function getStockAlerts() {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // 1. Low stock products
    const allProducts = await prisma.product.findMany({
      include: { batches: true },
    });

    const lowStockItems = allProducts
      .map((p) => {
        const totalStock = p.batches.reduce((sum, b) => sum + b.quantity, 0);
        return {
          id: p.id,
          sku: p.sku,
          brandName: p.brandName,
          genericName: p.genericName,
          category: p.category,
          dosageForm: p.dosageForm,
          reorderLevel: p.reorderLevel,
          totalStock,
          unit: p.unit,
        };
      })
      .filter((p) => p.totalStock <= p.reorderLevel);

    // 2. Batches by expiry window
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        quantity: { gt: 0 },
        expiryDate: { lte: in90Days },
      },
      include: {
        product: true,
      },
      orderBy: { expiryDate: "asc" },
    });

    const expired = batches.filter((b) => new Date(b.expiryDate) <= now);
    const urgent30 = batches.filter((b) => new Date(b.expiryDate) > now && new Date(b.expiryDate) <= in30Days);
    const near60 = batches.filter((b) => new Date(b.expiryDate) > in30Days && new Date(b.expiryDate) <= in60Days);
    const warning90 = batches.filter((b) => new Date(b.expiryDate) > in60Days && new Date(b.expiryDate) <= in90Days);

    return {
      lowStockItems,
      expired,
      urgent30,
      near60,
      warning90,
      totalAlertsCount: lowStockItems.length + expired.length + urgent30.length + near60.length,
    };
  } catch (error: any) {
    console.error("getStockAlerts error:", error);
    return {
      lowStockItems: [],
      expired: [],
      urgent30: [],
      near60: [],
      warning90: [],
      totalAlertsCount: 0,
    };
  }
}

export interface UpdateProductInput {
  id: string;
  sku: string;
  barcode?: string;
  brandName: string;
  genericName: string;
  category: string;
  dosageForm: string;
  manufacturer: string;
  description?: string;
  reorderLevel: number;
  unit: string;
}

export async function updateProductAction(data: UpdateProductInput) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "CASHIER") {
      return { success: false, error: "Unauthorized: Pharmacist or Admin permission required." };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: data.id },
        data: {
          sku: data.sku.trim().toUpperCase(),
          barcode: data.barcode?.trim() || null,
          brandName: data.brandName.trim(),
          genericName: data.genericName.trim(),
          category: data.category,
          dosageForm: data.dosageForm.trim(),
          manufacturer: data.manufacturer.trim(),
          description: data.description?.trim() || null,
          reorderLevel: Number(data.reorderLevel) || 15,
          unit: data.unit || "Box",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_PRODUCT",
          entity: "Product",
          entityId: product.id,
          details: `Updated details for ${product.brandName} (${product.sku}).`,
        },
      });

      return product;
    });

    revalidatePath("/inventory");
    return { success: true, product: updated };
  } catch (error: any) {
    console.error("updateProductAction error:", error);
    return { success: false, error: error.message || "Failed to update product." };
  }
}

export async function deleteProductAction(productId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "CASHIER") {
      return { success: false, error: "Unauthorized: Pharmacist or Admin permission required." };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { batches: true },
    });

    if (!product) {
      return { success: false, error: "Product not found." };
    }

    await prisma.$transaction(async (tx) => {
      // Find all batches for this product
      const batchIds = product.batches.map((b) => b.id);

      // Clean up stock adjustments
      if (batchIds.length > 0) {
        await tx.stockAdjustment.deleteMany({
          where: { batchId: { in: batchIds } },
        });

        // Note: SaleItems reference batchId. If sales exist, clean up or soft-delete
        // Delete SaleItems associated with these batches to allow safe deletion
        await tx.saleItem.deleteMany({
          where: { batchId: { in: batchIds } },
        });

        // Delete batches
        await tx.inventoryBatch.deleteMany({
          where: { productId },
        });
      }

      // Delete the product
      await tx.product.delete({
        where: { id: productId },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_PRODUCT",
          entity: "Product",
          entityId: productId,
          details: `Removed product "${product.brandName}" (${product.sku}) and ${batchIds.length} associated batch(es) from inventory.`,
        },
      });
    });

    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/pos");
    return { success: true };
  } catch (error: any) {
    console.error("deleteProductAction error:", error);
    return { success: false, error: error.message || "Failed to remove product from inventory." };
  }
}

export async function deleteBatchAction(batchId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "CASHIER") {
      return { success: false, error: "Unauthorized: Pharmacist or Admin permission required." };
    }

    const batch = await prisma.inventoryBatch.findUnique({
      where: { id: batchId },
      include: { product: true },
    });

    if (!batch) {
      return { success: false, error: "Batch not found." };
    }

    await prisma.$transaction(async (tx) => {
      // Clean up adjustments and sale items for this batch
      await tx.stockAdjustment.deleteMany({
        where: { batchId },
      });

      await tx.saleItem.deleteMany({
        where: { batchId },
      });

      await tx.inventoryBatch.delete({
        where: { id: batchId },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_BATCH",
          entity: "InventoryBatch",
          entityId: batchId,
          details: `Removed batch ${batch.batchNumber} (${batch.quantity} units) for ${batch.product.brandName}.`,
        },
      });
    });

    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/pos");
    return { success: true };
  } catch (error: any) {
    console.error("deleteBatchAction error:", error);
    return { success: false, error: error.message || "Failed to remove batch." };
  }
}
