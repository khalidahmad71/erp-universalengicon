"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Sidebar from "./Sidebar";

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isLoginPage = pathname === "/login" || pathname.startsWith("/login/");
  if (isLoginPage) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F8F7F4]">
      <div className="md:hidden sticky top-0 z-40 bg-[#0B1F3A] text-white px-4 py-2.5 flex items-center justify-between border-b border-[#C59B27]">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-bold text-white border border-white/20"
        >
          {mobileMenuOpen ? "✕ Close Menu" : "☰ ERP Menu"}
        </button>

        <Link
          href="/site-payments"
          className="px-3 py-1.5 rounded-lg bg-[#C59B27] text-[#0B1F3A] text-xs font-extrabold"
        >
          Site Payments
        </Link>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 max-w-[82vw] h-full overflow-y-auto bg-[#0B1F3A] shadow-2xl">
            <div className="p-3 flex justify-between items-center border-b border-white/10">
              <Link
                href="/site-payments"
                className="px-3 py-1.5 rounded-lg bg-[#C59B27] text-[#0B1F3A] text-xs font-extrabold"
              >
                Site Daily Payments
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-1 rounded bg-white/10 text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>
            <Sidebar />
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>

      <div className="flex-1 min-w-0 w-full">{children}</div>
    </div>
  );
}