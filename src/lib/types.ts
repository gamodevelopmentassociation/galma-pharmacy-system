export type Role = "ADMIN" | "PHARMACIST" | "CASHIER";

export type PaymentMethod = "CASH" | "CARD" | "MOBILE_MONEY" | "CREDIT";
export type PaymentStatus = "PAID" | "PENDING" | "REFUNDED";
export type AdjustmentType = "DAMAGED" | "EXPIRED" | "RETURNED" | "CORRECTION";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
}

export interface ProductWithBatches {
  id: string;
  sku: string;
  barcode: string | null;
  brandName: string;
  genericName: string;
  category: string;
  dosageForm: string;
  manufacturer: string;
  description: string | null;
  reorderLevel: number;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
  batches: BatchItem[];
  totalStock?: number;
  minSellingPrice?: number;
  hasNearExpiry?: boolean;
  isLowStock?: boolean;
}

export interface BatchItem {
  id: string;
  productId: string;
  batchNumber: string;
  quantity: number;
  initialQty: number;
  purchasePrice: number;
  sellingPrice: number;
  expiryDate: Date | string;
  supplier: string | null;
  createdAt: Date;
  updatedAt: Date;
  product?: {
    brandName: string;
    genericName: string;
    category: string;
    dosageForm: string;
    unit: string;
  };
}

export interface CartItem {
  batchId: string;
  productId: string;
  brandName: string;
  genericName: string;
  batchNumber: string;
  unitPrice: number;
  purchasePrice: number;
  availableStock: number;
  quantity: number;
  expiryDate: string | Date;
  dosageForm: string;
  unit: string;
}

export interface SaleWithDetails {
  id: string;
  invoiceNumber: string;
  cashierId: string;
  cashier: {
    name: string;
    email: string;
  };
  customerName: string | null;
  customerPhone: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  notes: string | null;
  createdAt: Date;
  items: {
    id: string;
    productName: string;
    genericName: string;
    quantity: number;
    unitPrice: number;
    purchasePrice: number;
    totalPrice: number;
    batch: {
      batchNumber: string;
      expiryDate: Date;
    };
  }[];
}

export interface PharmacySettings {
  id: string;
  pharmacyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  currency: string;
  currencySymbol: string;
  receiptFooter: string;
}
