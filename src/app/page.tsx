import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    if (user.role === "CASHIER") {
      redirect("/pos");
    }
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
