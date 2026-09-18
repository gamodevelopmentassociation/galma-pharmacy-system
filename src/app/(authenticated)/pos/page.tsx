import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { searchPOSProducts } from "@/actions/pos";
import { getPharmacySettings } from "@/actions/settings";
import { POSInterface } from "@/components/pos/POSInterface";

export default async function POSPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [products, settings] = await Promise.all([
    searchPOSProducts(),
    getPharmacySettings(),
  ]);

  return (
    <POSInterface
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
    />
  );
}
