'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Building2, ShieldCheck } from 'lucide-react';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MENU_ITEMS = [
  { name: 'Main Dashboard', href: '/', section: 'EXECUTIVE' },
  { name: 'Analytics & MIS', href: '/analytics', section: 'EXECUTIVE' },

  { name: 'Bill of Quantities (BOQ)', href: '/boq', section: 'PROCUREMENT & STORE' },
  { name: 'Cost Estimation', href: '/estimation', section: 'PROCUREMENT & STORE' },
  { name: 'Material Request (MR)', href: '/mr', section: 'PROCUREMENT & STORE' },
  { name: 'Purchase Orders (PO)', href: '/po', section: 'PROCUREMENT & STORE' },
  { name: 'Store Inventory & GRN', href: '/inventory', section: 'PROCUREMENT & STORE' },
  { name: 'Plant & Machinery', href: '/machinery', section: 'PROCUREMENT & STORE' },
  { name: 'Fixed Assets', href: '/assets', section: 'PROCUREMENT & STORE' },

  { name: 'Daily Progress Report (DPR)', href: '/dpr', section: 'SITE EXECUTION' },
  { name: 'Project Timeline', href: '/timeline', section: 'SITE EXECUTION' },
  { name: 'MB & Contractor Bills', href: '/contractor-bills', section: 'SITE EXECUTION' },
  { name: 'MB Bills Archive', href: '/mb-bills', section: 'SITE EXECUTION' },
  { name: 'Labor Muster Roll', href: '/labor', section: 'SITE EXECUTION' },

  { name: 'Enterprise Finance & 3-Way Audit', href: '/finance', section: 'FINANCE & LEGAL' },
  { name: 'Site Petty Cash', href: '/petty-cash', section: 'FINANCE & LEGAL' },
  { name: 'GST & Statutory Compliance', href: '/compliance', section: 'FINANCE & LEGAL' },

  { name: 'Real Estate Milestones', href: '/milestones', section: 'REAL ESTATE & HR' },
  { name: 'Customer Ledger', href: '/customer-ledger', section: 'REAL ESTATE & HR' },
  { name: 'Customer Payments', href: '/customer-payments', section: 'REAL ESTATE & HR' },
  { name: 'HR & Payroll', href: '/hr', section: 'REAL ESTATE & HR' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const sections = [
    'EXECUTIVE',
    'PROCUREMENT & STORE',
    'SITE EXECUTION',
    'FINANCE & LEGAL',
    'REAL ESTATE & HR',
  ];

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-slate-100 md:flex">
      <div className="border-b border-slate-800 p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold tracking-wide text-white uppercase">
              Universal Engicon
            </h2>
            <p className="text-[11px] text-slate-400">Enterprise ERP v2.0</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-4">
        {sections.map((section) => {
          const items = MENU_ITEMS.filter((item) => item.section === section);
          return (
            <div key={section}>
              <p className="mb-2 px-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {section}
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-lg px-3 py-2 text-xs font-medium transition ${
                        isActive
                          ? 'bg-blue-600 font-semibold text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span className="font-semibold">Supabase Live Sync</span>
        </div>
        <p className="mt-1 text-[11px]">MD Command Access</p>
      </div>
    </aside>
  );
}