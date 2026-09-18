import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getConsolidatedFinancialReport } from "@/actions/reports";
import { getPharmacySettings } from "@/actions/settings";
import { FinancialDashboard } from "@/components/reports/FinancialDashboard";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [report, settings, cashiers] = await Promise.all([
    getConsolidatedFinancialReport(),
    getPharmacySettings(),
    prisma.user.findMany({
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <FinancialDashboard
      initialReport={report}
      cashiers={cashiers || []}
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
