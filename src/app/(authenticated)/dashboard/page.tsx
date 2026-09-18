import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getConsolidatedFinancialReport } from "@/actions/reports";
import { getStockAlerts } from "@/actions/inventory";
import { getPharmacySettings } from "@/actions/settings";
import { MainDashboard } from "@/components/dashboard/MainDashboard";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === "CASHIER") {
    redirect("/pos");
  }

  const [financials, alerts, settings] = await Promise.all([
    getConsolidatedFinancialReport(),
    getStockAlerts(),
    getPharmacySettings(),
  ]);

  return (
    <MainDashboard
      kpis={financials.kpis}
      alerts={alerts}
      recentSales={financials.recentSales}
      settings={
        settings || {
          id: "default",
          pharmacyName: "Galma Pharmacy & Healthcare",
          tagline: "Precision Care & Trusted Pharmaceuticals",
          address: "Bole Medhanialem Road, Addis Ababa, Ethiopia",
          phone: "+251 911 234 567",
          email: "care@galmapharmacy.com",
          taxRate: 5.0,
          currency: "ETB",
          currencySymbol: "ETB",
          receiptFooter: "Thank you for choosing Galma Pharmacy!",
        }
      }
      user={user}
    />
  );
}
