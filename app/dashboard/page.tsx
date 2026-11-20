'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  ShoppingCart,
  Package,
  ClipboardCheck,
  Landmark,
  Users,
  ShieldCheck,
  LogOut,
  Building2,
  BarChart3,
  Wrench,
  Receipt,
} from 'lucide-react';

export default function ExecutiveDashboardPage() {
  const modules = [
    { name: 'Bill of Quantities (BOQ)', href: '/boq', desc: 'Project estimates & item rates', icon: FileSpreadsheet },
    { name: 'Purchase Orders (PO)', href: '/po', desc: 'Vendor procurement & GST orders', icon: ShoppingCart },
    { name: 'Store Inventory & GRN', href: '/inventory', desc: 'Material stock & site inward', icon: Package },
    { name: 'Daily Progress Report (DPR)', href: '/dpr', desc: 'Daily site execution & labor logs', icon: ClipboardCheck },
    { name: 'Finance & General Ledger', href: '/finance', desc: '3-Way audit, GST & retention ledger', icon: Landmark },
    { name: 'Contractor Bills & MB', href: '/contractor-bills', desc: 'Measurement books & work orders', icon: Receipt },
    { name: 'Labor Muster Roll & HR', href: '/labor', desc: 'Attendance, wages & site staff', icon: Users },
    { name: 'Plant & Machinery', href: '/machinery', desc: 'Equipment logs & fuel tracking', icon: Wrench },
    { name: 'Project Analytics', href: '/analytics', desc: 'Cost vs budget & progress insights', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-800">
                Universal Engicon Pvt. Ltd.
              </span>
              <h1 className="text-2xl font-black text-slate-900">Executive ERP Command Center</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" /> MD Command Access
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-blue-900 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Public Website
            </Link>
          </div>
        </div>

        {/* ERP Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.name}
                href={mod.href}
                className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center mb-4 group-hover:bg-blue-900 group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-900">
                  {mod.name}
                </h2>
                <p className="text-xs text-slate-500 mt-1">{mod.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}