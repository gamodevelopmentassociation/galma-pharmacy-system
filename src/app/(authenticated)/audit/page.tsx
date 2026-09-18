import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAuditLogs } from "@/actions/audit";
import { AuditLogViewer } from "@/components/audit/AuditLogViewer";

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const logs = await getAuditLogs();

  return <AuditLogViewer initialLogs={logs} />;
}
