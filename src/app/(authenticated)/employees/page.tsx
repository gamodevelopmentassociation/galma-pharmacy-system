import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEmployees } from "@/actions/employees";
import { EmployeeManager } from "@/components/employees/EmployeeManager";

export default async function EmployeesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const employees = await getEmployees();

  return <EmployeeManager initialEmployees={employees} currentUser={user} />;
}
