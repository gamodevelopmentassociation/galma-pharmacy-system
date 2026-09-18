"use server";

import prisma from "@/lib/prisma";

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  cashierId?: string;
  paymentMethod?: string;
}

export async function getConsolidatedFinancialReport(filters?: ReportFilter) {
  try {
    const whereClause: any = {};

    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {};
      if (filters?.startDate) {
        const startStr = filters.startDate.includes("T")
          ? filters.startDate
          : `${filters.startDate}T00:00:00.000Z`;
        whereClause.createdAt.gte = new Date(startStr);
      }
      if (filters?.endDate) {
        const endStr = filters.endDate.includes("T")
          ? filters.endDate
          : `${filters.endDate}T23:59:59.999Z`;
        whereClause.createdAt.lte = new Date(endStr);
      }
    }

    if (filters?.cashierId && filters.cashierId !== "ALL") {
      whereClause.cashierId = filters.cashierId;
    }

    if (filters?.paymentMethod && filters.paymentMethod !== "ALL") {
      whereClause.paymentMethod = filters.paymentMethod;
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        cashier: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            batch: {
              include: { product: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 1. Precise Financial Accounting Metrics
    let totalGrossSales = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalAmountCollected = 0;
    let totalCOGS = 0;

    const paymentMethodTotals: Record<string, number> = {
      CASH: 0,
      MOBILE_MONEY: 0,
      CARD: 0,
      CREDIT: 0,
    };
    const categoryTotals: Record<string, { revenue: number; quantity: number; profit: number }> = {};
    const topProductsMap: Record<
      string,
      { brandName: string; genericName: string; quantity: number; revenue: number; profit: number }
    > = {};

    const dailyTrendMap: Record<
      string,
      { date: string; revenue: number; cogs: number; profit: number; orders: number }
    > = {};

    for (const sale of sales) {
      totalGrossSales += sale.subtotal;
      totalDiscount += sale.discount;
      totalTax += sale.tax;
      totalAmountCollected += sale.totalAmount;

      const method = sale.paymentMethod || "CASH";
      paymentMethodTotals[method] = (paymentMethodTotals[method] || 0) + sale.totalAmount;

      // Group by local/ISO date (YYYY-MM-DD)
      const dayKey = new Date(sale.createdAt).toISOString().slice(0, 10);
      if (!dailyTrendMap[dayKey]) {
        dailyTrendMap[dayKey] = { date: dayKey, revenue: 0, cogs: 0, profit: 0, orders: 0 };
      }
      dailyTrendMap[dayKey].orders += 1;
      // Net merchandise revenue for the day (subtotal - discount)
      const saleNetSales = Math.max(0, sale.subtotal - sale.discount);
      dailyTrendMap[dayKey].revenue += saleNetSales;

      let saleCOGS = 0;

      for (const item of sale.items) {
        const itemCOGS = item.quantity * item.purchasePrice;
        saleCOGS += itemCOGS;
        totalCOGS += itemCOGS;

        // Top products accumulation
        const prodKey = item.productName;
        if (!topProductsMap[prodKey]) {
          topProductsMap[prodKey] = {
            brandName: item.productName,
            genericName: item.genericName,
            quantity: 0,
            revenue: 0,
            profit: 0,
          };
        }
        topProductsMap[prodKey].quantity += item.quantity;
        topProductsMap[prodKey].revenue += item.totalPrice;
        topProductsMap[prodKey].profit += item.totalPrice - itemCOGS;

        // Category breakdown
        const category = item.batch?.product?.category || "Other";
        if (!categoryTotals[category]) {
          categoryTotals[category] = { revenue: 0, quantity: 0, profit: 0 };
        }
        categoryTotals[category].revenue += item.totalPrice;
        categoryTotals[category].quantity += item.quantity;
        categoryTotals[category].profit += item.totalPrice - itemCOGS;
      }

      dailyTrendMap[dayKey].cogs += saleCOGS;
      dailyTrendMap[dayKey].profit += saleNetSales - saleCOGS;
    }

    const netSales = Math.max(0, totalGrossSales - totalDiscount);
    const grossProfit = netSales - totalCOGS;
    const profitMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

    // Sort trends chronologically
    const salesTrend = Object.values(dailyTrendMap).sort((a, b) => a.date.localeCompare(b.date));

    // Sort top products by revenue
    const topProducts = Object.values(topProductsMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Format payment methods for charts
    const paymentBreakdown = Object.entries(paymentMethodTotals).map(([name, value]) => ({
      name: name.replace("_", " "),
      value: Number(value.toFixed(2)),
    }));

    // Format categories for charts
    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([name, data]) => ({
        name,
        revenue: Number(data.revenue.toFixed(2)),
        quantity: data.quantity,
        profit: Number(data.profit.toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Total inventory asset valuation (at purchase cost vs retail selling price)
    const allBatches = await prisma.inventoryBatch.findMany({
      where: { quantity: { gt: 0 } },
    });
    const inventoryValuationCost = allBatches.reduce((acc, b) => acc + b.quantity * b.purchasePrice, 0);
    const inventoryValuationRetail = allBatches.reduce((acc, b) => acc + b.quantity * b.sellingPrice, 0);

    return {
      kpis: {
        totalRevenue: Number(totalAmountCollected.toFixed(2)), // Gross Invoiced (Total Collected)
        netSales: Number(netSales.toFixed(2)),                 // Net Merchandise Sales
        grossSales: Number(totalGrossSales.toFixed(2)),        // List Price Subtotal
        totalCOGS: Number(totalCOGS.toFixed(2)),              // Cost of Goods Sold
        grossProfit: Number(grossProfit.toFixed(2)),          // True Gross Margin (Net Sales - COGS)
        profitMargin: Number(profitMargin.toFixed(1)),        // Margin Percentage
        totalTax: Number(totalTax.toFixed(2)),                // Tax Collected
        totalDiscount: Number(totalDiscount.toFixed(2)),      // Total Discounts Granted
        transactionCount: sales.length,
        averageOrderValue: sales.length > 0 ? Number((totalAmountCollected / sales.length).toFixed(2)) : 0,
        inventoryValuationCost: Number(inventoryValuationCost.toFixed(2)),
        inventoryValuationRetail: Number(inventoryValuationRetail.toFixed(2)),
        potentialInventoryProfit: Number((inventoryValuationRetail - inventoryValuationCost).toFixed(2)),
      },
      salesTrend,
      topProducts,
      paymentBreakdown,
      categoryBreakdown,
      recentSales: sales.slice(0, 25),
      allFilteredSales: sales, // For full CSV export
    };
  } catch (error: any) {
    console.error("getConsolidatedFinancialReport error:", error);
    return {
      kpis: {
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
      },
      salesTrend: [],
      topProducts: [],
      paymentBreakdown: [],
      categoryBreakdown: [],
      recentSales: [],
      allFilteredSales: [],
    };
  }
}
