import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getPharmacySettings } from "@/actions/settings";
import { InvoicesList } from "@/components/invoices/InvoicesList";

export default async function InvoicesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [sales, settings] = await Promise.all([
    prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        cashier: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            batch: true,
          },
        },
      },
    }),
    getPharmacySettings(),
  ]);

  return (
    <InvoicesList
      sales={sales}
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
