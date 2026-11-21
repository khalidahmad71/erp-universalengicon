'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  LayoutDashboard,
  Building2,
  FileSpreadsheet,
  ClipboardList,
  ShoppingCart,
  Package,
  FileCheck2,
  Receipt,
  IndianRupee,
  Home,
  Truck,
  Users,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 1. Role-Based Route Access Rules
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'], // Full ERP Access
  md: ['*'],    // Full ERP Access
  accountant: [
    '/dashboard',
    '/finance',
    '/po',
    '/purchase-orders',
    '/ra',
    '/real-estate',
    '/sales',
  ],
  site_engineer: [
    '/dashboard',
    '/projects',
    '/boq',
    '/mr',
    '/dpr',
    '/inventory',
    '/store',
    '/machinery',
  ],
  store_manager: [
    '/dashboard',
    '/inventory',
    '/store',
    '/mr',
    '/po',
    '/purchase-orders',
  ],
};

export function canAccessRoute(userRole: string | undefined, routePath: string): boolean {
  const role = (userRole || 'site_engineer').toLowerCase();
  const allowedRoutes = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.site_engineer;
  if (allowedRoutes.includes('*')) return true;
  return allowedRoutes.some((allowed) => routePath === allowed || routePath.startsWith(allowed + '/'));
}

// 2. All Universal Engicon ERP Modules (With MD Approval Center at Top)
const MENU_ITEMS = [
  { label: 'MD Approval Center', href: '/approvals', icon: ShieldCheck },
  { label: 'Executive Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects & Sites', href: '/projects', icon: Building2 },
  { label: 'BOQ & Estimation', href: '/boq', icon: FileSpreadsheet },
  { label: 'Material Requests (MR)', href: '/mr', icon: ClipboardList },
  { label: 'Purchase Orders (PO)', href: '/po', icon: ShoppingCart },
  { label: 'Store & Inventory (GRN)', href: '/store', icon: Package },
  { label: 'Daily Progress (DPR)', href: '/dpr', icon: FileCheck2 },
  { label: 'Contractor RA Bills', href: '/ra', icon: Receipt },
  { label: 'Finance & Master Ledger', href: '/finance', icon: IndianRupee },
  { label: 'Real Estate Sales', href: '/sales', icon: Home },
  { label: 'Plant & Machinery', href: '/machinery', icon: Truck },
  { label: 'HR & Muster Roll', href: '/users', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>('admin');
  const [userEmail, setUserEmail] = useState<string>('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (pathname === '/login' || pathname === '/') return;

    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role) {
          setUserRole(profile.role.toLowerCase());
        }
      }
    };
    fetchUserRole();
  }, [pathname]);

  if (pathname === '/login' || pathname === '/') {
    return null;
  }

  const handleLogout = async () => {
    document.cookie = 'ue_session=; path=/; max-age=0';
    document.cookie = 'ue_role=; path=/; max-age=0';
    document.cookie = 'sb-access-token=; path=/; max-age=0';
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const visibleMenuItems = MENU_ITEMS.filter((item) => canAccessRoute(userRole, item.href));

  return (
    <>
      {/* Mobile Header Toggle */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40 shadow-sm print:hidden">
        <div>
          <span className="font-extrabold text-slate-900 tracking-tight text-base">UNIVERSAL ENGICON</span>
          <span className="block text-[10px] font-semibold text-blue-700 uppercase">Enterprise ERP</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 shadow-sm"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-68 bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 print:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Company Brand Header */}
        <div className="p-5 bg-white border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-800 text-white flex items-center justify-center font-black text-lg shadow">
              UE
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm leading-tight tracking-wide">
                UNIVERSAL ENGICON
              </h2>
              <p className="text-[11px] font-semibold text-slate-500">PVT. LTD. • ERP SYSTEM</p>
            </div>
          </div>

          {/* Active Role Badge */}
          <div className="mt-3 px-2.5 py-1.5 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase text-blue-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              {userRole.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-slate-500 truncate max-w-[110px]" title={userEmail}>
              {userEmail}
            </span>
          </div>
        </div>

        {/* Embossed Button-Style Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                  isActive
                    ? 'bg-blue-800 text-white border-blue-900 shadow-md translate-x-0.5'
                    : 'bg-white text-slate-700 border-slate-200/90 shadow-sm hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-3 bg-white border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 shadow-sm hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}