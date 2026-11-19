'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Receipt,
  Plus,
  CheckCircle2,
  ShieldAlert,
  Lock,
  Unlock,
  FileCheck2,
  Calculator,
} from 'lucide-react';

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jvorxidiigvdznnpgxrj.supabase.co"),
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key")
);

interface ContractorMBBill {
  id: string;
  ra_bill_number: string;
  bill_date: string;
  project_id: string;
  contractor_name: string;
  contractor_pan: string;
  work_description: string;
  unit: string;
  boq_rate: number;
  previous_qty: number;
  current_qty: number;
  cumulative_qty: number;
  gross_current_amount: number;
  retention_percent: number;
  retention_amount: number;
  tds_percent: number;
  tds_amount: number;
  gst_percent: number;
  gst_amount: number;
  net_payable_amount: number;
  approval_status: 'PENDING_QC' | 'CERTIFIED_BY_QS' | 'APPROVED_FOR_PAY' | 'PAID';
  retention_released: boolean;
  projects?: { name: string };
}

export default function ContractorBillingPage() {
  const [bills, setBills] = useState<ContractorMBBill[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    ra_bill_number: '',
    project_id: '',
    contractor_name: '',
    contractor_pan: '',
    work_description: '',
    unit: 'SQFT',
    boq_rate: 0,
    previous_qty: 0,
    current_qty: 0,
    retention_percent: 5,
    tds_percent: 2,
    gst_percent: 18,
  });

  const fetchData = async () => {
    setLoading(true);
    const [billsRes, projRes] = await Promise.all([
      supabase
        .from('contractor_mb_bills')
        .select('*, projects(name)')
        .order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name'),
    ]);

    if (billsRes.data) setBills(billsRes.data as ContractorMBBill[]);
    if (projRes.data) setProjects(projRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Live Preview Calculations in Modal
  const liveGross = Number(formData.current_qty) * Number(formData.boq_rate);
  const liveRetention = (liveGross * Number(formData.retention_percent)) / 100;
  const liveTds = (liveGross * Number(formData.tds_percent)) / 100;
  const liveGst = (liveGross * Number(formData.gst_percent)) / 100;
  const liveNetPayable = liveGross + liveGst - liveRetention - liveTds;

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('contractor_mb_bills').insert([
      {
        ra_bill_number: formData.ra_bill_number,
        project_id: formData.project_id || null,
        contractor_name: formData.contractor_name,
        contractor_pan: formData.contractor_pan.toUpperCase(),
        work_description: formData.work_description,
        unit: formData.unit,
        boq_rate: Number(formData.boq_rate),
        previous_qty: Number(formData.previous_qty),
        current_qty: Number(formData.current_qty),
        retention_percent: Number(formData.retention_percent),
        tds_percent: Number(formData.tds_percent),
        gst_percent: Number(formData.gst_percent),
      },
    ]);

    if (!error) {
      setShowModal(false);
      setFormData({
        ra_bill_number: '',
        project_id: '',
        contractor_name: '',
        contractor_pan: '',
        work_description: '',
        unit: 'SQFT',
        boq_rate: 0,
        previous_qty: 0,
        current_qty: 0,
        retention_percent: 5,
        tds_percent: 2,
        gst_percent: 18,
      });
      fetchData();
    } else {
      alert('Error saving RA Bill: ' + error.message);
    }
  };

  const updateStatus = async (id: string, nextStatus: ContractorMBBill['approval_status']) => {
    await supabase.from('contractor_mb_bills').update({ approval_status: nextStatus }).eq('id', id);
    fetchData();
  };

  const toggleRetentionRelease = async (id: string, currentState: boolean) => {
    await supabase
      .from('contractor_mb_bills')
      .update({ retention_released: !currentState })
      .eq('id', id);
    fetchData();
  };

  // Executive KPIs
  const totalGrossCertified = bills.reduce((sum, b) => sum + Number(b.gross_current_amount || 0), 0);
  const totalRetentionHeld = bills
    .filter((b) => !b.retention_released)
    .reduce((sum, b) => sum + Number(b.retention_amount || 0), 0);
  const totalTdsDeducted = bills.reduce((sum, b) => sum + Number(b.tds_amount || 0), 0);
  const totalNetPayable = bills
    .filter((b) => b.approval_status !== 'PAID')
    .reduce((sum, b) => sum + Number(b.net_payable_amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center">
        <div>
          <span className="text-xs font-bold tracking-wider text-blue-700 uppercase">
            Universal Engicon Pvt. Ltd. â€¢ Site QS &amp; Billing
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Contractor Measurement Book (MB) &amp; RA Billing
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> New MB Entry &amp; RA Bill
        </button>
      </div>

      {/* KPI Strip */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Gross Work Certified</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            ₹ {totalGrossCertified.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-slate-400">Cumulative MB Value (Excl. GST)</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Retention Money Held</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            ₹ {totalRetentionHeld.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-slate-400">Defect Liability Security Deposit</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Sec 194C TDS Deducted</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">
            ₹ {totalTdsDeducted.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-slate-400">1% Individual / 2% Company</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Pending Net Disbursement</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            ₹ {totalNetPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-slate-400">After Retention, TDS &amp; +GST</span>
        </div>
      </div>

      {/* Main MB & RA Bill Ledger Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading Measurement Book records...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3">RA Bill &amp; Contractor</th>
                <th className="px-4 py-3">Project &amp; Work Item</th>
                <th className="px-4 py-3 text-right">MB Qty (Prev + Curr = Cum)</th>
                <th className="px-4 py-3 text-right">Gross Value (₹)</th>
                <th className="px-4 py-3 text-right">Retention Held</th>
                <th className="px-4 py-3 text-right">194C TDS</th>
                <th className="px-4 py-3 text-right">GST (+)</th>
                <th className="px-4 py-3 text-right">Net Payable (₹)</th>
                <th className="px-4 py-3">QS / MD Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No contractor RA bills recorded yet. Click &quot;New MB Entry &amp; RA Bill&quot; to start.
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{bill.ra_bill_number}</div>
                      <div className="text-xs font-medium text-slate-600">{bill.contractor_name}</div>
                      {bill.contractor_pan && (
                        <div className="font-mono text-[10px] text-slate-400">PAN: {bill.contractor_pan}</div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-xs font-bold text-blue-700">{bill.projects?.name || 'General'}</div>
                      <div className="text-xs text-slate-700">{bill.work_description}</div>
                      <div className="text-[11px] text-slate-400">
                        Rate: ₹{Number(bill.boq_rate).toLocaleString('en-IN')} / {bill.unit}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-xs">
                      <div>
                        {Number(bill.previous_qty)} +{' '}
                        <span className="font-bold text-blue-700">{Number(bill.current_qty)}</span>
                      </div>
                      <div className="font-bold text-slate-900">
                        = {Number(bill.cumulative_qty)} {bill.unit}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      ₹ {Number(bill.gross_current_amount).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="font-mono text-xs font-bold text-amber-700">
                        - ₹ {Number(bill.retention_amount).toLocaleString('en-IN')} ({bill.retention_percent}%)
                      </div>
                      <button
                        onClick={() => toggleRetentionRelease(bill.id, bill.retention_released)}
                        className={`mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          bill.retention_released
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {bill.retention_released ? (
                          <>
                            <Unlock className="h-3 w-3" /> Released
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3" /> Release Retention
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-xs text-rose-600">
                      - ₹ {Number(bill.tds_amount).toLocaleString('en-IN')}
                      <div className="text-[10px] text-slate-400">({bill.tds_percent}%)</div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">
                      + ₹ {Number(bill.gst_amount).toLocaleString('en-IN')}
                      <div className="text-[10px] text-slate-400">({bill.gst_percent}%)</div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-sm font-extrabold text-emerald-700">
                      ₹ {Number(bill.net_payable_amount).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3">
                      {bill.approval_status === 'PENDING_QC' && (
                        <button
                          onClick={() => updateStatus(bill.id, 'CERTIFIED_BY_QS')}
                          className="inline-flex items-center gap-1 rounded bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700"
                        >
                          <FileCheck2 className="h-3.5 w-3.5" /> Certify MB
                        </button>
                      )}
                      {bill.approval_status === 'CERTIFIED_BY_QS' && (
                        <button
                          onClick={() => updateStatus(bill.id, 'APPROVED_FOR_PAY')}
                          className="inline-flex items-center gap-1 rounded bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-800"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> MD Approve
                        </button>
                      )}
                      {bill.approval_status === 'APPROVED_FOR_PAY' && (
                        <button
                          onClick={() => updateStatus(bill.id, 'PAID')}
                          className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Mark Paid
                        </button>
                      )}
                      {bill.approval_status === 'PAID' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> PAID
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Create MB & RA Bill */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleCreateBill}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Receipt className="h-5 w-5 text-blue-700" /> Record Measurement Book (MB) &amp; RA Bill
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div>
                <label className="mb-1 block font-semibold">RA Bill Number *</label>
                <input
                  required
                  className="w-full rounded border p-2"
                  placeholder="RA-BILL-01"
                  value={formData.ra_bill_number}
                  onChange={(e) => setFormData({ ...formData, ra_bill_number: e.target.value })}
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
                <label className="mb-1 block font-semibold">Contractor Name *</label>
                <input
                  required
                  className="w-full rounded border p-2"
                  placeholder="Sub-Contractor / Agency Name"
                  value={formData.contractor_name}
                  onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">Contractor PAN (for 194C TDS)</label>
                <input
                  className="w-full rounded border p-2 uppercase"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  value={formData.contractor_pan}
                  onChange={(e) => setFormData({ ...formData, contractor_pan: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block font-semibold">BOQ Work Description *</label>
                <input
                  required
                  className="w-full rounded border p-2"
                  placeholder="e.g. RCC M25 Slab Casting & Shuttering - 5th Floor"
                  value={formData.work_description}
                  onChange={(e) => setFormData({ ...formData, work_description: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">Measurement Unit</label>
                <select
                  className="w-full rounded border p-2"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="SQFT">SQFT</option>
                  <option value="CUM">CUM (Cubic Meter)</option>
                  <option value="SQM">SQM (Square Meter)</option>
                  <option value="RMT">RMT (Running Meter)</option>
                  <option value="MT">MT (Metric Ton)</option>
                  <option value="NOS">NOS</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold">Approved BOQ Rate (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full rounded border p-2 font-mono"
                  value={formData.boq_rate}
                  onChange={(e) => setFormData({ ...formData, boq_rate: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">Previous Certified Qty</label>
                <input
                  type="number"
                  step="0.001"
                  className="w-full rounded border bg-slate-50 p-2 font-mono"
                  value={formData.previous_qty}
                  onChange={(e) => setFormData({ ...formData, previous_qty: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-blue-800">Current Bill Qty *</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  className="w-full rounded border-2 border-blue-600 p-2 font-mono font-bold"
                  value={formData.current_qty}
                  onChange={(e) => setFormData({ ...formData, current_qty: Number(e.target.value) })}
                />
              </div>

              {/* Statutory & Retention Rules */}
              <div>
                <label className="mb-1 block font-semibold text-amber-800">Retention Money %</label>
                <select
                  className="w-full rounded border p-2"
                  value={formData.retention_percent}
                  onChange={(e) => setFormData({ ...formData, retention_percent: Number(e.target.value) })}
                >
                  <option value={5}>5% Standard Retention</option>
                  <option value={10}>10% High-Risk / Structural Retention</option>
                  <option value={0}>0% (No Retention)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-rose-800">Sec 194C TDS %</label>
                <select
                  className="w-full rounded border p-2"
                  value={formData.tds_percent}
                  onChange={(e) => setFormData({ ...formData, tds_percent: Number(e.target.value) })}
                >
                  <option value={1}>1% (Individual / HUF Contractor)</option>
                  <option value={2}>2% (Company / Firm Contractor)</option>
                  <option value={0}>0% (Lower Deduction Cert.)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold">GST Rate %</label>
                <select
                  className="w-full rounded border p-2"
                  value={formData.gst_percent}
                  onChange={(e) => setFormData({ ...formData, gst_percent: Number(e.target.value) })}
                >
                  <option value={18}>18% Works Contract GST</option>
                  <option value={12}>12% Govt / Affordable Housing</option>
                  <option value={0}>0% (Unregistered / Exempt)</option>
                </select>
              </div>
            </div>

            {/* Live Calculation Summary Box */}
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
              <div className="mb-2 flex items-center gap-1.5 font-bold text-slate-700 uppercase">
                <Calculator className="h-4 w-4 text-blue-700" /> Live RA Bill Settlement Sheet
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <span className="text-slate-600">Gross Current Work Value:</span>
                <span className="text-right font-mono font-bold">₹ {liveGross.toLocaleString('en-IN')}</span>

                <span className="text-slate-600">Add: GST ({formData.gst_percent}%):</span>
                <span className="text-right font-mono text-blue-700">+ ₹ {liveGst.toLocaleString('en-IN')}</span>

                <span className="text-amber-700">Less: Retention Held ({formData.retention_percent}%):</span>
                <span className="text-right font-mono text-amber-700">
                  - ₹ {liveRetention.toLocaleString('en-IN')}
                </span>

                <span className="text-rose-700">Less: Sec 194C TDS ({formData.tds_percent}%):</span>
                <span className="text-right font-mono text-rose-700">- ₹ {liveTds.toLocaleString('en-IN')}</span>

                <span className="border-t pt-1.5 text-sm font-extrabold text-slate-900">
                  Net Payable to Contractor:
                </span>
                <span className="border-t pt-1.5 text-right font-mono text-sm font-extrabold text-emerald-700">
                  ₹ {liveNetPayable.toLocaleString('en-IN')}
                </span>
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
                Save &amp; Generate RA Bill
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
