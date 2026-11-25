'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Landmark,
  PackageCheck,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getClientErpRole } from '@/lib/erp-session';
import type { ErpRole } from '@/lib/rbac';

interface DashboardMetrics {
  projectsCount: number;
  totalProjectValue: number;
  storeItemsCount: number;
  ledgerEntriesCount: number;
}

export default function HomePage() {
  const [role, setRole] = useState<ErpRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    projectsCount: 0,
    totalProjectValue: 0,
    storeItemsCount: 0,
    ledgerEntriesCount: 0,
  });

  const loadDashboardMetrics = async () => {
    setLoading(true);
    try {
      const [projectsRes, materialsRes, ledgerRes] = await Promise.allSettled([
        supabase.from('projects').select('id, budget, contract_value'),
        supabase.from('materials').select('id'),
        supabase.from('finance_ledger').select('id'),
      ]);

      let projectsCount = 0;
      let totalProjectValue = 0;

      if (projectsRes.status === 'fulfilled' && Array.isArray(projectsRes.value.data)) {
        projectsCount = projectsRes.value.data.length;
        totalProjectValue = projectsRes.value.data.reduce((sum, row: Record<string, unknown>) => {
          const val = Number(row.contract_value ?? row.budget ?? 0);
          return sum + (Number.isFinite(val) ? val : 0);
        }, 0);
      }

      const storeItemsCount =
        materialsRes.status === 'fulfilled' && Array.isArray(materialsRes.value.data)
          ? materialsRes.value.data.length
          : 0;

      const ledgerEntriesCount =
        ledgerRes.status === 'fulfilled' && Array.isArray(ledgerRes.value.data)
          ? ledgerRes.value.data.length
          : 0;

      setMetrics({
        projectsCount,
        totalProjectValue,
        storeItemsCount,
        ledgerEntriesCount,
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRole(getClientErpRole());
    loadDashboardMetrics();
  }, []);

  const formatINR = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Executive Command Center
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
              UNIVERSAL ENGICON PVT. LTD.
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Active Session Role:{' '}
              <span className="font-semibold text-amber-300">
                {role ?? 'Standard Session'}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboardMetrics}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold uppercase tracking-wider transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Live Data
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl p-5 shadow-lg transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Active Projects</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white mt-3">
              {loading ? '...' : metrics.projectsCount}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Infrastructure & Real Estate Sites
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl p-5 shadow-lg transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Total Portfolio Value</span>
              <Landmark className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400 mt-3">
              {loading ? '...' : formatINR(metrics.totalProjectValue)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Contract / BOQ Allocation
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl p-5 shadow-lg transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Store Catalog Items</span>
              <PackageCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white mt-3">
              {loading ? '...' : metrics.storeItemsCount}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Central Store & Material Master
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl p-5 shadow-lg transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Finance Ledger Entries</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white mt-3">
              {loading ? '...' : metrics.ledgerEntriesCount}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              RLS-Protected Accounting Records
            </div>
          </div>
        </div>

        {/* Quick Module Shortcuts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4">
            Core Operational Modules
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[
              { title: 'BOQ & Estimates', href: '/boq', desc: 'Budget locks & quantity schedules' },
              { title: 'Purchase Orders (PO)', href: '/po', desc: 'Vendor procurement & GST orders' },
              { title: 'Central Store & GRN', href: '/grn', desc: 'Material receipts & stock issue' },
              { title: 'Contractor RA Billing', href: '/billing', desc: 'Measurement book & retention' },
              { title: 'Real Estate Sales', href: '/sales', desc: 'Unit matrix & customer receipts' },
              { title: 'Finance & GST Ledger', href: '/finance', desc: 'Double-entry ledger & P&L' },
            ].map((mod) => (
              <Link
                key={mod.href}
                href={mod.href}
                className="group flex items-center justify-between p-4 rounded-lg bg-slate-950/90 border border-slate-800 hover:border-amber-400/70 hover:bg-slate-800/70 transition-all"
              >
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    {mod.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{mod.desc}</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}