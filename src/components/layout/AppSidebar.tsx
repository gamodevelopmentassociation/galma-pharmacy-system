"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  BarChart3,
  Users,
  ShieldCheck,
  Settings,
  LogOut,
} from "lucide-react";
import { SessionUser } from "@/lib/types";
import { logoutAction } from "@/actions/auth";
import { toast } from "sonner";

interface AppSidebarProps {
  user: SessionUser;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    toast.promise(logoutAction(), {
      loading: "Signing out...",
      success: () => {
        router.push("/login");
        return "Signed out successfully";
      },
      error: "Failed to sign out",
    });
  };

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "PHARMACIST"],
    },
    {
      title: "POS Terminal",
      href: "/pos",
      icon: ShoppingCart,
      roles: ["ADMIN", "PHARMACIST", "CASHIER"],
    },
    {
      title: "Inventory & Batches",
      href: "/inventory",
      icon: Package,
      roles: ["ADMIN", "PHARMACIST"],
    },
    {
      title: "Sales & Invoices",
      href: "/invoices",
      icon: Receipt,
      roles: ["ADMIN", "PHARMACIST", "CASHIER"],
    },
    {
      title: "Financial Reports",
      href: "/reports",
      icon: BarChart3,
      roles: ["ADMIN"],
    },
    {
      title: "Staff & Users",
      href: "/employees",
      icon: Users,
      roles: ["ADMIN"],
    },
    {
      title: "Audit Trail",
      href: "/audit",
      icon: ShieldCheck,
      roles: ["ADMIN"],
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["ADMIN"],
    },
  ];

  const allowedNav = navItems.filter((item) => item.roles.includes(user.role));

  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    ADMIN: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    PHARMACIST: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    CASHIER: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  };

  const currentRoleStyle = roleColors[user.role] || roleColors.CASHIER;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-30 select-none shadow-xs">
      {/* Brand Header with Official Logo */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 relative bg-white p-1 rounded-xl shadow-xs border border-slate-200 flex items-center justify-center shrink-0">
          <Image
            src="/logo.png"
            alt="Galma Logo"
            width={34}
            height={34}
            className="object-contain"
          />
        </div>
        <div className="overflow-hidden">
          <span className="font-bold text-base tracking-tight text-slate-900 block truncate">
            Galma Pharmacy
          </span>
          <p className="text-[11px] text-slate-500 font-medium">Healthcare OS</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {allowedNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? "bg-emerald-600 text-white shadow-xs font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-600"
                  }`}
                />
                <span>{item.title}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* User Session Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs mb-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-semibold text-slate-900 truncate max-w-[130px]" title={user.name}>
              {user.name}
            </span>
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${currentRoleStyle.bg} ${currentRoleStyle.text} ${currentRoleStyle.border}`}
            >
              {user.role}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 truncate" title={user.email}>
            {user.email}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
