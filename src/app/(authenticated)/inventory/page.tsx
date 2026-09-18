import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getInventoryProducts } from "@/actions/inventory";
import { getPharmacySettings } from "@/actions/settings";
import { InventoryTable } from "@/components/inventory/InventoryTable";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; add?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === "CASHIER") {
    redirect("/pos");
  }

  const resolvedSearchParams = await searchParams;
  const initialTab = resolvedSearchParams?.tab || "all";
  const initialAddOpen = resolvedSearchParams?.add === "true";

  const [products, settings] = await Promise.all([
    getInventoryProducts(),
    getPharmacySettings(),
  ]);

  return (
    <InventoryTable
      initialProducts={products}
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
      initialTab={initialTab}
      initialAddOpen={initialAddOpen}
    />
  );
}
