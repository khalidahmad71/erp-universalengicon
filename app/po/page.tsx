'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  FileText,
  CheckCircle2,
  PlusCircle,
  Printer,
  ShieldCheck,
  Clock,
  Lock,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MaterialRequest {
  id: string;
  mr_number: string;
  project_name: string;
  material_desc: string;
  quantity: number;
  requested_by?: string | null;
  status?: string | null;
  created_at?: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  mr_number?: string | null;
  project_name: string;
  vendor_name: string;
  material_name: string;
  quantity: number;
  rate: number;
  gst_percent: number;
  total_amount: number;
  status: string;
  approver_role?: string | null;
  created_by?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  approval_trail?: string | null;
  created_at?: string;
}

function getCookieValue(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : '';
}

function getInitialRouting(amount: number): {
  approverRole: string;
  status: string;
  chainLabel: string;
} {
  if (amount > 1000000) {
    return {
      approverRole: 'Purchase Manager',
      status: 'Pending Approval (Purchase Manager)',
      chainLabel: 'Purchase Officer → Purchase Manager → VP Procurement → MD',
    };
  }
  if (amount >= 200000) {
    return {
      approverRole: 'Purchase Manager',
      status: 'Pending Approval (Purchase Manager)',
      chainLabel: 'Purchase Officer → Purchase Manager → VP Procurement',
    };
  }
  if (amount >= 20000) {
    return {
      approverRole: 'Purchase Manager',
      status: 'Pending Approval (Purchase Manager)',
      chainLabel: 'Purchase Officer → Purchase Manager',
    };
  }
  return {
    approverRole: 'Purchase Officer (Self)',
    status: 'Approved & Issued',
    chainLabel: 'Purchase Officer (Direct Issue)',
  };
}

function getNextStepAfterApproval(
  currentApproverRole: string,
  amount: number
): {
  nextApproverRole: string;
  nextStatus: string;
  isFinal: boolean;
} {
  const role = currentApproverRole.toLowerCase();

  // Step 1: Purchase Manager approved
  if (role.includes('purchase manager')) {
    if (amount >= 200000) {
      return {
        nextApproverRole: 'VP Procurement',
        nextStatus: 'Pending Approval (VP Procurement)',
        isFinal: false,
      };
    }
    return {
      nextApproverRole: 'Completed',
      nextStatus: 'Approved & Issued',
      isFinal: true,
    };
  }

  // Step 2: VP Procurement approved
  if (role.includes('vp procurement')) {
    if (amount > 1000000) {
      return {
        nextApproverRole: 'Managing Director',
        nextStatus: 'Pending Approval (MD)',
        isFinal: false,
      };
    }
    return {
      nextApproverRole: 'Completed',
      nextStatus: 'Approved & Issued',
      isFinal: true,
    };
  }

  // Step 3: Managing Director approved (> 10,00,000)
  return {
    nextApproverRole: 'Completed',
    nextStatus: 'Approved & Issued',
    isFinal: true,
  };
}

