"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Check,
  CreditCard,
  Banknote,
  Smartphone,
  Tag,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  Barcode,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { processSaleTransaction, searchPOSProducts } from "@/actions/pos";
import { CartItem, PharmacySettings, SessionUser } from "@/lib/types";
import { ReceiptModal } from "./ReceiptModal";

interface POSInterfaceProps {
  initialProducts: any[];
  settings: PharmacySettings;
  user: SessionUser;
}

const CATEGORIES = [
  "ALL",
  "Antibiotics",
  "Analgesics",
  "Antidiabetic",
  "Cardiovascular",
  "Gastrointestinal",
  "Respiratory",
  "Antihistamine",
  "Vitamins & Supplements",
  "Topical",
  "Syrups",
];

export function POSInterface({ initialProducts, settings, user }: POSInterfaceProps) {
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "MOBILE_MONEY">("CASH");
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  // Search filtering
  const handleSearch = (query: string, category = selectedCategory) => {
    setSearchQuery(query);
    startTransition(async () => {
      const results = await searchPOSProducts(query, category);
      setProducts(results);
    });
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    handleSearch(searchQuery, category);
  };

  // Barcode or quick scan enter key handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim().length > 0) {
      // Find matching item by barcode or sku or exact name
      const exactMatch = products.find(
        (p) =>
          p.barcode === searchQuery.trim() ||
          p.sku.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (exactMatch && exactMatch.availableBatches.length > 0) {
        addToCart(exactMatch, exactMatch.availableBatches[0]);
        setSearchQuery("");
        handleSearch("");
      }
    }
  };

  // Add item to cart
  const addToCart = (product: any, batch: any) => {
    if (batch.quantity <= 0) {
      toast.error(`Batch ${batch.batchNumber} has no stock remaining.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.batchId === batch.id);
      if (existing) {
        if (existing.quantity >= batch.quantity) {
          toast.warning(`Cannot add more. Available stock limit is ${batch.quantity}.`);
          return prev;
        }
        return prev.map((item) =>
          item.batchId === batch.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        const newItem: CartItem = {
          batchId: batch.id,
          productId: product.id,
          brandName: product.brandName,
          genericName: product.genericName,
          batchNumber: batch.batchNumber,
          unitPrice: batch.sellingPrice,
          purchasePrice: batch.purchasePrice,
          availableStock: batch.quantity,
          quantity: 1,
          expiryDate: batch.expiryDate,
          dosageForm: product.dosageForm,
          unit: product.unit,
        };
        toast.success(`Added ${product.brandName} to cart`);
        return [...prev, newItem];
      }
    });
  };

  // Update item quantity in cart
  const updateQuantity = (batchId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.batchId === batchId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.availableStock) {
              toast.warning(`Maximum available batch stock is ${item.availableStock}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (batchId: string) => {
    setCart((prev) => prev.filter((item) => item.batchId !== batchId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setCustomerName("");
    setCustomerPhone("");
  };

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountValue <= 0) return 0;
    if (discountType === "percent") {
      return (subtotal * Math.min(100, discountValue)) / 100;
    }
    return Math.min(subtotal, discountValue);
  }, [subtotal, discountType, discountValue]);

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = (discountedSubtotal * (settings.taxRate || 0)) / 100;
  const grandTotal = discountedSubtotal + taxAmount;

  // Checkout submission
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    startTransition(async () => {
      const res = await processSaleTransaction({
        customerName,
        customerPhone,
        items: cart.map((item) => ({
          batchId: item.batchId,
          quantity: item.quantity,
        })),
        discount: discountAmount,
        paymentMethod,
      });

      if (res.success && res.sale) {
        toast.success(`Invoice ${res.sale.invoiceNumber} created successfully!`);
        setCompletedSale(res.sale);
        clearCart();
        // Refresh product list to reflect decremented stock
        const updated = await searchPOSProducts(searchQuery, selectedCategory);
        setProducts(updated);
      } else {
        toast.error(res.error || "Failed to process sale.");
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-slate-100">
      {/* LEFT COLUMN: Drug Catalog & Search */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden border-r border-slate-200">
        {/* Search Bar & Barcode Input */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs mb-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by drug name, generic, SKU, or scan barcode (Enter)..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
              <Barcode className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
              <Package className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300" />
              <p className="text-sm font-medium">No available medicines found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {products.map((product) => {
                const totalStock = product.totalStock || 0;
                const isOutOfStock = totalStock === 0;
                const primaryBatch = product.availableBatches?.[0];

                return (
                  <div
                    key={product.id}
                    className={`bg-white rounded-2xl border p-4 flex flex-col justify-between transition-all hover:shadow-md ${
                      isOutOfStock
                        ? "border-slate-200 opacity-60 bg-slate-50/50"
                        : "border-slate-200 hover:border-emerald-300"
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 truncate max-w-[130px]">
                          {product.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? "bg-rose-100 text-rose-700"
                              : totalStock <= product.reorderLevel
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isOutOfStock ? "Out of Stock" : `${totalStock} in stock`}
                        </span>
                      </div>

                      {/* Brand & Generic Name */}
                      <h3 className="font-bold text-slate-900 text-sm leading-tight truncate" title={product.brandName}>
                        {product.brandName}
                      </h3>
                      <p className="text-xs text-slate-500 truncate" title={product.genericName}>
                        {product.genericName}
                      </p>

                      <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-600">
                        <span className="font-medium bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                          {product.dosageForm}
                        </span>
                        <span className="text-slate-400 truncate">• {product.unit}</span>
                      </div>
                    </div>

                    {/* Price and Add Button */}
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Price</span>
                        <span className="text-sm font-bold text-slate-900">
                          {settings.currencySymbol} {primaryBatch ? primaryBatch.sellingPrice.toFixed(2) : "0.00"}
                        </span>
                      </div>

                      <button
                        onClick={() => primaryBatch && addToCart(product, primaryBatch)}
                        disabled={isOutOfStock || !primaryBatch}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isOutOfStock || !primaryBatch
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20 active:scale-95"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Real-Time Cart & Checkout */}
      <div className="w-full lg:w-96 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Active Sale Cart</h2>
              <p className="text-[11px] text-slate-500">{cart.length} unique item(s)</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <ShoppingCart className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Cart is currently empty</p>
              <p className="text-xs text-slate-400 mt-1">Select items from the catalog or scan a barcode</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.batchId}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col gap-2 hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">{item.brandName}</h4>
                    <p className="text-[10px] text-slate-500">{item.genericName} • {item.dosageForm}</p>
                    <span className="inline-block mt-0.5 text-[9px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      BN: {item.batchNumber}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.batchId)}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item.batchId, -1)}
                      className="w-6 h-6 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-slate-800 text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.batchId, 1)}
                      className="w-6 h-6 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">
                      @{item.unitPrice.toFixed(2)}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {settings.currencySymbol} {(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer & Payment Inputs */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
          {/* Customer Meta */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Customer Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            <input
              type="text"
              placeholder="Phone (Optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Discount Section */}
          <div className="flex items-center gap-2">
            <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden text-[11px] font-semibold">
              <button
                onClick={() => setDiscountType("fixed")}
                className={`px-2 py-1 ${
                  discountType === "fixed" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {settings.currencySymbol} Flat
              </button>
              <button
                onClick={() => setDiscountType("percent")}
                className={`px-2 py-1 ${
                  discountType === "percent" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                % Percent
              </button>
            </div>
            <input
              type="number"
              min="0"
              placeholder="Discount"
              value={discountValue === 0 ? "" : discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
              className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Payment Method</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "CASH", label: "Cash", icon: Banknote },
                { id: "MOBILE_MONEY", label: "Mobile / Telebirr", icon: Smartphone },
                { id: "CARD", label: "Card", icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-2 px-1.5 rounded-xl border text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-600 text-emerald-800 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-700" : "text-slate-400"}`} />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing Totals Breakdown */}
          <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>
                {settings.currencySymbol} {subtotal.toFixed(2)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount:</span>
                <span>
                  - {settings.currencySymbol} {discountAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Tax ({settings.taxRate}%):</span>
              <span>
                {settings.currencySymbol} {taxAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Payable:</span>
              <span className="text-emerald-700">
                {settings.currencySymbol} {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Checkout Action Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isPending}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              cart.length === 0 || isPending
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 active:scale-[0.98]"
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{isPending ? "Processing Transaction..." : `Complete Sale (${settings.currencySymbol} ${grandTotal.toFixed(2)})`}</span>
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          settings={settings}
          isNewSale={true}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
}
