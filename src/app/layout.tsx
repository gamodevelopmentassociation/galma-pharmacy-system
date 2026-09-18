import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/common/ToastProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "Galma Pharmacy & Healthcare Management System",
  description: "Enterprise Pharmacy Management, POS Billing, Inventory Batch Expiry Tracking & Financial Reporting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-100 text-slate-900">
        <ThemeProvider>
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
