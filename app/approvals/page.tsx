'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ShoppingCart,
  Receipt,
  RefreshCw,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MDApprovalsPage() {
  const [pendingPOs, setPendingPOs] = useState<any[]>([]);
  const [pendingBills, setPendingBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadPendingApprovals = async () => {
    setLoading(true);
    const [{ data: pos }, { data: bills }] = await Promise.all([
      supabase
        .from('purchase_orders')
        .select('*, projects(name)')
        .or('approval_status.eq.Pending MD Approval,approval_status.is.null')
        .order('created_at', { ascending: false }),
      supabase
        .from('ra_bills')
        .select('*, projects(name)')
        .or('approval_status.eq.Pending MD Approval,approval_status.is.null')
        .order('created_at', { ascending: false }),
    ]);

    if (pos) setPendingPOs(pos);
    if (bills) setPendingBills(bills);
    setLoading(false);
  };

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const handleDecision = async (
    table: 'purchase_orders' | 'ra_bills',
    id: number | string,
    decision: 'Approved' | 'Rejected'
  ) => {
    let reason = '';
    if (decision === 'Rejected') {
      const input = window.prompt('Enter Rejection Reason (Optional):');
      if (input === null) return; // Cancelled
      reason = input;
    }

    setActionLoading(`${table}-${id}`);
    const { error } = await supabase
      .from(table)
      .update({
        approval_status: decision,
        status: decision,
        approved_by: 'Mohammad Khalid Ahmad (MD)',
        approved_at: new Date().toISOString(),
        rejection_reason: reason || null,
      })
      .eq('id', id);

    setActionLoading(null);

    if (error) {
      alert('Action failed: ' + error.message);
    } else {
      loadPendingApprovals();
    }
  };

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-900 text-white rounded-xl shadow">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Managing Director Approval Center</h1>
            <p className="text-xs font-semibold text-slate-500">
              UNIVERSAL ENGICON PVT. LTD. • Maker–Checker–Approver Authorization Queue
            </p>
          </div>
        </div>
        <button
          onClick={loadPendingApprovals}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg shadow hover:bg-blue-800 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-amber-600">Pending Purchase Orders</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{pendingPOs.length}</p>
          </div>
          <Clock className="w-8 h-8 text-amber-500" />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-blue-600">Pending Contractor RA Bills</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{pendingBills.length}</p>
          </div>
          <Receipt className="w-8 h-8 text-blue-600" />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Total Pending Value</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {formatINR(
                pendingPOs.reduce((s, x) => s + Number(x.total_amount || x.amount || 0), 0) +
                  pendingBills.reduce((s, x) => s + Number(x.net_payable_amount || x.gross_amount || 0), 0)
              )}
            </p>
          </div>
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
        </div>
      </div>

      {/* Section 1: Pending Purchase Orders */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
        <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-800" />
          <h2 className="font-bold text-slate-800">Purchase Orders Awaiting MD Sanction ({pendingPOs.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Project / Site</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Material & Qty</th>
                <th className="py-3 px-4 text-right">Total Value</th>
                <th className="py-3 px-4 text-center">MD Authorization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingPOs.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-blue-800">{po.po_number || `PO-${po.id}`}</td>
                  <td className="py-3 px-4 font-medium">{po.projects?.name || 'General Site'}</td>
                  <td className="py-3 px-4 font-semibold">{po.vendor_name}</td>
                  <td className="py-3 px-4">
                    {po.material_name} ({po.quantity} {po.unit})
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                    {formatINR(po.total_amount || po.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        disabled={actionLoading === `purchase_orders-${po.id}`}
                        onClick={() => handleDecision('purchase_orders', po.id, 'Approved')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg shadow hover:bg-emerald-800"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        disabled={actionLoading === `purchase_orders-${po.id}`}
                        onClick={() => handleDecision('purchase_orders', po.id, 'Rejected')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow hover:bg-rose-700"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingPOs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    All Purchase Orders are cleared. No pending items.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Pending Contractor RA Bills */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-blue-800" />
          <h2 className="font-bold text-slate-800">Contractor RA Bills Awaiting MD Sanction ({pendingBills.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <th className="py-3 px-4">RA Bill No</th>
                <th className="py-3 px-4">Project / Site</th>
                <th className="py-3 px-4">Contractor</th>
                <th className="py-3 px-4">Work Description</th>
                <th className="py-3 px-4 text-right">Net Payable</th>
                <th className="py-3 px-4 text-center">MD Authorization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-blue-800">{bill.bill_no || `RA-${bill.id}`}</td>
                  <td className="py-3 px-4 font-medium">{bill.projects?.name || 'Site'}</td>
                  <td className="py-3 px-4 font-semibold">{bill.contractor_name}</td>
                  <td className="py-3 px-4">{bill.work_description}</td>
                  <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                    {formatINR(bill.net_payable_amount || bill.gross_amount)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        disabled={actionLoading === `ra_bills-${bill.id}`}
                        onClick={() => handleDecision('ra_bills', bill.id, 'Approved')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg shadow hover:bg-emerald-800"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve & Post
                      </button>
                      <button
                        disabled={actionLoading === `ra_bills-${bill.id}`}
                        onClick={() => handleDecision('ra_bills', bill.id, 'Rejected')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow hover:bg-rose-700"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingBills.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    All Contractor RA Bills are cleared. No pending items.
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