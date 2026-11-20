'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  IndianRupee, TrendingUp, TrendingDown, Building2, 
  FileSpreadsheet, RefreshCw, ArrowUpRight, ArrowDownRight, Filter
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ProjectFinancial {
  project_id: number;
  project_name: string;
  total_inflow_revenue: number;
  total_outflow_expense: number;
  net_project_balance: number;
  output_gst: number;
  input_gst_credit: number;
}

interface LedgerEntry {
  id: string;
  entry_date: string;
  voucher_no: string;
  module_source: string;
  party_name: string;
  account_head: string;
  debit_amount: number;
  credit_amount: number;
  gst_amount: number;
  payment_mode: string;
  remarks: string;
  projects?: { name: string };
}

export default function FinanceMasterLedgerPage() {
  const [projectSummary, setProjectSummary] = useState<ProjectFinancial[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const loadLiveFinancials = async () => {
    setLoading(true);
    try {
      const [{ data: summaryData }, { data: ledgerData }] = await Promise.all([
        supabase.from('live_project_financials').select('*'),
        supabase
          .from('master_ledger')
          .select('*, projects(name)')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (summaryData) setProjectSummary(summaryData);
      if (ledgerData) setLedgerEntries(ledgerData);
    } catch (error) {
      console.error('Error fetching live ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveFinancials();
  }, []);

  // Company-Wide Totals
  const totalInflow = projectSummary.reduce((sum, item) => sum + Number(item.total_inflow_revenue || 0), 0);
  const totalOutflow = projectSummary.reduce((sum, item) => sum + Number(item.total_outflow_expense || 0), 0);
  const netBalance = totalInflow - totalOutflow;
  const netGstPayable = projectSummary.reduce(
    (sum, item) => sum + (Number(item.output_gst || 0) - Number(item.input_gst_credit || 0)),
    0
  );

  const filteredLedger = filterModule === 'ALL' 
    ? ledgerEntries 
    : ledgerEntries.filter((entry) => entry.module_source === filterModule);

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Master General Ledger & Live Balance Sheet</h1>
          <p className="text-sm text-slate-500">UNIVERSAL ENGICON PVT. LTD. • Real-Time Auto-Synced Financials</p>
        </div>
        <button
          onClick={loadLiveFinancials}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg shadow hover:bg-blue-700 transition-all active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Sync Live Data
        </button>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Inflow (RE Bookings)</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{formatINR(totalInflow)}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Outflow (Vendors + RA)</span>
            <TrendingDown className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{formatINR(totalOutflow)}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Net Cash / Project Position</span>
            <IndianRupee className="w-5 h-5" />
          </div>
          <p className={`text-2xl font-extrabold ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatINR(netBalance)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Net GST Liability (Out - In)</span>
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{formatINR(netGstPayable)}</p>
        </div>
      </div>

      {/* Project-Wise Balance Sheet / P&L Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2 bg-slate-100/70">
          <Building2 className="w-5 h-5 text-blue-700" />
          <h2 className="font-bold text-slate-800">Project-Wise Live P&L & GST Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <th className="py-3 px-4">Project / Site Name</th>
                <th className="py-3 px-4 text-right">Total Receipts (Cr)</th>
                <th className="py-3 px-4 text-right">Total Expenses (Dr)</th>
                <th className="py-3 px-4 text-right">Input GST Credit</th>
                <th className="py-3 px-4 text-right">Output GST</th>
                <th className="py-3 px-4 text-right">Net Site Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {projectSummary.map((proj) => (
                <tr key={proj.project_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{proj.project_name}</td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-medium">{formatINR(proj.total_inflow_revenue)}</td>
                  <td className="py-3 px-4 text-right text-rose-700 font-medium">{formatINR(proj.total_outflow_expense)}</td>
                  <td className="py-3 px-4 text-right text-slate-600">{formatINR(proj.input_gst_credit)}</td>
                  <td className="py-3 px-4 text-right text-slate-600">{formatINR(proj.output_gst)}</td>
                  <td className={`py-3 px-4 text-right font-bold ${proj.net_project_balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatINR(proj.net_project_balance)}
                  </td>
                </tr>
              ))}
              {projectSummary.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">No project financial records synced yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Master General Ledger Entries */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100/70">
          <h2 className="font-bold text-slate-800">Master General Ledger (Auto-Posted Vouchers)</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            {['ALL', 'VENDOR_PAYMENT', 'CONTRACTOR_RA', 'RE_BOOKING'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterModule(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border ${
                  filterModule === tab
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {tab === 'ALL' ? 'All Entries' : tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Voucher No</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Party Name</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4 text-right">Debit (Outflow)</th>
                <th className="py-3 px-4 text-right">Credit (Inflow)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLedger.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{item.entry_date}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-blue-700">{item.voucher_no}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      item.module_source === 'RE_BOOKING' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.module_source}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {item.party_name}
                    <div className="text-xs text-slate-400">{item.account_head}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{item.projects?.name || 'General HO'}</td>
                  <td className="py-3 px-4 text-right font-semibold text-rose-600">
                    {Number(item.debit_amount) > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" /> {formatINR(item.debit_amount)}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                    {Number(item.credit_amount) > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <ArrowDownRight className="w-3.5 h-3.5" /> {formatINR(item.credit_amount)}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
              {filteredLedger.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No ledger entries found. Add a Vendor Payment, Contractor RA Bill, or Real Estate Booking to test auto-sync!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}