'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import OfficialPrintDocument from '../../components/OfficialPrintDocument';
import { Plus, Printer, Receipt, X } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ContractorRABillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [printBill, setPrintBill] = useState<any | null>(null);

  const [form, setForm] = useState({
    bill_no: `RA-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 89)}`,
    project_id: '',
    contractor_name: '',
    contractor_pan: '',
    work_description: '',
    gross_amount: 0,
    gst_percent: 18,
  });

  const fetchData = async () => {
    setLoading(true);
    const [{ data: billData }, { data: projData }] = await Promise.all([
      supabase.from('ra_bills').select('*, projects(name)').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name'),
    ]);
    if (billData) setBills(billData);
    if (projData) setProjects(projData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const gross = Number(form.gross_amount);
  const gstAmt = (gross * Number(form.gst_percent)) / 100;
  const netPayable = gross + gstAmt;

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('ra_bills').insert([
      {
        bill_no: form.bill_no,
        project_id: form.project_id ? Number(form.project_id) : null,
        contractor_name: form.contractor_name,
        contractor_pan: form.contractor_pan,
        work_description: form.work_description,
        gross_amount: gross,
        gst_amount: gstAmt,
        net_payable_amount: netPayable,
        status: 'Approved',
      },
    ]);

    if (error) {
      alert('Error saving RA Bill: ' + error.message);
    } else {
      setShowForm(false);
      fetchData();
    }
  };

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val || 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-800 text-white rounded-lg shadow">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Contractor Running Account (RA) Bills</h1>
            <p className="text-xs text-slate-500">UNIVERSAL ENGICON PVT. LTD. • Measurement & Sub-Contractor Billing</p>
          </div>
        </div>
        <button
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
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Contractor Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Maa Sharda Civil Works"
                value={form.contractor_name}
                onChange={(e) => setForm({ ...form, contractor_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Contractor PAN / GST</label>
              <input
                type="text"
                placeholder="ABCDE1234F"
                value={form.contractor_pan}
                onChange={(e) => setForm({ ...form, contractor_pan: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Work Description (MB Item)</label>
              <input
                type="text"
                required
                placeholder="e.g., RCC Slab Shuttering & Steel Binding - 3rd Floor"
                value={form.work_description}
                onChange={(e) => setForm({ ...form, work_description: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Certified Gross Amount (₹)</label>
              <input
                type="number"
                required
                value={form.gross_amount}
                onChange={(e) => setForm({ ...form, gross_amount: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-100 p-4 rounded-lg gap-4">
            <div className="text-sm font-semibold text-slate-700">
              Gross: <span className="font-bold">{formatINR(gross)}</span> + GST (18%):{' '}
              <span className="font-bold">{formatINR(gstAmt)}</span> = Net Payable:{' '}
              <span className="text-blue-800 font-black text-base">{formatINR(netPayable)}</span>
            </div>
            <button type="submit" className="px-6 py-2.5 bg-emerald-700 text-white font-bold rounded-lg shadow hover:bg-emerald-800">
              Approve & Post to Ledger
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
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Contractor</th>
                <th className="py-3 px-4">Work Certified</th>
                <th className="py-3 px-4 text-right">Net Payable</th>
                <th className="py-3 px-4 text-center">Official PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-blue-800">{bill.bill_no || `RA-${bill.id}`}</td>
                  <td className="py-3 px-4 font-medium">{bill.projects?.name || 'Site'}</td>
                  <td className="py-3 px-4 font-semibold">{bill.contractor_name}</td>
                  <td className="py-3 px-4">{bill.work_description}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatINR(bill.net_payable_amount || bill.gross_amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
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
                  <td colSpan={6} className="py-8 text-center text-slate-400">No Contractor RA Bills found.</td>
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
                  description: printBill.work_description || 'Civil Construction Execution Work',
                  unit: 'LS',
                  quantity: 1,
                  rate: Number(printBill.gross_amount || printBill.net_payable_amount || 0),
                  amount: Number(printBill.gross_amount || printBill.net_payable_amount || 0),
                },
              ]}
              subTotal={Number(printBill.gross_amount || printBill.net_payable_amount || 0)}
              gstAmount={Number(printBill.gst_amount || 0)}
              grandTotal={Number(printBill.net_payable_amount || printBill.gross_amount || 0)}
            />
          </div>
        </div>
      )}
    </div>
  );
}