function PurchaseOrdersContent() {
  const searchParams = useSearchParams();
  const mrIdFromQuery = searchParams.get('mrId');

  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const [currentRole, setCurrentRole] = useState<string>('Purchase Officer');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  const [selectedMrId, setSelectedMrId] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>(
    `PO-UE-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [vendorName, setVendorName] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [poQuantity, setPoQuantity] = useState<string>('');
  const [poRate, setPoRate] = useState<string>('');
  const [gstPercent, setGstPercent] = useState<string>('18');

  const fetchData = async () => {
    setLoading(true);
    const [mrRes, poRes] = await Promise.all([
      supabase
        .from('material_requests')
        .select('id, mr_number, project_name, material_desc, quantity, requested_by, status, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    if (!mrRes.error && mrRes.data) {
      const normalizedMRs: MaterialRequest[] = mrRes.data.map((row: any) => ({
        id: String(row.id),
        mr_number: row.mr_number || `MR-${row.id}`,
        project_name: row.project_name || '',
        material_desc: row.material_desc || '',
        quantity: Number(row.quantity ?? 0),
        requested_by: row.requested_by ?? null,
        status: row.status ?? 'Pending',
        created_at: row.created_at,
      }));
      setMaterialRequests(normalizedMRs);
    }

    if (!poRes.error && poRes.data) {
      setPurchaseOrders(poRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const roleCookie = getCookieValue('ue_role');
    const userCookie = getCookieValue('ue_session');
    if (roleCookie) setCurrentRole(roleCookie);
    if (userCookie) setCurrentUserEmail(userCookie);
    fetchData();
  }, []);

  const handleSelectMR = (mrId: string, sourceList?: MaterialRequest[]) => {
    const listToSearch = sourceList || materialRequests;
    setSelectedMrId(mrId);
    const mr = listToSearch.find((item) => item.id === mrId);
    if (!mr) {
      setSelectedProject('');
      return;
    }

    setSelectedProject(mr.project_name);
    if (mr.material_desc) setSelectedMaterial(mr.material_desc);
    if (mr.quantity > 0) setPoQuantity(String(mr.quantity));
  };

  useEffect(() => {
    if (mrIdFromQuery && materialRequests.length > 0 && !selectedMrId) {
      const exists = materialRequests.some((m) => m.id === String(mrIdFromQuery));
      if (exists) {
        handleSelectMR(String(mrIdFromQuery), materialRequests);
      }
    }
  }, [mrIdFromQuery, materialRequests]);

  const qtyNum = Number(poQuantity || 0);
  const rateNum = Number(poRate || 0);
  const gstNum = Number(gstPercent || 0);
  const baseAmount = qtyNum * rateNum;
  const gstAmount = (baseAmount * gstNum) / 100;
  const totalAmount = Math.round(baseAmount + gstAmount);

  const routingPreview = getInitialRouting(totalAmount);

  const canCurrentUserApprove = (po: PurchaseOrder): boolean => {
    if (!po.status.startsWith('Pending Approval')) return false;
    const roleNorm = currentRole.toLowerCase();
    const required = (po.approver_role || '').toLowerCase();

    if (required.includes('purchase manager')) {
      return roleNorm.includes('purchase manager');
    }
    if (required.includes('vp procurement')) {
      return roleNorm.includes('vp procurement') || roleNorm.includes('vp');
    }
    if (required.includes('managing director')) {
      return roleNorm.includes('managing director') || roleNorm === 'md';
    }
    return false;
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject.trim() || !vendorName.trim() || !selectedMaterial.trim() || qtyNum <= 0) {
      alert('Please select an MR (or fill Project, Vendor, Material, and Quantity).');
      return;
    }

    setSaving(true);
    const chosenMR = materialRequests.find((m) => m.id === selectedMrId);
    const routing = getInitialRouting(totalAmount);
    const creatorLabel = `${currentRole}${currentUserEmail ? ` (${currentUserEmail})` : ''}`;

    const { error } = await supabase.from('purchase_orders').insert([
      {
        po_number: poNumber.trim(),
        mr_number: chosenMR ? chosenMR.mr_number : null,
        project_name: selectedProject.trim(),
        vendor_name: vendorName.trim(),
        material_name: selectedMaterial.trim(),
        quantity: qtyNum,
        rate: rateNum,
        gst_percent: gstNum,
        total_amount: totalAmount,
        status: routing.status,
        approver_role: routing.approverRole,
        created_by: creatorLabel,
        approval_trail: `Created by ${creatorLabel}`,
      },
    ]);

    setSaving(false);

    if (error) {
      alert('PO Error: ' + error.message);
      return;
    }

    if (chosenMR) {
      await supabase
        .from('material_requests')
        .update({
          status:
            routing.status === 'Approved & Issued'
              ? 'PO Issued'
              : `PO Created (${routing.status})`,
        })
        .eq('id', chosenMR.id);
    }

    setPoNumber(`PO-UE-${Math.floor(100000 + Math.random() * 900000)}`);
    setSelectedMrId('');
    setSelectedProject('');
    setVendorName('');
    setSelectedMaterial('');
    setPoQuantity('');
    setPoRate('');
    await fetchData();
  };

  const handleApprovePO = async (po: PurchaseOrder) => {
    if (!canCurrentUserApprove(po)) {
      alert(`Only ${po.approver_role} can approve this stage.`);
      return;
    }

    const amount = Number(po.total_amount || 0);
    const currentStageRole = po.approver_role || currentRole;
    const nextStep = getNextStepAfterApproval(currentStageRole, amount);
    const approverStamp = `${currentRole}${currentUserEmail ? ` (${currentUserEmail})` : ''}`;
    const updatedTrail = po.approval_trail
      ? `${po.approval_trail} → Approved by ${approverStamp}`
      : `Approved by ${approverStamp}`;

    setApprovingId(String(po.id));

    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: nextStep.nextStatus,
        approver_role: nextStep.nextApproverRole,
        approved_by: approverStamp,
        approved_at: new Date().toISOString(),
        approval_trail: updatedTrail,
      })
      .eq('id', po.id);

    setApprovingId(null);

    if (error) {
      alert('Approval failed: ' + error.message);
      return;
    }

    if (po.mr_number) {
      await supabase
        .from('material_requests')
        .update({
          status: nextStep.isFinal ? 'PO Issued' : `PO Created (${nextStep.nextStatus})`,
        })
        .eq('mr_number', po.mr_number);
    }

    await fetchData();
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Universal Engicon Pvt. Ltd. • Sequential Procurement DOA
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Purchase Orders (PO)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              &lt;₹20K: PO Officer • ₹20K–₹1.99L: PO → PM • ₹2L–₹10L: PO → PM → VP Procurement • &gt;₹10L: PO → PM → VP → MD
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
              Role: <span className="text-blue-800">{currentRole}</span>
            </span>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Register
            </button>
          </div>
        </div>

        {/* Create PO Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <PlusCircle className="w-5 h-5 text-blue-700" />
              <h2 className="text-base font-extrabold text-slate-900">
                Generate Purchase Order from Material Request
              </h2>
            </div>

            {totalAmount > 0 && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                Chain: {routingPreview.chainLabel}
              </span>
            )}
          </div>

          <form onSubmit={handleCreatePO} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Material Request (All Indented MRs) *
              </label>
              <select
                value={selectedMrId}
                onChange={(e) => handleSelectMR(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
              >
                <option value="">
                  {loading
                    ? 'Loading Material Requests...'
                    : '-- Select MR (Shows Site, Material & Qty) --'}
                </option>
                {materialRequests.map((mr) => (
                  <option key={mr.id} value={mr.id}>
                    {mr.mr_number} — {mr.project_name} | {mr.material_desc} (Qty: {mr.quantity}) [{mr.status || 'Pending'}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project / Site Name (Auto-Selected) *
              </label>
              <input
                type="text"
                required
                readOnly={Boolean(selectedMrId)}
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                placeholder="Select MR to auto-fill site"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-extrabold ${
                  selectedMrId
                    ? 'bg-blue-50/70 border-blue-300 text-blue-950'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PO Number *
              </label>
              <input
                type="text"
                required
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vendor Name *
              </label>
              <input
                type="text"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Supplier / Vendor Name"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Material *
              </label>
              <input
                type="text"
                required
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                placeholder="Material Description"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="1"
                value={poQuantity}
                onChange={(e) => setPoQuantity(e.target.value)}
                placeholder="100"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rate (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={poRate}
                onChange={(e) => setPoRate(e.target.value)}
                placeholder="420"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GST (%)
              </label>
              <select
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="0">0% GST</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST</option>
                <option value="28">28% GST</option>
              </select>
            </div>

            <div className="lg:col-span-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <div className="text-xs text-slate-700 space-y-0.5">
                <div>
                  <span className="font-bold">Total PO Value (incl. GST): </span>
                  <span className="text-base font-extrabold text-emerald-700 ml-1">
                    {formatINR(totalAmount)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Initial Stage: <strong className="text-slate-800">{routingPreview.status}</strong>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving
                  ? 'Processing PO...'
                  : totalAmount >= 20000
                  ? 'Send to Purchase Manager'
                  : 'Issue PO Directly'}
              </button>
            </div>
          </form>
        </div>

        {/* Purchase Orders Approval & Register Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Purchase Orders &amp; Sequential Approval Trail
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {purchaseOrders.length} POs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">PO &amp; MR No</th>
                  <th className="py-3.5 px-4">Project / Site</th>
                  <th className="py-3.5 px-4">Vendor &amp; Material</th>
                  <th className="py-3.5 px-4 text-right">Total Value</th>
                  <th className="py-3.5 px-4">Status &amp; Approval Trail</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No purchase orders created yet.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => {
                    const isApproved = po.status === 'Approved & Issued' || po.status === 'Issued';
                    const allowedToApprove = canCurrentUserApprove(po);
                    const amount = Number(po.total_amount || 0);
                    const nextStepPreview = getNextStepAfterApproval(
                      po.approver_role || '',
                      amount
                    );

                    return (
                      <tr key={po.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-blue-700">{po.po_number}</div>
                          <div className="font-mono text-[11px] text-slate-500">
                            MR: {po.mr_number || '-'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{po.project_name}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{po.vendor_name}</div>
                          <div className="text-[11px] text-slate-500">
                            {po.material_name} (Qty: {po.quantity})
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                          {formatINR(amount)}
                        </td>
                        <td className="py-3.5 px-4 space-y-1 max-w-xs">
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                isApproved
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {isApproved ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              {po.status}
                            </span>
                          </div>
                          {po.approval_trail && (
                            <div className="text-[11px] text-slate-500 leading-snug">
                              {po.approval_trail}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isApproved ? (
                            <span className="text-[11px] font-bold text-emerald-700">
                              Ready for GRN
                            </span>
                          ) : allowedToApprove ? (
                            <button
                              type="button"
                              disabled={approvingId === String(po.id)}
                              onClick={() => handleApprovePO(po)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg shadow-2xs cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {approvingId === String(po.id)
                                ? 'Approving...'
                                : nextStepPreview.isFinal
                                ? 'Final Approve PO'
                                : `Approve & Forward to ${nextStepPreview.nextApproverRole}`}
                            </button>
                          ) : (
                            <span
                              title={`Awaiting ${po.approver_role}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-semibold"
                            >
                              <Lock className="w-3 h-3" />
                              Awaiting {po.approver_role}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading Purchase Orders...</div>}>
      <PurchaseOrdersContent />
    </Suspense>
  );
}