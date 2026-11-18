'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ShieldCheck,
  AlertTriangle,
  Landmark,
  TrendingUp,
  Plus,
  CheckCircle2,
  Ban,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jvorxidiigvdznnpgxrj.supabase.co"),
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key")
);

interface VendorBill {
  id: string;
  bill_number: string;
  bill_date: string;
  vendor_name: string;
  vendor_gstin: string;
  po_amount: number;
  grn_verified_amount: number;
  billed_taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  total_bill_amount: number;
  matching_status: 'MATCHED' | 'OVER_BILLED_HOLD' | 'RATE_VARIANCE_HOLD' | 'PARTIAL_GRN_PENDING';
  payment_status: string;
  projects?: { name: string };
}

interface ProjectPnL {
  project_id: string;
  project_name: string;
  contract_value: number;
  certified_revenue: number;
  material_vendor_cost: number;
  net_operating_profit: number;
}

export default function EnterpriseFinancePage() {
  const [activeTab, setActiveTab] = useState<'3way' | 'gst' | 'pnl'>('3way');
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [pnlData, setPnlData] = useState<ProjectPnL[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [pos, setPos] = useState<
    { id: string; po_number: string; total_amount: number; vendor_name: string; project_id: string }[]
  >([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    bill_number: '',
    project_id: '',
    po_id: '',
    vendor_name: '',
    vendor_gstin: '',
    grn_reference: '',
    po_amount: 0,
    grn_verified_amount: 0,
    billed_taxable_amount: 0,
    gst_rate: 18,
  });

  const fetchFinanceData = async () => {
    setLoading(true);
    const [billsRes, pnlRes, projRes, poRes] = await Promise.all([
      supabase.from('vendor_bills').select('*, projects(name)').order('created_at', { ascending: false }),
      supabase.from('vw_project_live_pnl').select('*'),
      supabase.from('projects').select('id, name'),
      supabase.from('purchase_orders').select('id, po_number, total_amount, vendor_name, project_id'),
    ]);

    if (billsRes.data) setBills(billsRes.data as VendorBill[]);
    if (pnlRes.data) setPnlData(pnlRes.data as ProjectPnL[]);
    if (projRes.data) setProjects(projRes.data);
    if (poRes.data) setPos(poRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handlePOSelect = (poId: string) => {
    const selected = pos.find((p) => p.id === poId);
    if (selected) {
      setFormData({
        ...formData,
        po_id: selected.id,
        project_id: selected.project_id || formData.project_id,
        vendor_name: selected.vendor_name || '',
        po_amount: Number(selected.total_amount) || 0,
        grn_verified_amount: Number(selected.total_amount) || 0,
      });
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const taxTotal = (formData.billed_taxable_amount * formData.gst_rate) / 100;
    const cgst = taxTotal / 2;
    const sgst = taxTotal / 2;

    const { error } = await supabase.from('vendor_bills').insert([
      {
        bill_number: formData.bill_number,
        project_id: formData.project_id || null,
        po_id: formData.po_id || null,
        vendor_name: formData.vendor_name,
        vendor_gstin: formData.vendor_gstin,
        grn_reference: formData.grn_reference,
        po_amount: formData.po_amount,
        grn_verified_amount: formData.grn_verified_amount,
        billed_taxable_amount: formData.billed_taxable_amount,
        gst_rate: formData.gst_rate,
        cgst_amount: cgst,
        sgst_amount: sgst,
        total_bill_amount: formData.billed_taxable_amount + taxTotal,
      },
    ]);

    if (!error) {
      setShowModal(false);
      fetchFinanceData();
    } else {
      alert('Error saving bill: ' + error.message);
    }
  };

  const approveMatchedPayment = async (id: string) => {
    await supabase.from('vendor_bills').update({ payment_status: 'APPROVED_FOR_PAY' }).eq('id', id);
    fetchFinanceData();
  };

  const totalInputITC = bills
    .filter((b) => b.matching_status === 'MATCHED')
    .reduce((acc, b) => acc + Number(b.cgst_amount) + Number(b.sgst_amount), 0);

  const totalOutputGST = pnlData.reduce((acc, p) => acc + Number(p.certified_revenue) * 0.18, 0);
  const netGstPayable = totalOutputGST - totalInputITC;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center">
        <div>
          <span className="text-xs font-bold tracking-wider text-blue-700 uppercase">
            Universal Engicon Pvt. Ltd. â€¢ Financial Control
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Enterprise Finance, 3-Way Audit &amp; Live P&amp;L
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> Log Vendor Invoice (3-Way Check)
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">3-Way Matched Bills</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {bills.filter((b) => b.matching_status === 'MATCHED').length} / {bills.length}
          </p>
          <span className="text-xs text-slate-400">PO = GRN = Bill Verified</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Blocked / Variance Hold</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">
            {bills.filter((b) => b.matching_status !== 'MATCHED').length}
          </p>
          <span className="text-xs text-slate-400">Auto-held from payment</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Eligible Input ITC (GST)</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">
            â‚¹ {totalInputITC.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-slate-400">Only from 3-way matched bills</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Net GST Liability</p>
          <p className={`mt-1 text-2xl font-bold ${netGstPayable > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
            â‚¹ {Math.abs(netGstPayable).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-slate-400">
            {netGstPayable > 0 ? 'Net Cash Payable' : 'Excess ITC Credit Balance'}
          </span>
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('3way')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === '3way'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> 3-Way Invoice Matching
        </button>
        <button
          onClick={() => setActiveTab('gst')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'gst'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Landmark className="h-4 w-4" /> GST Compliance Ledger
        </button>
        <button
          onClick={() => setActiveTab('pnl')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'pnl'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="h-4 w-4" /> Project-Wise Live P&amp;L
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading financial records...
        </div>
      ) : (
        <>
          {activeTab === '3way' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="px-4 py-3">Bill No &amp; Vendor</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3 text-right">PO Value (â‚¹)</th>
                    <th className="px-4 py-3 text-right">Store GRN (â‚¹)</th>
                    <th className="px-4 py-3 text-right">Vendor Bill (â‚¹)</th>
                    <th className="px-4 py-3">3-Way Audit Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bills.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No vendor bills logged yet. Click &quot;Log Vendor Invoice&quot; to run 3-way matching.
                      </td>
                    </tr>
                  ) : (
                    bills.map((bill) => {
                      const isMatched = bill.matching_status === 'MATCHED';
                      return (
                        <tr key={bill.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{bill.bill_number}</div>
                            <div className="text-xs text-slate-500">{bill.vendor_name}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{bill.projects?.name || 'General'}</td>
                          <td className="px-4 py-3 text-right font-mono">
                            {Number(bill.po_amount).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {Number(bill.grn_verified_amount).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold">
                            {Number(bill.billed_taxable_amount).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3">
                            {isMatched ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" /> MATCHED (PO=GRN=BILL)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                                <AlertTriangle className="h-3.5 w-3.5" /> {bill.matching_status}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isMatched ? (
                              bill.payment_status === 'APPROVED_FOR_PAY' ? (
                                <span className="text-xs font-bold text-blue-700">APPROVED FOR PAY</span>
                              ) : (
                                <button
                                  onClick={() => approveMatchedPayment(bill.id)}
                                  className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                                >
                                  Approve Pay
                                </button>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                                <Ban className="h-3.5 w-3.5" /> Payment Locked
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
          )}

          {activeTab === 'gst' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-emerald-800">
                  <ArrowDownRight className="h-5 w-5" /> Input Tax Credit (GSTR-2B Verified)
                </h3>
                <div className="space-y-2 text-sm">
                  {bills
                    .filter((b) => b.matching_status === 'MATCHED')
                    .map((b) => (
                      <div key={b.id} className="flex justify-between border-b border-slate-100 py-2">
                        <div>
                          <span className="font-semibold">{b.vendor_name}</span>
                          <span className="ml-2 text-xs text-slate-400">({b.bill_number})</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-700">
                          + â‚¹ {(Number(b.cgst_amount) + Number(b.sgst_amount)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-amber-800">
                  <ArrowUpRight className="h-5 w-5" /> Output GST Liability (Client RA Bills)
                </h3>
                <div className="space-y-2 text-sm">
                  {pnlData.map((p) => (
                    <div key={p.project_id} className="flex justify-between border-b border-slate-100 py-2">
                      <span className="font-semibold">{p.project_name}</span>
                      <span className="font-mono font-bold text-amber-700">
                        - â‚¹ {(Number(p.certified_revenue) * 0.18).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pnl' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="px-4 py-3">Project Name</th>
                    <th className="px-4 py-3 text-right">Contract Value (â‚¹)</th>
                    <th className="px-4 py-3 text-right">Certified RA Revenue (â‚¹)</th>
                    <th className="px-4 py-3 text-right">Verified Material/Vendor Cost (â‚¹)</th>
                    <th className="px-4 py-3 text-right">Net Operating Profit (â‚¹)</th>
                    <th className="px-4 py-3 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pnlData.map((row) => {
                    const margin =
                      row.certified_revenue > 0
                        ? ((row.net_operating_profit / row.certified_revenue) * 100).toFixed(1)
                        : '0.0';
                    return (
                      <tr key={row.project_id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">{row.project_name}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          {Number(row.contract_value).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-blue-700">
                          {Number(row.certified_revenue).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-rose-700">
                          {Number(row.material_vendor_cost).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                          {Number(row.net_operating_profit).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-bold">{margin}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreateBill} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">Log Vendor Invoice for 3-Way Audit</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="mb-1 block font-semibold">Select PO</label>
                <select
                  className="w-full rounded border p-2"
                  value={formData.po_id}
                  onChange={(e) => handlePOSelect(e.target.value)}
                >
                  <option value="">-- Choose PO --</option>
                  {pos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.po_number} ({p.vendor_name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold">Project</label>
                <select
                  className="w-full rounded border p-2"
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                >
                  <option value="">-- Select Project --</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold">Invoice Number</label>
                <input
                  required
                  className="w-full rounded border p-2"
                  placeholder="INV-2026-001"
                  value={formData.bill_number}
                  onChange={(e) => setFormData({ ...formData, bill_number: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Vendor Name</label>
                <input
                  required
                  className="w-full rounded border p-2"
                  placeholder="Supplier Name"
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">PO Taxable Value (â‚¹)</label>
                <input
                  type="number"
                  required
                  className="w-full rounded border bg-slate-50 p-2"
                  value={formData.po_amount}
                  onChange={(e) => setFormData({ ...formData, po_amount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Store GRN Verified (â‚¹)</label>
                <input
                  type="number"
                  required
                  className="w-full rounded border bg-slate-50 p-2"
                  value={formData.grn_verified_amount}
                  onChange={(e) => setFormData({ ...formData, grn_verified_amount: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block font-semibold text-blue-800">
                  Vendor Billed Taxable Amount (â‚¹)
                </label>
                <input
                  type="number"
                  required
                  className="w-full rounded border-2 border-blue-600 p-2 font-bold"
                  value={formData.billed_taxable_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, billed_taxable_amount: Number(e.target.value) })
                  }
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
                Run 3-Way Match &amp; Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
