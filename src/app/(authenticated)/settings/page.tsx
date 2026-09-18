import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPharmacySettings } from "@/actions/settings";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const settings = await getPharmacySettings();

  return (
    <SettingsForm
      initialSettings={
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
