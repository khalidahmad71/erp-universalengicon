'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  HardHat, ArrowLeft, Ruler, FileSpreadsheet, AlertTriangle, 
  Plus, Send, ShieldCheck 
} from 'lucide-react';

interface Project {
  id: number;
  name: string;
}

interface WorkOrder {
  id: number;
  wo_number: string;
  project_id: number;
  contractor_name: string;
  wbs_code: string;
  work_description: string;
  unit: string;
  sanctioned_qty: number;
  executed_qty: number;
  wo_rate: number;
  retention_percent: number;
  tds_percent: number;
}

interface UnrecoveredMaterial {
  id: number;
  issue_slip_no: string;
  material_name: string;
  issued_qty: number;
  unit: string;
  recovery_amount: number;
}

interface ContractorBill {
  id: number;
  ra_bill_number: string;
  contractor_name: string;
  mb_number: string;
  current_billed_qty: number;
  gross_amount: number;
  retention_deduction: number;
  tds_deduction: number;
  material_recovery_deduction: number;
  net_payable: number;
  approval_status: string;
  enterprise_work_orders?: { wo_number: string; unit: string };
}

export default function EnterpriseContractorMB() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'BILLING' | 'WO'>('BILLING');

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [bills, setBills] = useState<ContractorBill[]>([]);
  const [pendingRecoveries, setPendingRecoveries] = useState<UnrecoveredMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // New Work Order Form States
  const [woContractor, setWoContractor] = useState('');
  const [woWbs, setWoWbs] = useState('WBS-2.0');
  const [woDesc, setWoDesc] = useState('');
  const [woUnit, setWoUnit] = useState('Cum');
  const [woQty, setWoQty] = useState('');
  const [woRate, setWoRate] = useState('');
  const [woRetention, setWoRetention] = useState('5');
  const [woTds, setWoTds] = useState('1');
  const [savingWo, setSavingWo] = useState(false);

  // Digital MB & RA Bill Form States
  const [selectedWoId, setSelectedWoId] = useState<number | null>(null);
  const [mbNumber, setMbNumber] = useState('MB-01 / Pg-14');
  const [dimNos, setDimNos] = useState('1');
  const [dimL, setDimL] = useState('');
  const [dimB, setDimB] = useState('');
  const [dimH, setDimH] = useState('');
  const [submittingBill, setSubmittingBill] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadModuleData(selectedProjectId);
    }
  }, [selectedProjectId]);

  const activeWO = workOrders.find((w) => w.id === selectedWoId);

  // Auto-fetch unrecovered chargeable store issues for the selected contractor
  useEffect(() => {
    if (selectedProjectId && activeWO) {
      fetchContractorStoreRecoveries(selectedProjectId, activeWO.contractor_name);
    } else {
      setPendingRecoveries([]);
    }
  }, [selectedWoId, selectedProjectId]);

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('id, name').order('id');
    if (data && data.length > 0) {
      setProjects(data);
      setSelectedProjectId(data[0].id);
    } else {
      setLoading(false);
    }
  }

  async function loadModuleData(projectId: number) {
    setLoading(true);
    const [woRes, billRes] = await Promise.all([
      supabase.from('enterprise_work_orders').select('*').eq('project_id', projectId).order('id', { ascending: false }),
      supabase.from('enterprise_contractor_bills').select('*, enterprise_work_orders(wo_number, unit)').eq('project_id', projectId).order('id', { ascending: false })
    ]);

    if (woRes.data) {
      setWorkOrders(woRes.data);
      setSelectedWoId(woRes.data.length > 0 ? woRes.data[0].id : null);
    }
    if (billRes.data) {
      setBills(billRes.data);
    }
    setLoading(false);
  }

  async function fetchContractorStoreRecoveries(projectId: number, contractorName: string) {
    const { data } = await supabase
      .from('enterprise_material_issues')
      .select('id, issue_slip_no, material_name, issued_qty, unit, recovery_amount')
      .eq('project_id', projectId)
      .eq('issue_type', 'CHARGEABLE_RECOVERY')
      .eq('is_recovered_in_bill', false)
      .ilike('issued_to_contractor', `%${contractorName.trim()}%`);

    setPendingRecoveries(data || []);
  }

  async function handleCreateWorkOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !woContractor || !woDesc || !woQty || !woRate) return;

    setSavingWo(true);
    const woNumber = `UEPL/WO/26-27/${String(workOrders.length + 201).padStart(4, '0')}`;

    const { error } = await supabase.from('enterprise_work_orders').insert({
      wo_number: woNumber,
      project_id: selectedProjectId,
      contractor_name: woContractor.trim(),
      wbs_code: woWbs,
      work_description: woDesc,
      unit: woUnit,
      sanctioned_qty: Number(woQty),
      executed_qty: 0,
      wo_rate: Number(woRate),
      retention_percent: Number(woRetention),
      tds_percent: Number(woTds)
    });

    if (!error) {
      setWoContractor('');
      setWoDesc('');
      setWoQty('');
      setWoRate('');
      await loadModuleData(selectedProjectId);
      setActiveTab('BILLING');
    } else {
      alert('Work Order Error: ' + error.message);
    }
    setSavingWo(false);
  }

  // Digital MB Calculation (Nos x L x B x H)
  const nNos = Number(dimNos) || 1;
  const nL = Number(dimL) || 0;
  const nB = Number(dimB) || 1;
  const nH = Number(dimH) || 1;
  const calculatedMbQty = nL > 0 ? Number((nNos * nL * nB * nH).toFixed(3)) : 0;

  const balanceWoQty = activeWO ? Math.max(0, Number(activeWO.sanctioned_qty) - Number(activeWO.executed_qty || 0)) : 0;
  const isOverWoLimit = activeWO ? calculatedMbQty > balanceWoQty : false;

  // Financial Waterfall Calculation
  const grossBillAmount = activeWO ? calculatedMbQty * Number(activeWO.wo_rate) : 0;
  const retentionAmt = activeWO ? (grossBillAmount * Number(activeWO.retention_percent)) / 100 : 0;
  const tdsAmt = activeWO ? (grossBillAmount * Number(activeWO.tds_percent)) / 100 : 0;
  const storeRecoveryAmt = pendingRecoveries.reduce((sum, r) => sum + Number(r.recovery_amount || 0), 0);
  const netPayableAmount = Math.max(0, grossBillAmount - retentionAmt - tdsAmt - storeRecoveryAmt);

  async function handleSubmitRABill(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !activeWO || calculatedMbQty <= 0) return;

    if (isOverWoLimit) {
      alert(`MB BLOCKED: Measured Qty (${calculatedMbQty}) exceeds remaining Work Order balance (${balanceWoQty} ${activeWO.unit})!`);
      return;
    }

    setSubmittingBill(true);
    const { data: { user } } = await supabase.auth.getUser();
    const raBillNumber = `UEPL/RA/26-27/${String(bills.length + 301).padStart(4, '0')}`;
    const dimFormula = `${nNos} Nos x ${nL}m x ${nB}m x ${nH}m`;

    // 1. Insert Contractor RA Bill
    const { data: insertedBill, error } = await supabase
      .from('enterprise_contractor_bills')
      .insert({
        ra_bill_number: raBillNumber,
        project_id: selectedProjectId,
        wo_id: activeWO.id,
        contractor_name: activeWO.contractor_name,
        mb_number: mbNumber,
        measurement_details: dimFormula,
        current_billed_qty: calculatedMbQty,
        wo_rate: activeWO.wo_rate,
        gross_amount: grossBillAmount,
        retention_deduction: retentionAmt,
        tds_deduction: tdsAmt,
        material_recovery_deduction: storeRecoveryAmt,
        net_payable: netPayableAmount,
        approval_status: 'PENDING_APPROVER'
      })
      .select()
      .single();

    if (!error && insertedBill) {
      // 2. Update Executed Qty in Work Order
      await supabase
        .from('enterprise_work_orders')
        .update({ executed_qty: Number(activeWO.executed_qty || 0) + calculatedMbQty })
        .eq('id', activeWO.id);

      // 3. Mark Store Chargeable Slips as Recovered (Prevents double recovery!)
      if (pendingRecoveries.length > 0) {
        const slipIds = pendingRecoveries.map((r) => r.id);
        await supabase
          .from('enterprise_material_issues')
          .update({ is_recovered_in_bill: true })
          .in('id', slipIds);
      }

      // 4. Push Net Payable to MD Executive Approval Desk (Module 1)
      await supabase.from('approval_requests').insert({
        project_id: selectedProjectId,
        module_name: 'CONTRACTOR_RA_BILL',
        document_number: `${raBillNumber} (${activeWO.contractor_name})`,
        reference_table: 'enterprise_contractor_bills',
        reference_id: String(insertedBill.id),
        amount: netPayableAmount,
        budget_variance_pct: 0,
        current_status: 'PENDING_APPROVER',
        requested_by: user?.id
      });

      // 5. Audit Trail
      await supabase.from('enterprise_audit_logs').insert({
        user_id: user?.id,
        user_email: user?.email || 'billing@universalengicon.com',
        module_name: 'CONTRACTOR_RA_BILLING',
        action_type: 'SUBMIT_RA_BILL',
        document_number: raBillNumber,
        new_values: { gross: grossBillAmount, recovery: storeRecoveryAmt, net: netPayableAmount }
      });

      setDimL('');
      await loadModuleData(selectedProjectId);
    } else {
      alert('RA Bill Error: ' + (error?.message || 'Unknown error'));
    }
    setSubmittingBill(false);
  }

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to MD Command Center
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HardHat className="w-6 h-6 text-amber-600" /> Sub-Contractor Digital MB & Auto-Recovery RA Billing
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Project:</label>
          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('BILLING')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
            activeTab === 'BILLING' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <Ruler className="w-4 h-4 text-amber-400" /> 1. Digital Measurement Book (MB) & RA Bill
        </button>
        <button
          onClick={() => setActiveTab('WO')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
            activeTab === 'WO' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-blue-400" /> 2. Issue Sub-Contractor Work Order ({workOrders.length})
        </button>
      </div>

      {/* TAB 1: DIGITAL MB & RA BILL GENERATOR */}
      {activeTab === 'BILLING' && (
        <div className="space-y-6">
          <form onSubmit={handleSubmitRABill} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-sm text-slate-800">Record Site Measurements (MB) & Auto-Calculate RA Bill</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                <ShieldCheck className="w-3.5 h-3.5" /> Store Recovery & Retention Linked
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Active Sub-Contractor Work Order*</label>
                <select
                  value={selectedWoId || ''}
                  onChange={(e) => setSelectedWoId(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
                >
                  {workOrders.length === 0 && <option value="">No Work Orders found (Create a Work Order in Tab 2 first)</option>}
                  {workOrders.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.wo_number} • {w.contractor_name} — {w.work_description} (Bal: {Math.max(0, w.sanctioned_qty - (w.executed_qty || 0))} {w.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">MB Book & Page Reference*</label>
                <input
                  type="text"
                  required
                  value={mbNumber}
                  onChange={(e) => setMbNumber(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                />
              </div>
            </div>

            {/* Digital MB Dimension Calculator */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase">
                Digital Measurement Sheet ({activeWO?.unit || 'Unit'} Calculator)
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nos (Count)</label>
                  <input
                    type="number"
                    step="1"
                    value={dimNos}
                    onChange={(e) => setDimNos(e.target.value)}
                    className="w-full border border-slate-300 bg-white rounded-md px-2.5 py-1.5 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Length (L) / Total Qty*</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 25.5"
                    value={dimL}
                    onChange={(e) => setDimL(e.target.value)}
                    className="w-full border border-slate-300 bg-white rounded-md px-2.5 py-1.5 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Breadth (B) [Default 1]</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dimB}
                    onChange={(e) => setDimB(e.target.value)}
                    className="w-full border border-slate-300 bg-white rounded-md px-2.5 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Height/Depth (H) [Default 1]</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dimH}
                    onChange={(e) => setDimH(e.target.value)}
                    className="w-full border border-slate-300 bg-white rounded-md px-2.5 py-1.5 text-sm"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-2 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-blue-700 uppercase">Net Measured Qty</span>
                  <span className={`text-base font-bold ${isOverWoLimit ? 'text-red-600' : 'text-blue-900'}`}>
                    {calculatedMbQty} {activeWO?.unit || ''}
                  </span>
                </div>
              </div>
            </div>

            {isOverWoLimit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                WORK ORDER CAP EXCEEDED: Measured Qty ({calculatedMbQty}) is greater than remaining Work Order balance ({balanceWoQty} {activeWO?.unit}).
              </div>
            )}

            {/* Auto-Detected Chargeable Store Recoveries */}
            {pendingRecoveries.length > 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Auto-Linked Central Store Recoveries Detected for {activeWO?.contractor_name}:
                </div>
                {pendingRecoveries.map((rec) => (
                  <div key={rec.id} className="pl-5 text-amber-800">
                    • Slip <strong>{rec.issue_slip_no}</strong>: {rec.material_name} ({rec.issued_qty} {rec.unit}) — <strong>{formatINR(rec.recovery_amount)}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* Financial Deduction Waterfall Box */}
            {activeWO && calculatedMbQty > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-900 text-white rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block">Gross Work Value</span>
                  <span className="text-sm font-bold text-white">{formatINR(grossBillAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">(-) Retention ({activeWO.retention_percent}%)</span>
                  <span className="text-sm font-bold text-amber-400">- {formatINR(retentionAmt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">(-) Income Tax TDS ({activeWO.tds_percent}%)</span>
                  <span className="text-sm font-bold text-amber-400">- {formatINR(tdsAmt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">(-) Store Material Recovery</span>
                  <span className="text-sm font-bold text-red-400">- {formatINR(storeRecoveryAmt)}</span>
                </div>
                <div className="border-l border-slate-700 pl-3">
                  <span className="text-emerald-400 font-bold block uppercase">Net Payable RA Bill</span>
                  <span className="text-base font-bold text-emerald-300">{formatINR(netPayableAmount)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingBill || !activeWO || calculatedMbQty <= 0 || isOverWoLimit}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submittingBill ? 'Routing RA Bill to MD...' : 'Certify MB & Route RA Bill to MD Desk'}
              </button>
            </div>
          </form>

          {/* Certified RA Bills Register */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-3 bg-slate-900 text-white text-sm font-semibold">
              Sub-Contractor RA Billing & Deduction Ledger
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-500">Loading RA Bills...</div>
              ) : bills.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">Abhi tak koi Contractor RA Bill certify nahi hua hai.</div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                      <th className="py-3 px-4">RA Bill & MB</th>
                      <th className="py-3 px-4">Sub-Contractor</th>
                      <th className="py-3 px-4">Gross Amount</th>
                      <th className="py-3 px-4">Deductions (Ret / TDS / Store)</th>
                      <th className="py-3 px-4">Net Payable</th>
                      <th className="py-3 px-4">MD Approval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bills.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{b.ra_bill_number}</div>
                          <div className="text-xs text-slate-500">{b.mb_number} • {b.current_billed_qty} {b.enterprise_work_orders?.unit}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{b.contractor_name}</td>
                        <td className="py-3 px-4 font-medium">{formatINR(b.gross_amount)}</td>
                        <td className="py-3 px-4 text-xs text-red-700">
                          Ret: {formatINR(b.retention_deduction)} | TDS: {formatINR(b.tds_deduction)} | Store: {formatINR(b.material_recovery_deduction)}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-700">{formatINR(b.net_payable)}</td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            {b.approval_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ISSUE NEW WORK ORDER */}
      {activeTab === 'WO' && (
        <form onSubmit={handleCreateWorkOrder} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
            Issue New Item-Rate Sub-Contractor Work Order (WO)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sub-Contractor Firm Name*</label>
              <input
                type="text"
                required
                placeholder="e.g., M/s Maa Tara Civil Contractors"
                value={woContractor}
                onChange={(e) => setWoContractor(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">WBS Activity Code</label>
              <select
                value={woWbs}
                onChange={(e) => setWoWbs(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="WBS-1.0">WBS-1.0 Sub-Structure</option>
                <option value="WBS-2.0">WBS-2.0 Super-Structure</option>
                <option value="WBS-3.0">WBS-3.0 Masonry & Plaster</option>
                <option value="WBS-4.0">WBS-4.0 MEP & Fire</option>
                <option value="WBS-5.0">WBS-5.0 Finishing & Infra</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Scope / Work Description*</label>
              <input
                type="text"
                required
                placeholder="e.g., RCC Slab Shuttering & Bar Bending"
                value={woDesc}
                onChange={(e) => setWoDesc(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Unit</label>
              <select
                value={woUnit}
                onChange={(e) => setWoUnit(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="Cum">Cum</option>
                <option value="Sqm">Sqm</option>
                <option value="Sqft">Sqft</option>
                <option value="MT">MT</option>
                <option value="Rmt">Rmt</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sanctioned Max Qty*</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Max Qty"
                value={woQty}
                onChange={(e) => setWoQty(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Contract Rate (₹)*</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Rate per Unit"
                value={woRate}
                onChange={(e) => setWoRate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Retention (%)</label>
              <input
                type="number"
                step="0.5"
                value={woRetention}
                onChange={(e) => setWoRetention(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">TDS u/s 194C (%)</label>
              <select
                value={woTds}
                onChange={(e) => setWoTds(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="1">1% (Individual / Prop.)</option>
                <option value="2">2% (Pvt Ltd / Partnership)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingWo}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg"
            >
              <Plus className="w-4 h-4" /> {savingWo ? 'Creating WO...' : 'Sanction & Issue Work Order'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}