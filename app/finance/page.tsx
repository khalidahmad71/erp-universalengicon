'use client';

import React, { useEffect, useState } from 'react';
import {
  Landmark,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  ReceiptIndianRupee,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getClientErpRole } from '@/lib/erp-session';
import type { ErpRole } from '@/lib/rbac';

interface LedgerEntry {
  id: string | number;
  voucher_no?: string;
  entry_type?: string;
  account_head?: string;
  party_name?: string;
  base_amount?: number;
  gst_amount?: number;
  total_amount?: number;
  description?: string;
  created_at?: string;
}

export default function FinanceGstLedgerPage() {
  const [role, setRole] = useState<ErpRole | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [voucherNo, setVoucherNo] = useState<string>('');
  const [entryType, setEntryType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [accountHead, setAccountHead] = useState<string>('Project Revenue / RA Receipt');
  const [partyName, setPartyName] = useState<string>('');
  const [baseAmount, setBaseAmount] = useState<string>('');
  const [gstRate, setGstRate] = useState<string>('18');
  const [description, setDescription] = useState<string>('');

  const generateVoucherNo = () => {
    const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `VCH-UEPL-${stamp}-${rand}`;
  };

  const loadLedger = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('finance_ledger')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setErrorMsg(`Supabase RLS / Query Notice: ${error.message}`);
        setEntries([]);
      } else if (Array.isArray(data)) {
        setEntries(data as LedgerEntry[]);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load finance ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRole(getClientErpRole());
    setVoucherNo(generateVoucherNo());
    loadLedger();
  }, []);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    setErrorMsg(null);

    const base = Number(baseAmount);
    const rate = Number(gstRate);

    if (!Number.isFinite(base) || base <= 0) {
      setErrorMsg('Please enter a valid taxable base amount greater than 0.');
      setSubmitting(false);
      return;
    }

    const gstAmt = Number(((base * rate) / 100).toFixed(2));
    const totalAmt = Number((base + gstAmt).toFixed(2));

    try {
      const { error } = await supabase.from('finance_ledger').insert([
        {
          voucher_no: voucherNo,
          entry_type: entryType,
          account_head: accountHead,
          party_name: partyName.trim() || 'General Account',
          base_amount: base,
          gst_amount: gstAmt,
          total_amount: totalAmt,
          description: description.trim() || `${entryType} voucher entry`,
        },
      ]);

      if (error) {
        setErrorMsg(`Insert blocked: ${error.message}`);
        setSubmitting(false);
        return;
      }

      try {
        await supabase.from('erp_audit_logs').insert([
          {
            action: 'FINANCE_VOUCHER_POSTED',
            module: 'FINANCE_GST_LEDGER',
            performed_by: `Role: ${role ?? 'Unauthenticated'}`,
            role_used: role ?? 'ACCOUNTANT',
            details: `${voucherNo} | ${entryType} | Base: ₹${base} + GST: ₹${gstAmt} = ₹${totalAmt}`,
          },
        ]);
      } catch {
        // Non-blocking audit insert
      }

      setStatusMsg(`Voucher ${voucherNo} posted (Total: ₹${totalAmt.toLocaleString('en-IN')}).`);
      setBaseAmount('');
      setPartyName('');
      setDescription('');
      setVoucherNo(generateVoucherNo());
      await loadLedger();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not post ledger voucher.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCredits = entries
    .filter((e) => (e.entry_type ?? '').toUpperCase() === 'CREDIT')
    .reduce((sum, e) => sum + Number(e.total_amount ?? e.base_amount ?? 0), 0);

  const totalDebits = entries
    .filter((e) => (e.entry_type ?? '').toUpperCase() === 'DEBIT')
    .reduce((sum, e) => sum + Number(e.total_amount ?? e.base_amount ?? 0), 0);

  const totalGst = entries.reduce((sum, e) => sum + Number(e.gst_amount ?? 0), 0);

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
              <Landmark className="w-4 h-4" />
              Double-Entry Accounting & GST Compliance
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
              Finance & GST Ledger — UNIVERSAL ENGICON PVT. LTD.
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Active Role:{' '}
              <span className="font-semibold text-amber-300">
                {role ?? 'Not Authenticated'}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={loadLedger}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold uppercase tracking-wider transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Ledger
          </button>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
              <span>Total Receipts (Credit)</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-2">
              {formatINR(totalCredits)}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
              <span>Total Expenses (Debit)</span>
              <ArrowUpRight className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-extrabold text-red-400 mt-2">
              {formatINR(totalDebits)}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
              <span>Net Cash Surplus / P&L</span>
              <Landmark className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-2">
              {formatINR(totalCredits - totalDebits)}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
              <span>Cumulative GST Tracked</span>
              <ReceiptIndianRupee className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400 mt-2">
              {formatINR(totalGst)}
            </div>
          </div>
        </div>

        {/* Post New Ledger Voucher */}
        <form
          onSubmit={handleCreateEntry}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
            Post Finance / GST Voucher
          </h2>

          {statusMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/70 border border-emerald-700 text-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/70 border border-red-700 text-red-200 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Voucher No.
              </label>
              <input
                type="text"
                required
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Voucher Type
              </label>
              <select
                value={entryType}
                onChange={(e) => setEntryType(e.target.value as 'CREDIT' | 'DEBIT')}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="CREDIT">CREDIT (Receipt / Inflow)</option>
                <option value="DEBIT">DEBIT (Vendor / Expense)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Account Head
              </label>
              <input
                type="text"
                required
                value={accountHead}
                onChange={(e) => setAccountHead(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Vendor / Customer Name
              </label>
              <input
                type="text"
                required
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder="Party or client name"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Taxable Base Amount (₹)
              </label>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={baseAmount}
                onChange={(e) => setBaseAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                GST Slab (%)
              </label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="0">0% (Exempt / Nil)</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST (Standard Works/Services)</option>
                <option value="28">28% GST</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Narration / Invoice Ref
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="3-way matched invoice or receipt note"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm shadow-lg transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            {submitting ? 'Posting Voucher...' : 'Post Ledger Entry'}
          </button>
        </form>

        {/* Ledger Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
              General Ledger & GST Register ({entries.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <th className="py-3 px-4">Voucher</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Account / Party</th>
                  <th className="py-3 px-4 text-right">Base (₹)</th>
                  <th className="py-3 px-4 text-right">GST (₹)</th>
                  <th className="py-3 px-4 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {loading
                        ? 'Loading ledger entries...'
                        : 'No entries found or RLS restricted for current role.'}
                    </td>
                  </tr>
                ) : (
                  entries.map((row) => (
                    <tr key={String(row.id)} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white">
                        {row.voucher_no ?? `#${row.id}`}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            (row.entry_type ?? '').toUpperCase() === 'CREDIT'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-red-500/15 text-red-300'
                          }`}
                        >
                          {row.entry_type ?? 'ENTRY'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">
                          {row.account_head ?? '-'}
                        </div>
                        <div className="text-slate-400">{row.party_name ?? ''}</div>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">
                        {formatINR(Number(row.base_amount ?? 0))}
                      </td>
                      <td className="py-3 px-4 text-right text-amber-300">
                        {formatINR(Number(row.gst_amount ?? 0))}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        {formatINR(Number(row.total_amount ?? row.base_amount ?? 0))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}