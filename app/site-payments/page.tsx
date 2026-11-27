'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getClientErpRole } from '@/lib/erp-session';
import type { ErpRole } from '@/lib/rbac';

interface SitePaymentRow {
  id: string | number;
  project_name?: string | null;
  category?: string | null;
  payee_name?: string | null;
  amount?: number | string | null;
  payment_mode?: string | null;
  payment_date?: string | null;
  remarks?: string | null;
  created_at?: string | null;
  synced?: boolean;
}

const SITE_PAYMENTS_LOCAL_KEY = 'ue_site_daily_payments_v1';

function toNum(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(val) ? val : 0);
}

function readLocalPayments(): SitePaymentRow[] {
  try {
    const raw = localStorage.getItem(SITE_PAYMENTS_LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SitePaymentRow[]) : [];
  } catch {
    return [];
  }
}

function saveLocalPayments(rows: SitePaymentRow[]): void {
  try {
    localStorage.setItem(SITE_PAYMENTS_LOCAL_KEY, JSON.stringify(rows));
  } catch {}
}

export default function SitePaymentsPage() {
  const [role, setRole] = useState<ErpRole | null>(null);
  const [payments, setPayments] = useState<SitePaymentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [projectName, setProjectName] = useState<string>('');
  const [category, setCategory] = useState<string>('LABOR');
  const [payeeName, setPayeeName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('UPI');
  const [paymentDate, setPaymentDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [remarks, setRemarks] = useState<string>('');

  const syncPayments = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    const localRows = readLocalPayments();

    try {
      const { data, error } = await supabase
        .from('site_daily_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setErrorMsg(`Supabase notice: ${error.message}`);
        setPayments(localRows);
        return;
      }

      const dbRows: SitePaymentRow[] = Array.isArray(data)
        ? (data as SitePaymentRow[]).map((r) => ({ ...r, synced: true }))
        : [];

      const unsyncedLocal = localRows.filter((r) => r.synced === false);
      const merged = [...unsyncedLocal, ...dbRows];
      setPayments(merged);
      saveLocalPayments(merged);
    } catch {
      setPayments(localRows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setRole(getClientErpRole());
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    syncPayments();

    const onOnline = () => {
      setIsOnline(true);
      syncPayments();
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [syncPayments]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    setErrorMsg(null);

    const amtNum = Number(amount);
    const cleanProject = projectName.trim();
    const cleanPayee = payeeName.trim();

    if (!cleanProject || !cleanPayee || !Number.isFinite(amtNum) || amtNum <= 0) {
      setErrorMsg('Please enter Project/Site, Payee Name, and a valid Amount greater than 0.');
      setSubmitting(false);
      return;
    }

    const newEntry: SitePaymentRow = {
      id: Date.now(),
      project_name: cleanProject,
      category,
      payee_name: cleanPayee,
      amount: amtNum,
      payment_mode: paymentMode,
      payment_date: paymentDate || new Date().toISOString().slice(0, 10),
      remarks: remarks.trim() || '-',
      created_at: new Date().toISOString(),
      synced: false,
    };

    try {
      const { error } = await supabase.from('site_daily_payments').insert([
        {
          project_name: cleanProject,
          category,
          payee_name: cleanPayee,
          amount: amtNum,
          payment_mode: paymentMode,
          payment_date: newEntry.payment_date,
          remarks: newEntry.remarks,
        },
      ]);

      try {
        await supabase.from('erp_audit_logs').insert([
          {
            action: 'SITE_PAYMENT_LOGGED',
            module: 'SITE_DAILY_PAYMENTS',
            performed_by: `Role: ${role ?? 'Unauthenticated'}`,
            role_used: role ?? 'SITE_ENGINEER',
            details: `${cleanProject} | ${category} | ${cleanPayee} | ₹${amtNum} (${paymentMode})`,
          },
        ]);
      } catch {}

      if (error) {
        const nextList = [newEntry, ...payments];
        setPayments(nextList);
        saveLocalPayments(nextList);
        setStatusMsg(`Saved locally (${formatINR(amtNum)}). Will sync when DB allows.`);
      } else {
        await syncPayments();
        setStatusMsg(`Payment ${formatINR(amtNum)} synced to Supabase.`);
      }

      setPayeeName('');
      setAmount('');
      setRemarks('');
    } catch (err) {
      const nextList = [newEntry, ...payments];
      setPayments(nextList);
      saveLocalPayments(nextList);
      setErrorMsg(
        err instanceof Error
          ? `${err.message} — saved offline on device.`
          : 'Saved offline on device.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = useMemo(
    () => payments.reduce((sum, item) => sum + toNum(item.amount), 0),
    [payments]
  );

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-slate-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Top Header */}
        <div className="bg-[#0B1F3A] text-white rounded-2xl p-5 border-b-4 border-[#C59B27] shadow flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#E6C567] font-semibold">
              Universal Engicon Pvt. Ltd. • UE Site Pay
            </p>
            <h1 className="text-xl md:text-2xl font-bold mt-1">
              Daily Site Payment Tracker
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Role: <span className="text-[#E6C567] font-bold">{role ?? 'Active Session'}</span> •
              Total Logged: <span className="text-white font-bold">{formatINR(totalAmount)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
                isOnline
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isOnline ? 'Online' : 'Offline'}
            </span>

            <button
              type="button"
              onClick={syncPayments}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#143159] hover:bg-[#1c4275] text-white border border-[#C59B27]/50 text-xs font-bold uppercase"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#E6C567] ${loading ? 'animate-spin' : ''}`} />
              Sync
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#C59B27] hover:bg-[#d8ae37] text-[#0B1F3A] text-xs font-extrabold uppercase"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          </div>
        </div>

        {/* Payment Form */}
        <form
          onSubmit={handleAddPayment}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0B1F3A]">
            <Wallet className="w-4 h-4 text-[#C59B27]" />
            Record Site Payment
          </div>

          {statusMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-700" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Project / Site Name *
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Godrej Zen Estate Phase-2"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F7F4] border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0B1F3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F7F4] border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0B1F3A]"
              >
                <option value="LABOR">LABOR</option>
                <option value="STAFF">STAFF</option>
                <option value="VENDOR">VENDOR</option>
                <option value="PETTY_CASH">PETTY CASH</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Payee Name *
              </label>
              <input
                type="text"
                required
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="Laborer, contractor, or vendor name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F7F4] border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0B1F3A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F7F4] border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0B1F3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F7F4] border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0B1F3A]"
              >
                <option value="UPI">UPI</option>
                <option value="CASH">CASH</option>
                <option value="NEFT">NEFT</option>
                <option value="CHEQUE">CHEQUE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F7F4] border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0B1F3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Work / voucher note"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F7F4] border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0B1F3A]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] disabled:opacity-50 text-white font-extrabold text-sm shadow transition"
          >
            <PlusCircle className="w-4 h-4 text-[#E6C567]" />
            {submitting ? 'Saving...' : 'Save Site Payment'}
          </button>
        </form>

        {/* Entries List */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0B1F3A]">
            Recent Site Payments ({payments.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8F7F4] text-slate-600 uppercase border-b border-slate-200">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Project / Site</th>
                  <th className="py-2.5 px-3">Payee &amp; Category</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      {loading ? 'Loading payments...' : 'No site payments recorded yet.'}
                    </td>
                  </tr>
                ) : (
                  payments.map((row) => (
                    <tr key={String(row.id)} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-700">{row.payment_date || '-'}</td>
                      <td className="py-2.5 px-3 font-bold text-[#0B1F3A]">
                        {row.project_name || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <span className="font-semibold">{row.payee_name || '-'}</span> •{' '}
                        {row.category || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{row.payment_mode || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-[#0B1F3A]">
                        {formatINR(toNum(row.amount))}
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