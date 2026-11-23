'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ShieldCheck,
  FileCheck2,
  KeyRound,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface HighValuePO {
  id: string;
  po_number: string;
  mr_number?: string | null;
  project_name: string;
  vendor_name: string;
  material_name: string;
  quantity: number;
  total_amount: number;
  status: string;
  approver_role?: string | null;
  approval_trail?: string | null;
}

interface MajorContractorBill {
  id: string;
  ra_bill_no: string;
  project_name: string;
  contractor_name: string;
  work_description: string;
  gross_amount: number;
  net_payable: number;
  bill_date: string;
  status: string;
}

interface PasswordResetRequest {
  id: string;
  user_email: string;
  user_name?: string | null;
  department_role: string;
  reason?: string | null;
  status: string;
  new_temp_password?: string | null;
  requested_at: string;
}

const MAJOR_BILL_THRESHOLD = 500000; // ₹5,00,000+ major contractor RA bills

export default function MDApprovalCenterPage() {
  const [highValuePOs, setHighValuePOs] = useState<HighValuePO[]>([]);
  const [majorBills, setMajorBills] = useState<MajorContractorBill[]>([]);
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');

  const fetchMDQueue = async () => {
    setLoading(true);
    const [poRes, billRes, resetRes] = await Promise.all([
      supabase
        .from('purchase_orders')
        .select('*')
        .gt('total_amount', 1000000)
        .order('created_at', { ascending: false }),
      supabase
        .from('contractor_ra_bills')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('password_reset_requests')
        .select('*')
        .order('requested_at', { ascending: false }),
    ]);

    if (!poRes.error && poRes.data) {
      // Only POs > ₹10,00,000 that have passed Purchase Manager & VP Procurement
      // and are awaiting MD final sign-off
      const mdPending = poRes.data.filter((po: any) => {
        const trail = (po.approval_trail || '').toLowerCase();
        const passedPM = trail.includes('purchase manager');
        const passedVP = trail.includes('vp procurement');
        const isAwaitingMD =
          po.status === 'Pending Approval (MD)' ||
          (Number(po.total_amount || 0) > 1000000 &&
            passedPM &&
            passedVP &&
            po.status !== 'Approved & Issued' &&
            po.status !== 'Rejected');
        return isAwaitingMD;
      });
      setHighValuePOs(mdPending);
    }

    if (!billRes.error && billRes.data) {
      const pendingMajor = billRes.data.filter(
        (b: any) =>
          Number(b.net_payable || 0) >= MAJOR_BILL_THRESHOLD &&
          !/md approved|rejected|paid/i.test(b.status || '')
      );
      setMajorBills(pendingMajor);
    }

    if (!resetRes.error && resetRes.data) {
      setResetRequests(
        resetRes.data.filter((r: any) => (r.status || 'Pending') === 'Pending')
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMDQueue();
  }, []);

  const handleApproveHighValuePO = async (po: HighValuePO) => {
    setBusyId(po.id);
    setFeedback('');

    const updatedTrail = po.approval_trail
      ? `${po.approval_trail} → Final Approved by Managing Director`
      : 'Final Approved by Managing Director';

    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'Approved & Issued',
        approver_role: 'Completed',
        approved_by: 'Managing Director',
        approved_at: new Date().toISOString(),
        approval_trail: updatedTrail,
      })
      .eq('id', po.id);

    setBusyId(null);

    if (error) {
      alert('Failed to approve PO: ' + error.message);
      return;
    }

    if (po.mr_number) {
      await supabase
        .from('material_requests')
        .update({ status: 'PO Issued' })
        .eq('mr_number', po.mr_number);
    }

    setFeedback(`PO ${po.po_number} (${formatINR(po.total_amount)}) approved & issued by MD.`);
    await fetchMDQueue();
  };

  const handleRejectPO = async (po: HighValuePO) => {
    setBusyId(po.id);
    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'Rejected by MD',
        approver_role: 'Rejected',
        approved_by: 'Managing Director',
        approved_at: new Date().toISOString(),
      })
      .eq('id', po.id);

    setBusyId(null);
    if (!error) {
      setFeedback(`PO ${po.po_number} rejected by MD.`);
      await fetchMDQueue();
    }
  };

  const handleApproveMajorBill = async (bill: MajorContractorBill) => {
    setBusyId(bill.id);
    const { error } = await supabase
      .from('contractor_ra_bills')
      .update({ status: 'MD Approved & Posted' })
      .eq('id', bill.id);

    setBusyId(null);
    if (!error) {
      setFeedback(`Contractor RA Bill ${bill.ra_bill_no} approved by MD.`);
      await fetchMDQueue();
    }
  };

  const handleResolvePasswordReset = async (
    reqItem: PasswordResetRequest,
    decision: 'Approved' | 'Rejected'
  ) => {
    setBusyId(reqItem.id);
    const tempPass =
      decision === 'Approved'
        ? `UE@${Math.floor(100000 + Math.random() * 900000)}`
        : null;

    const { error } = await supabase
      .from('password_reset_requests')
      .update({
        status: decision,
        new_temp_password: tempPass,
        resolved_at: new Date().toISOString(),
        resolved_by: 'Managing Director',
      })
      .eq('id', reqItem.id);

    setBusyId(null);

    if (!error) {
      setFeedback(
        decision === 'Approved'
          ? `Password reset approved for ${reqItem.user_email}. Temp Password: ${tempPass}`
          : `Password reset request rejected for ${reqItem.user_email}.`
      );
      await fetchMDQueue();
    }
  };

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="min-h-screen bg-slate-50/70 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Universal Engicon Pvt. Ltd. • Managing Director Command
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              MD Approval Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Only POs &gt; ₹10,00,000 (after Purchase Manager &amp; VP Procurement), Major RA Bills &amp; Password Resets
            </p>
          </div>

          <button
            onClick={fetchMDQueue}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Queue
          </button>
        </div>

        {feedback && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* 1. High-Value POs (> ₹10,00,000, Post PM & VP Procurement) */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <h2 className="text-sm font-extrabold text-slate-900">
                1. High-Value Purchase Orders (&gt; ₹10,00,000 • Post PM &amp; VP Approval)
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">{highValuePOs.length} Pending</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">PO No</th>
                  <th className="py-3 px-4">Project &amp; Vendor</th>
                  <th className="py-3 px-4">Material &amp; Qty</th>
                  <th className="py-3 px-4 text-right">PO Value</th>
                  <th className="py-3 px-4">Approval Trail</th>
                  <th className="py-3 px-4 text-right">MD Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Loading high-value POs...
                    </td>
                  </tr>
                ) : highValuePOs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No POs above ₹10,00,000 awaiting MD approval after PM &amp; VP sign-off.
                    </td>
                  </tr>
                ) : (
                  highValuePOs.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{po.po_number}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{po.project_name}</div>
                        <div className="text-[11px] text-slate-500">{po.vendor_name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {po.material_name} ({po.quantity})
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        {formatINR(Number(po.total_amount || 0))}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-600 max-w-xs">
                        {po.approval_trail || 'PM → VP Procurement'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          disabled={busyId === po.id}
                          onClick={() => handleApproveHighValuePO(po)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve PO
                        </button>
                        <button
                          disabled={busyId === po.id}
                          onClick={() => handleRejectPO(po)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] rounded-lg cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Major Contractor RA Bills */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-blue-700" />
              <h2 className="text-sm font-extrabold text-slate-900">
                2. Major Sub-Contractor RA Bills (≥ ₹5,00,000)
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">{majorBills.length} Pending</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">RA Bill No</th>
                  <th className="py-3 px-4">Project &amp; Contractor</th>
                  <th className="py-3 px-4">Work Description</th>
                  <th className="py-3 px-4 text-right">Net Payable</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {majorBills.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No major contractor RA bills pending MD review.
                    </td>
                  </tr>
                ) : (
                  majorBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {bill.ra_bill_no}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{bill.project_name}</div>
                        <div className="text-[11px] text-slate-500">{bill.contractor_name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{bill.work_description}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">
                        {formatINR(Number(bill.net_payable || 0))}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          disabled={busyId === bill.id}
                          onClick={() => handleApproveMajorBill(bill)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          MD Sign-Off
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Department Password Reset Requests */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-700" />
              <h2 className="text-sm font-extrabold text-slate-900">
                3. Department Password Reset Requests
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">{resetRequests.length} Pending</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">User &amp; Email</th>
                  <th className="py-3 px-4">Department / Role</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resetRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No pending department password reset requests.
                    </td>
                  </tr>
                ) : (
                  resetRequests.map((reqItem) => (
                    <tr key={reqItem.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {reqItem.user_name || reqItem.user_email}
                        </div>
                        <div className="text-[11px] text-slate-500">{reqItem.user_email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-800">
                        {reqItem.department_role}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {reqItem.reason || 'Credential reset requested'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          disabled={busyId === reqItem.id}
                          onClick={() => handleResolvePasswordReset(reqItem, 'Approved')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve &amp; Issue Temp Pass
                        </button>
                        <button
                          disabled={busyId === reqItem.id}
                          onClick={() => handleResolvePasswordReset(reqItem, 'Rejected')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] rounded-lg cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
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