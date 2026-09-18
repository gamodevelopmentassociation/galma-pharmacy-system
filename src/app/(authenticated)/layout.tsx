import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppLayoutShell } from "@/components/layout/AppLayoutShell";
import { getStockAlerts } from "@/actions/inventory";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const alerts = await getStockAlerts();

  return (
    <AppLayoutShell user={user} totalAlerts={alerts.totalAlertsCount}>
      {children}
    </AppLayoutShell>
  );
}
