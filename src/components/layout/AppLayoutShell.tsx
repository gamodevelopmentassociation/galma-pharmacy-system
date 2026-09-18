"use client";

import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { SessionUser } from "@/lib/types";

interface AppLayoutShellProps {
  user: SessionUser;
  totalAlerts: number;
  children: React.ReactNode;
}

export function AppLayoutShell({ user, totalAlerts, children }: AppLayoutShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100 relative">
      {/* Desktop Sidebar (lg: screens >= 1024px) */}
      <div className="hidden lg:block shrink-0">
        <AppSidebar user={user} />
      </div>

      {/* Mobile Drawer (phones / tablets < 1024px) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Slide-over sidebar container */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <AppSidebar
              user={user}
              isMobile
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        <AppHeader
          user={user}
          totalAlerts={totalAlerts}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto w-full">{children}</main>
      </div>
    </div>
  );
}
