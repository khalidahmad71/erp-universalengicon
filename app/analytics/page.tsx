'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  Building2,
  ShieldCheck,
  Wallet,
  Receipt,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jvorxidiigvdznnpgxrj.supabase.co"),
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key")
);

interface ProjectItem {
  id: number;
  name: string;
  budget: number;
  status?: string;
}

interface VendorBillItem {
  id: string;
  project_id: number;
  billed_taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  matching_status: string;
}

interface ContractorBillItem {
  id: string;
  project_id: number;
  gross_current_amount: number;
  retention_amount: number;
  tds_amount: number;
  net_payable_amount: number;
  approval_status: string;
}

interface PettyCashItem {
  id: string;
  project_id: number;
  entry_type: 'IMPREST_ISSUED' | 'SITE_EXPENSE';
  category: string;
  amount: number;
  approval_status: string;
}

export default function ExecutiveMISAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBillItem[]>([]);
  const [contractorBills, setContractorBills] = useState<ContractorBillItem[]>([]);
  const [pettyCash, setPettyCash] = useState<PettyCashItem[]>([]);
  const [realEstateCollections, setRealEstateCollections] = useState<number>(0);
  const [raRevenueTotal, setRaRevenueTotal] = useState<number>(0);

  const loadAllMISData = async () => {
    setLoading(true);
    const [projRes, vbRes, cbRes, pcRes, reRes, raRes] = await Promise.all([
      supabase.from('projects').select('id, name, budget, status'),
      supabase
        .from('vendor_bills')
        .select('id, project_id, billed_taxable_amount, cgst_amount, sgst_amount, matching_status'),
      supabase
        .from('contractor_mb_bills')
        .select('id, project_id, gross_current_amount, retention_amount, tds_amount, net_payable_amount, approval_status'),
      supabase
        .from('site_petty_cash')
        .select('id, project_id, entry_type, category, amount, approval_status'),
      supabase.from('customer_payments').select('amount'),
      supabase.from('ra_bills').select('total_amount'),
    ]);

    if (projRes.data) setProjects(projRes.data as ProjectItem[]);
    if (vbRes.data) setVendorBills(vbRes.data as VendorBillItem[]);
    if (cbRes.data) setContractorBills(cbRes.data as ContractorBillItem[]);
    if (pcRes.data) setPettyCash(pcRes.data as PettyCashItem[]);

    const reTotal = (reRes.data || []).reduce((sum, r: { amount?: number }) => sum + Number(r.amount || 0), 0);
    const raTotal = (raRes.data || []).reduce((sum, r: { total_amount?: number }) => sum + Number(r.total_amount || 0), 0);

    setRealEstateCollections(reTotal);
    setRaRevenueTotal(raTotal);
    setLoading(false);
  };

  useEffect(() => {
    loadAllMISData();
  }, []);

  // 1. Consolidated Outflows (Costs)
  const matchedMaterialCost = vendorBills
    .filter((b) => b.matching_status === 'MATCHED')
    .reduce((sum, b) => sum + Number(b.billed_taxable_amount || 0), 0);

  const blockedVendorHold = vendorBills
    .filter((b) => b.matching_status !== 'MATCHED')
    .reduce((sum, b) => sum + Number(b.billed_taxable_amount || 0), 0);

  const certifiedContractorCost = contractorBills.reduce(
    (sum, c) => sum + Number(c.gross_current_amount || 0),
    0
  );

  const totalRetentionReserve = contractorBills.reduce(
    (sum, c) => sum + Number(c.retention_amount || 0),
    0
  );

  const totalTdsLiability = contractorBills.reduce(
    (sum, c) => sum + Number(c.tds_amount || 0),
    0
  );

  const approvedPettyCashExpense = pettyCash
    .filter((p) => p.entry_type === 'SITE_EXPENSE' && p.approval_status === 'APPROVED')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalImprestIssued = pettyCash
    .filter((p) => p.entry_type === 'IMPREST_ISSUED' && p.approval_status === 'APPROVED')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // 2. Consolidated Inflows & Net Margin
  const totalContractPortfolio = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
  const totalRevenueInflow = raRevenueTotal + realEstateCollections;
  const totalDirectCost = matchedMaterialCost + certifiedContractorCost + approvedPettyCashExpense;
  const netOperatingSurplus = totalRevenueInflow - totalDirectCost;

  // 3. Cost Breakdown Percentages for Visual Bar Chart
  const costDenominator = totalDirectCost > 0 ? totalDirectCost : 1;
  const materialPct = Math.round((matchedMaterialCost / costDenominator) * 100);
  const contractorPct = Math.round((certifiedContractorCost / costDenominator) * 100);
  const pettyCashPct = Math.max(0, 100 - materialPct - contractorPct);

  // 4. Petty Cash Category Breakdown
  const pettyCategories = ['LOCAL_MATERIAL', 'DIESEL_FUEL', 'LABOR_KHARCHI', 'CARTAGE_UNLOADING', 'MISC_SITE'];
  const categoryTotals = pettyCategories.map((cat) => ({
    category: cat.replace('_', ' '),
    amount: pettyCash
      .filter((p) => p.entry_type === 'SITE_EXPENSE' && p.approval_status === 'APPROVED' && p.category === cat)
      .reduce((s, p) => s + Number(p.amount || 0), 0),
  }));
  const maxCategoryAmount = Math.max(...categoryTotals.map((c) => c.amount), 1);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      {/* Executive Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center">
        <div>
          <span className="text-xs font-bold tracking-wider text-blue-700 uppercase">
            Universal Engicon Pvt. Ltd. â€¢ Board &amp; MD Intelligence
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Executive MIS, Consolidated Cashflow &amp; Project Analytics
          </h1>
        </div>
        <button
          onClick={loadAllMISData}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Live ERP Data
        </button>
      </div>

      {/* Top 4 Executive Financial KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Order Book / Portfolio Value</p>
            <Building2 className="h-4 w-4 text-blue-700" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            ₹ {totalContractPortfolio.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-slate-400">{projects.length} Active Civil &amp; Real Estate Sites</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Total Realized Inflows</p>
            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-700">
            ₹ {totalRevenueInflow.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-slate-400">
            RA Bills: ₹{raRevenueTotal.toLocaleString('en-IN')} | Sales: ₹{realEstateCollections.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Verified Direct Outflows</p>
            <ArrowDownRight className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-rose-700">
            ₹ {totalDirectCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-slate-400">Material + Contractor MB + Site Cash</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Net Operating Cash Surplus</p>
            <TrendingUp className="h-4 w-4 text-blue-700" />
          </div>
          <p
            className={`mt-2 text-2xl font-extrabold ${
              netOperatingSurplus >= 0 ? 'text-blue-700' : 'text-amber-600'
            }`}
          >
            ₹ {netOperatingSurplus.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-slate-400">Live Project Cash Position</span>
        </div>
      </div>

      {/* Middle Analytics Charts Row */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Direct Construction Cost Mix */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <BarChart3 className="h-5 w-5 text-blue-700" /> Construction Cost Distribution
              </h2>
              <p className="text-xs text-slate-500">Share of Material, Sub-Contractors &amp; Site Petty Cash</p>
            </div>
          </div>

          {/* Stacked Bar */}
          <div className="mb-5 flex h-6 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              style={{ width: `${materialPct}%` }}
              className="bg-blue-600 transition-all"
              title={`Material: ${materialPct}%`}
            />
            <div
              style={{ width: `${contractorPct}%` }}
              className="bg-amber-500 transition-all"
              title={`Contractor MB: ${contractorPct}%`}
            />
            <div
              style={{ width: `${pettyCashPct}%` }}
              className="bg-emerald-500 transition-all"
              title={`Petty Cash: ${pettyCashPct}%`}
            />
          </div>

          {/* Legend & Exact Numbers */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-600" />
                <span className="font-semibold text-slate-700">3-Way Matched Material &amp; Vendors</span>
              </div>
              <div className="font-mono font-bold text-slate-900">
                ₹ {matchedMaterialCost.toLocaleString('en-IN')}{' '}
                <span className="text-xs text-slate-400">({materialPct}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="font-semibold text-slate-700">Contractor MB Certified Work</span>
              </div>
              <div className="font-mono font-bold text-slate-900">
                ₹ {certifiedContractorCost.toLocaleString('en-IN')}{' '}
                <span className="text-xs text-slate-400">({contractorPct}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-700">Approved Site Petty Cash</span>
              </div>
              <div className="font-mono font-bold text-slate-900">
                ₹ {approvedPettyCashExpense.toLocaleString('en-IN')}{' '}
                <span className="text-xs text-slate-400">({pettyCashPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Site Petty Cash Category Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Wallet className="h-5 w-5 text-emerald-700" /> Site Petty Cash Spend by Head
            </h2>
            <p className="text-xs text-slate-500">Approved field expenses across diesel, local material &amp; kharchi</p>
          </div>

          <div className="space-y-3">
            {categoryTotals.map((item) => {
              const barWidth = Math.round((item.amount / maxCategoryAmount) * 100);
              return (
                <div key={item.category}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.category}</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹ {item.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100">
                    <div
                      style={{ width: `${barWidth}%` }}
                      className="h-2.5 rounded-full bg-slate-800 transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Statutory & Risk Control Strip */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase">
            <ShieldCheck className="h-4 w-4" /> Leakage Prevented (3-Way Hold)
          </div>
          <p className="mt-1 font-mono text-xl font-extrabold text-rose-700">
            ₹ {blockedVendorHold.toLocaleString('en-IN')}
          </p>
          <p className="mt-0.5 text-xs text-rose-600">Over-billed or unverified vendor invoices blocked</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase">
            <Receipt className="h-4 w-4" /> Contractor Retention Security Held
          </div>
          <p className="mt-1 font-mono text-xl font-extrabold text-amber-700">
            ₹ {totalRetentionReserve.toLocaleString('en-IN')}
          </p>
          <p className="mt-0.5 text-xs text-amber-700">DLP guarantee reserve locked from RA bills</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-800 uppercase">
            <IndianRupee className="h-4 w-4" /> Statutory 194C TDS &amp; Site Imprest
          </div>
          <p className="mt-1 font-mono text-xl font-extrabold text-blue-800">
            TDS: ₹ {totalTdsLiability.toLocaleString('en-IN')}
          </p>
          <p className="mt-0.5 text-xs text-blue-700">
            Site Cash-in-Hand: ₹ {(totalImprestIssued - approvedPettyCashExpense).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Project-Wise Consolidated MIS Matrix */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">Project-Wise Consolidated Cost &amp; Budget Matrix</h2>
          <p className="text-xs text-slate-500">Live comparison of Contract Budget vs. Verified Actual Costs per Site</p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase">
            <tr>
              <th className="px-4 py-3">Site / Project Name</th>
              <th className="px-4 py-3 text-right">Sanctioned Budget (₹)</th>
              <th className="px-4 py-3 text-right">Material Cost (₹)</th>
              <th className="px-4 py-3 text-right">Contractor MB (₹)</th>
              <th className="px-4 py-3 text-right">Petty Cash (₹)</th>
              <th className="px-4 py-3 text-right">Total Spend (₹)</th>
              <th className="px-4 py-3 text-right">Budget Utilized</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No projects found in Supabase `projects` table.
                </td>
              </tr>
            ) : (
              projects.map((proj) => {
                const matCost = vendorBills
                  .filter((b) => Number(b.project_id) === Number(proj.id) && b.matching_status === 'MATCHED')
                  .reduce((s, b) => s + Number(b.billed_taxable_amount || 0), 0);

                const conCost = contractorBills
                  .filter((c) => Number(c.project_id) === Number(proj.id))
                  .reduce((s, c) => s + Number(c.gross_current_amount || 0), 0);

                const cashCost = pettyCash
                  .filter(
                    (p) =>
                      Number(p.project_id) === Number(proj.id) &&
                      p.entry_type === 'SITE_EXPENSE' &&
                      p.approval_status === 'APPROVED'
                  )
                  .reduce((s, p) => s + Number(p.amount || 0), 0);

                const totalSpend = matCost + conCost + cashCost;
                const budget = Number(proj.budget || 0);
                const utilization = budget > 0 ? ((totalSpend / budget) * 100).toFixed(1) : '0.0';

                return (
                  <tr key={proj.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{proj.name}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      ₹ {budget.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-blue-700">
                      ₹ {matCost.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-amber-700">
                      ₹ {conCost.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700">
                      ₹ {cashCost.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900">
                      ₹ {totalSpend.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          Number(utilization) > 90
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {utilization}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
