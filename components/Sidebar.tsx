'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileSpreadsheet,
  ClipboardCheck,
  ShoppingCart,
  PackageCheck,
  Warehouse,
  HardHat,
  Building2,
  Building,
  Landmark,
  ShieldCheck,
  History,
  Users,
  Truck,
  ChevronDown,
  ChevronRight,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { canAccessRoute, type ErpRole } from '@/lib/rbac';
import { clearErpRoleSession, getClientErpRole } from '@/lib/erp-session';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Command Center',
    href: '/',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: 'MD Approval Center',
    href: '/md-approvals',
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    label: 'BOQ & Estimates',
    href: '/boq',
    icon: <FileSpreadsheet className="w-4 h-4" />,
  },
  {
    label: 'Daily Progress (DPR)',
    href: '/dpr',
    icon: <ClipboardCheck className="w-4 h-4" />,
  },
  {
    label: 'Material Requests (MR)',
    href: '/mr',
    icon: <ClipboardCheck className="w-4 h-4" />,
  },
  {
    label: 'Purchase Orders (PO)',
    href: '/po',
    icon: <ShoppingCart className="w-4 h-4" />,
  },
  {
    label: 'Central Store & GRN',
    href: '/grn',
    icon: <PackageCheck className="w-4 h-4" />,
  },
  {
    label: 'Inventory Stock',
    href: '/inventory',
    icon: <Warehouse className="w-4 h-4" />,
  },
  {
    label: 'Contractor RA Billing',
    href: '/mb-bills',
    icon: <HardHat className="w-4 h-4" />,
  },
  {
    label: 'Real Estate Sales',
    href: '/sales',
    icon: <Building2 className="w-4 h-4" />,
    children: [
      { label: 'Unit Matrix & Receipts', href: '/sales' },
      { label: 'CLP Milestones', href: '/milestones' },
    ],
  },
  {
    label: 'Bank & Treasury',
    href: '/bank',
    icon: <Building className="w-4 h-4" />,
  },
  {
    label: 'Finance & GST Ledger',
    href: '/finance',
    icon: <Landmark className="w-4 h-4" />,
  },
  {
    label: 'Plant & Machinery',
    href: '/machinery',
    icon: <Truck className="w-4 h-4" />,
  },
  {
    label: 'HR & Payroll',
    href: '/hr',
    icon: <Users className="w-4 h-4" />,
  },
  {
    label: 'System Audit Logs',
    href: '/audit-logs',
    icon: <History className="w-4 h-4" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<ErpRole | null>(null);
  const [salesOpen, setSalesOpen] = useState(true);

  useEffect(() => {
    setRole(getClientErpRole());
  }, [pathname]);

  const handleLogout = () => {
    clearErpRoleSession();
    router.push('/login');
    router.refresh();
  };

  const visibleItems = NAV_ITEMS.filter((item) =>
    role ? canAccessRoute(role, item.href) : true
  );

  return (
    <aside className="w-72 h-screen sticky top-0 shrink-0 bg-slate-950 text-slate-100 border-r border-slate-800 flex flex-col justify-between overflow-hidden select-none shadow-2xl">
      <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 shrink-0">
        <div className="text-[11px] font-bold tracking-widest text-amber-400 uppercase">
          Enterprise ERP Portal
        </div>
        <div className="text-base font-extrabold text-white tracking-tight mt-0.5">
          UNIVERSAL ENGICON PVT. LTD.
        </div>
        <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700/80 shadow-inner">
          <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-200 truncate">
            Role: {role ?? 'Not Authenticated'}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.children && item.children.some((c) => pathname === c.href));

          if (item.children) {
            return (
              <div key={item.label} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSalesOpen((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold border transition-all duration-150 shadow-md ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/20'
                      : 'bg-slate-900/90 text-slate-200 border-slate-800 hover:bg-slate-800 hover:border-amber-500/50 hover:text-amber-300'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    {item.label}
                  </span>
                  {salesOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {salesOpen && (
                  <div className="pl-5 space-y-1 border-l-2 border-slate-800 ml-3">
                    {item.children.map((sub) => {
                      const subActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`block px-3 py-2 rounded-md text-xs font-semibold border transition-all ${
                            subActive
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-900/50 text-slate-300 border-transparent hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold border transition-all duration-150 shadow-md ${
                isActive
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/20'
                  : 'bg-slate-900/90 text-slate-200 border-slate-800 hover:bg-slate-800 hover:border-amber-500/50 hover:text-amber-300'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/60 shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-950/60 hover:bg-red-600 text-red-200 hover:text-white border border-red-800/70 font-bold text-xs uppercase tracking-wider shadow-md transition-all"
        >
          <LogOut className="w-4 h-4" />
          Switch Role / Sign Out
        </button>
      </div>
    </aside>
  );
}