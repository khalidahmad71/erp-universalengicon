'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import OfficialPrintDocument from '../../components/OfficialPrintDocument';
import { Plus, Printer, Receipt, X } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function ContractorRABillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [printBill, setPrintBill] = useState<any | null>(null);

  const [form, setForm] = useState({
    bill_no: `RA-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 89)}`,
    work_order_id: '',
    project_id: '',
    contractor_name: '',
    contractor_pan: '',
    work_description: '',
    gross_amount: 0,
    retention_percent: 5,
    gst_percent: 18,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: billData }, { data: projData }, { data: woData }] = await Promise.all([
        supabase.from('ra_bills').select('*, projects(name)').order('created_at', { ascending: false }),
        supabase.from('projects').select('id, name'),
        supabase.from('subcontractor_work_orders').select('*').eq('status', 'Active'),
      ]);
      if (billData) setBills(billData);
      if (projData) setProjects(projData);
      if (woData) setWorkOrders(woData);
    } catch (err) {
      console.error('Error loading RA data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectWO = (woId: string) => {
    const selected = workOrders.find((w) => String(w.id) === woId);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        work_order_id: woId,
        project_id: selected.project_id ? String(selected.project_id) : prev.project_id,
        contractor_name: selected.contractor_name || '',
        contractor_pan: selected.contractor_pan_gst || '',
        work_description: selected.work_category || '',
        retention_percent: Number(selected.retention_percent ?? 5),
      }));
    } else {
      setForm((prev) => ({ ...prev, work_order_id: '' }));
    }
  };

  const gross = Number(form.gross_amount || 0);
  const retentionDeducted = (gross * Number(form.retention_percent || 0)) / 100;
  const taxableAfterRetention = gross - retentionDeducted;
  const gstAmt = (gross * Number(form.gst_percent || 0)) / 100;
  const netPayable = taxableAfterRetention + gstAmt;

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedWO = workOrders.find((w) => String(w.id) === form.work_order_id);

    const { error } = await supabase.from('ra_bills').insert([
      {
        bill_no: form.bill_no,
        work_order_id: form.work_order_id ? Number(form.work_order_id) : null,
        project_id: form.project_id ? Number(form.project_id) : null,
        contractor_name: form.contractor_name,
        contractor_pan: form.contractor_pan,
        work_description: form.work_description,
        gross_amount: gross,
        retention_percent: Number(form.retention_percent),
        retention_deducted: retentionDeducted,
        gst_amount: gstAmt,
        net_payable_amount: netPayable,
        approval_status: 'Pending MD Approval',
        status: 'Pending MD Approval',
      },
    ]);

    if (error) {
      alert('Error saving RA Bill: ' + error.message);
      return;
    }

    if (retentionDeducted > 0) {
      await supabase.from('retention_ledger').insert([
        {
          project_id: form.project_id ? Number(form.project_id) : null,
          work_order_id: form.work_order_id ? Number(form.work_order_id) : null,
          ra_bill_no: form.bill_no,
          contractor_name: form.contractor_name,
          gross_bill_amount: gross,
          retention_percent: Number(form.retention_percent),
          retained_amount: retentionDeducted,
          dlp_release_date: selectedWO?.dlp_release_date || null,
          release_status: 'Held (Under DLP)',
        },
      ]);
    }

    setShowForm(false);
    fetchData();
  };

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(val) || 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-800 text-white rounded-lg shadow">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Contractor Running Account (RA) Bills</h1>
            <p className="text-xs text-slate-500">
              UNIVERSAL ENGICON PVT. LTD. • Auto-Retention Deduction (5%/10%) & MD Sanction Workflow
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-800 text-white text-sm font-bold rounded-lg shadow hover:bg-slate-900 transition-all"
        >
          <Plus className="w-4 h-4" />
          New RA Bill
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSaveBill} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="font-bold text-slate-800">Certify Contractor RA Bill</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block font-semibold mb-1">Link Work Order (Optional)</label>
              <select
                value={form.work_order_id}
                onChange={(e) => handleSelectWO(e.target.value)}
                className="w-full border border-blue-300 bg-blue-50/40 rounded-lg px-3 py-2 font-semibold"
              >
                <option value="">-- Select Active Work Order --</option>
                {workOrders.map((wo) => (
                  <option key={wo.id} value={wo.id}>
                    {wo.wo_number} - {wo.contractor_name} ({wo.retention_percent}% Ret.)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">RA Bill No</label>
              <input
                type="text"
                required
                value={form.bill_no}
                onChange={(e) => setForm({ ...form, bill_no: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Project / Site</label>
              <select
                required
                value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Contractor Name</label>
              <input
                type="text"
                required
                value={form.contractor_name}
                onChange={(e) => setForm({ ...form, contractor_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Work Description (MB Item)</label>
              <input
                type="text"
                required
                value={form.work_description}
                onChange={(e) => setForm({ ...form, work_description: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-1">Gross Bill (₹)</label>
                <input
                  type="number"
                  required
                  value={form.gross_amount}
                  onChange={(e) => setForm({ ...form, gross_amount: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-2 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Retention %</label>
                <select
                  value={form.retention_percent}
                  onChange={(e) => setForm({ ...form, retention_percent: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-2 py-2 font-bold text-amber-800"
                >
                  <option value={5}>5%</option>
                  <option value={10}>10%</option>
                  <option value={0}>0%</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-100 p-4 rounded-lg gap-4">
            <div className="text-xs sm:text-sm font-semibold text-slate-700">
              Gross: <span className="font-bold">{formatINR(gross)}</span> − Retention ({form.retention_percent}%):{' '}
              <span className="font-bold text-amber-700">{formatINR(retentionDeducted)}</span> + GST:{' '}
              <span className="font-bold">{formatINR(gstAmt)}</span> = Net Payable:{' '}
              <span className="text-blue-800 font-black text-base">{formatINR(netPayable)}</span>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-700 text-white font-bold rounded-lg shadow hover:bg-emerald-800"
            >
              Submit for MD Approval
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <th className="py-3 px-4">RA Bill No</th>
                <th className="py-3 px-4">Contractor</th>
                <th className="py-3 px-4 text-right">Gross Amount</th>
                <th className="py-3 px-4 text-right">Retention Held</th>
                <th className="py-3 px-4 text-right">Net Payable</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Official PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-blue-800">{bill.bill_no || `RA-${bill.id}`}</td>
                  <td className="py-3 px-4 font-semibold">
                    {bill.contractor_name}
                    <div className="text-xs text-slate-400">{bill.projects?.name || 'Site'}</div>
                  </td>
                  <td className="py-3 px-4 text-right">{formatINR(bill.gross_amount)}</td>
                  <td className="py-3 px-4 text-right text-amber-700 font-semibold">
                    {formatINR(bill.retention_deducted || 0)} ({bill.retention_percent || 0}%)
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatINR(bill.net_payable_amount || bill.gross_amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        bill.approval_status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {bill.approval_status || bill.status || 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => setPrintBill(bill)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-slate-900 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print PDF
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && bills.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No Contractor RA Bills found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {printBill && (
        <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto bg-white rounded-xl p-5 shadow-2xl">
            <div className="no-print flex justify-between items-center border-b pb-3 mb-4">
              <span className="font-bold text-slate-700 text-sm">Contractor RA Bill Certificate (A4)</span>
              <button
                type="button"
                onClick={() => setPrintBill(null)}
                className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700"
              >
                Close Preview ✕
              </button>
            </div>
            <OfficialPrintDocument
              docType="CONTRACTOR RA BILL"
              docNumber={printBill.bill_no || `RA-${printBill.id}`}
              docDate={(printBill.created_at || new Date().toISOString()).slice(0, 10)}
              projectName={printBill.projects?.name || 'Universal Engicon Site'}
              partyTitle="Sub-Contractor Details"
              partyName={printBill.contractor_name || 'Contractor'}
              partyGstOrPan={printBill.contractor_pan}
              items={[
                {
                  description: `${printBill.work_description || 'Civil Work'} (Less Retention @ ${printBill.retention_percent || 0}%: ₹${printBill.retention_deducted || 0})`,
                  unit: 'LS',
                  quantity: 1,
                  rate: Number(printBill.gross_amount || 0),
                  amount: Number(printBill.gross_amount || 0) - Number(printBill.retention_deducted || 0),
                },
              ]}
              subTotal={Number(printBill.gross_amount || 0) - Number(printBill.retention_deducted || 0)}
              gstAmount={Number(printBill.gst_amount || 0)}
              grandTotal={Number(printBill.net_payable_amount || printBill.gross_amount || 0)}
              termsOrRemarks={`Retention Money of INR ${printBill.retention_deducted || 0} (${printBill.retention_percent || 0}%) has been retained as Security Deposit and will be released upon completion of Defect Liability Period (DLP).`}
            />
          </div>
        </div>
      )}
    </div>
  );
}