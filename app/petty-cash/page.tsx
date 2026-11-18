'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Wallet,
  Plus,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PettyCashEntry {
  id: string;
  voucher_no: string;
  expense_date: string;
  project_id: number;
  entry_type: 'IMPREST_ISSUED' | 'SITE_EXPENSE';
  category: string;
  description: string;
  paid_to: string;
  bill_ref_no: string;
  amount: number;
  approval_status: 'PENDING_MD' | 'APPROVED' | 'REJECTED';
  projects?: { name: string };
}

export default function SitePettyCashPage() {
  const [entries, setEntries] = useState<PettyCashEntry[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    voucher_no: '',
    expense_date: new Date().toISOString().split('T')[0],
    project_id: '',
    entry_type: 'SITE_EXPENSE' as 'IMPREST_ISSUED' | 'SITE_EXPENSE',
    category: 'LOCAL_MATERIAL',
    description: '',
    paid_to: '',
    bill_ref_no: '',
    amount: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    const [cashRes, projRes] = await Promise.all([
      supabase
        .from('site_petty_cash')
        .select('*, projects(name)')
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name'),
    ]);

    if (cashRes.data) setEntries(cashRes.data as PettyCashEntry[]);
    if (projRes.data) setProjects(projRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('site_petty_cash').insert([
      {
        voucher_no: formData.voucher_no,
        expense_date: formData.expense_date,
        project_id: formData.project_id ? Number(formData.project_id) : null,
        entry_type: formData.entry_type,
        category: formData.entry_type === 'IMPREST_ISSUED' ? 'HEAD_OFFICE_FUND' : formData.category,
        description: formData.description,
        paid_to: formData.paid_to,
        bill_ref_no: formData.bill_ref_no,
        amount: Number(formData.amount),
        approval_status: formData.entry_type === 'IMPREST_ISSUED' ? 'APPROVED' : 'PENDING_MD',
      },
    ]);

    if (!error) {
      setShowModal(false);
      setFormData({
        voucher_no: '',
        expense_date: new Date().toISOString().split('T')[0],
        project_id: '',
        entry_type: 'SITE_EXPENSE',
        category: 'LOCAL_MATERIAL',
        description: '',
        paid_to: '',
        bill_ref_no: '',
        amount: 0,
      });
      fetchData();
    } else {
      alert('Error saving voucher: ' + error.message);
    }
  };

  const handleApproval = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await supabase.from('site_petty_cash').update({ approval_status: status }).eq('id', id);
    fetchData();
  };

  // Cashbook Totals
  const totalImprestIssued = entries
    .filter((e) => e.entry_type === 'IMPREST_ISSUED' && e.approval_status === 'APPROVED')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalApprovedExpenses = entries
    .filter((e) => e.entry_type === 'SITE_EXPENSE' && e.approval_status === 'APPROVED')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const pendingApprovalsAmount = entries
    .filter((e) => e.entry_type === 'SITE_EXPENSE' && e.approval_status === 'PENDING_MD')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const netSiteCashInHand = totalImprestIssued - totalApprovedExpenses;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center">
        <div>
          <span className="text-xs font-bold tracking-wider text-blue-700 uppercase">
            Universal Engicon Pvt. Ltd. • Site Imprest Control
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Site Petty Cash &amp; Daily Expense Ledger
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> New Cash Voucher / Fund Issue
        </button>
      </div>

      {/* KPI Strip */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Imprest Issued (HO)</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">
            ₹ {totalImprestIssued.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-slate-400">Cash given to Site Engineers</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Approved Site Expenses</p>
          <p className="mt-1 text-2xl font-bold text-rose-700">
            ₹ {totalApprovedExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-slate-400">Verified &amp; booked to Project</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Net Cash-in-Hand at Sites</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              netSiteCashInHand >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            ₹ {netSiteCashInHand.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-slate-400">Unspent Imprest Balance</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Pending MD Approval</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            ₹ {pendingApprovalsAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-slate-400">Awaiting voucher audit</span>
        </div>
      </div>

      {/* Petty Cash Register Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading site cashbook...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3">Date &amp; Voucher</th>
                <th className="px-4 py-3">Site / Project</th>
                <th className="px-4 py-3">Type &amp; Category</th>
                <th className="px-4 py-3">Particulars &amp; Payee</th>
                <th className="px-4 py-3 text-right">Amount (₹)</th>
                <th className="px-4 py-3">Audit Status</th>
                <th className="px-4 py-3 text-right">MD Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No petty cash vouchers recorded yet. Click &quot;New Cash Voucher&quot; to begin.
                  </td>
                </tr>
              ) : (
                entries.map((item) => {
                  const isInflow = item.entry_type === 'IMPREST_ISSUED';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{item.voucher_no}</div>
                        <div className="text-xs text-slate-500">{item.expense_date}</div>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-700">
                        {item.projects?.name || 'Head Office'}
                      </td>

                      <td className="px-4 py-3">
                        {isInflow ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                            <ArrowDownLeft className="h-3.5 w-3.5" /> IMPREST FUND (+)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                            <ArrowUpRight className="h-3.5 w-3.5" /> {item.category}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-slate-900">{item.description}</div>
                        <div className="text-xs text-slate-500">
                          {isInflow ? 'Issued To:' : 'Paid To:'} <strong>{item.paid_to}</strong>
                          {item.bill_ref_no && ` • Ref: ${item.bill_ref_no}`}
                        </div>
                      </td>

                      <td
                        className={`px-4 py-3 text-right font-mono font-bold ${
                          isInflow ? 'text-blue-700' : 'text-rose-700'
                        }`}
                      >
                        {isInflow ? '+' : '-'} ₹ {Number(item.amount).toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3">
                        {item.approval_status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" /> APPROVED
                          </span>
                        )}
                        {item.approval_status === 'PENDING_MD' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                            <Clock className="h-3.5 w-3.5" /> PENDING MD
                          </span>
                        )}
                        {item.approval_status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                            <XCircle className="h-3.5 w-3.5" /> REJECTED
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {item.approval_status === 'PENDING_MD' ? (
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => handleApproval(item.id, 'APPROVED')}
                              className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproval(item.id, 'REJECTED')}
                              className="rounded bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Audited</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: New Cash Voucher */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSaveEntry} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Wallet className="h-5 w-5 text-blue-700" /> Record Petty Cash Voucher
            </h2>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="mb-1 block font-semibold">Voucher Type *</label>
                <select
                  className="w-full rounded border p-2 font-semibold"
                  value={formData.entry_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      entry_type: e.target.value as 'IMPREST_ISSUED' | 'SITE_EXPENSE',
                    })
                  }
                >
                  <option value="SITE_EXPENSE">Site Cash Expense (-)</option>
                  <option value="IMPREST_ISSUED">Issue Imprest Cash (+)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold">Voucher Number *</label>
                <input
                  required
                  className="w-full rounded border p-2"
                  placeholder="PCV-2026-001"
                  value={formData.voucher_no}
                  onChange={(e) => setFormData({ ...formData, voucher_no: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">Project / Site *</label>
                <select
                  required
                  className="w-full rounded border p-2"
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                >
                  <option value="">-- Select Site --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold">Date *</label>
                <input
                  type="date"
                  required
                  className="w-full rounded border p-2"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                />
              </div>

              {formData.entry_type === 'SITE_EXPENSE' && (
                <div className="col-span-2">
                  <label className="mb-1 block font-semibold">Expense Head</label>
                  <select
                    className="w-full rounded border p-2"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="LOCAL_MATERIAL">Urgent Local Hardware / Material</option>
                    <option value="DIESEL_FUEL">DG Set / Machinery Diesel &amp; Fuel</option>
                    <option value="LABOR_KHARCHI">Daily Labor Kharchi / Tea &amp; Snacks</option>
                    <option value="CARTAGE_UNLOADING">Local Auto / Tempo Unloading</option>
                    <option value="MISC_SITE">Misc. Site Office Expense</option>
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block font-semibold">
                  {formData.entry_type === 'IMPREST_ISSUED' ? 'Site Engineer Name *' : 'Paid To (Vendor/Person) *'}
                </label>
                <input
                  required
                  className="w-full rounded border p-2"
                  placeholder="Name"
                  value={formData.paid_to}
                  onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">Bill / Slip Ref No.</label>
                <input
                  className="w-full rounded border p-2"
                  placeholder="Receipt # / UPI Ref"
                  value={formData.bill_ref_no}
                  onChange={(e) => setFormData({ ...formData, bill_ref_no: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block font-semibold">Work / Expense Description *</label>
                <input
                  required
                  className="w-full rounded border p-2"
                  placeholder="e.g. 40L Diesel for Concrete Mixer & Vibrator"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block font-semibold text-blue-800">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full rounded border-2 border-blue-600 p-2 font-mono font-bold"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
                Save Voucher
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}