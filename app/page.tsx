'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import {
  Building2,
  ShoppingCart,
  FileSpreadsheet,
  ClipboardCheck,
  Landmark,
  Package,
  ArrowRight,
  HardHat,
  Receipt,
  TrendingUp,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ProjectSummary {
  id: string;
  name: string;
  budget: number;
  status?: string;
}

export default function MainDashboard() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [stats, setStats] = useState({
    projectsCount: 0,
    totalBudget: 0,
    poCount: 0,
    pendingBills: 0,
  });

  useEffect(() => {
    async function loadDashboard() {
      const [projRes, poRes, billRes] = await Promise.all([
        supabase.from('projects').select('id, name, budget, status'),
        supabase.from('purchase_orders').select('id'),
        supabase.from('vendor_bills').select('id').neq('matching_status', 'MATCHED'),
      ]);

      const projectList = (projRes.data as ProjectSummary[]) || [];
      const totalVal = projectList.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

      setProjects(projectList);
      setStats({
        projectsCount: projectList.length,
        totalBudget: totalVal,
        poCount: poRes.data?.length || 0,
        pendingBills: billRes.data?.length || 0,
      });
    }
    loadDashboard();
  }, []);

  const modules = [
    {
      name: 'Enterprise Finance & 3-Way Audit',
      href: '/finance',
      desc: 'PO = GRN = Vendor Bill Matching, GST Ledger & Live P&L',
      icon: Landmark,
    },
    {
      name: 'Purchase Orders (PO)',
      href: '/po',
      desc: 'Material procurement, vendor rates & GST orders',
      icon: ShoppingCart,
    },
    {
      name: 'Bill of Quantities (BOQ)',
      href: '/boq',
      desc: 'Project cost estimation & rate analysis',
      icon: FileSpreadsheet,
    },
    {
      name: 'Daily Progress Report (DPR)',
      href: '/dpr',
      desc: 'Site execution & daily work logs',
      icon: ClipboardCheck,
    },
    {
      name: 'Store Inventory & GRN',
      href: '/inventory',
      desc: 'Site stock receipts & material issues',
      icon: Package,
    },
    {
      name: 'Contractor Bills & MB',
      href: '/contractor-bills',
      desc: 'Measurement Book & RA billing',
      icon: Receipt,
    },
    {
      name: 'Labor Muster Roll',
      href: '/labor',
      desc: 'Site workforce attendance & wage sheets',
      icon: HardHat,
    },
    {
      name: 'Real Estate Sales & Milestones',
      href: '/milestones',
      desc: 'Unit booking & customer payment schedules',
      icon: Building2,
    },
    {
      name: 'Analytics & MIS Reports',
      href: '/analytics',
      desc: 'Executive cashflow & project performance insights',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mb-6 flex flex-col justify-between gap-2 border-b border-slate-200 pb-4 md:flex-row md:items-center">
        <div>
          <span className="text-xs font-bold tracking-wider text-blue-700 uppercase">
            Universal Engicon Pvt. Ltd. • MD Command Center
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">Executive ERP Dashboard</h1>
        </div>
        <Link
          href="/finance"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
        >
          Open Live P&amp;L &amp; 3-Way Audit <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Active Projects</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.projectsCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Contract Value</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">
            ₹ {stats.totalBudget.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Purchase Orders</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.poCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">3-Way Audit Holds</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">{stats.pendingBills}</p>
        </div>
      </div>

      {projects.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-bold tracking-wider text-slate-600 uppercase">
            Active Sites &amp; Projects
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {projects.map((proj) => (
              <div key={proj.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">{proj.name}</h3>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    {proj.status || 'ACTIVE'}
                  </span>
                </div>
                <p className="mt-2 font-mono text-sm font-semibold text-blue-700">
                  Budget: ₹ {Number(proj.budget || 0).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-4 text-sm font-bold tracking-wider text-slate-600 uppercase">
        Enterprise Modules
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-600 hover:shadow-md"
            >
              <div>
                <div className="mb-3 inline-flex rounded-lg bg-blue-50 p-2.5 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-700">{mod.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{mod.desc}</p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-700">
                Open Module <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}