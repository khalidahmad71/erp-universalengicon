'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import OfficialPrintDocument from '../../components/OfficialPrintDocument';
import {
  Briefcase,
  Plus,
  Printer,
  ShieldAlert,
  CheckCircle2,
  CalendarClock,
  X,
  IndianRupee,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SubContractorWorkOrdersPage() {
  const [activeTab, setActiveTab] = useState<'WORK_ORDERS' | 'RETENTION'>('WORK_ORDERS');
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [retentions, setRetentions] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [printWO, setPrintWO] = useState<any | null>(null);

  const [form, setForm] = useState({
    wo_number: `WO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    project_id: '',
    contractor_name: '',
    contractor_pan_gst: '',
    contractor_phone: '',
    work_category: '',
    unit: 'Sq.ft',
    estimated_qty: 1000,
    contract_rate: 120,
    retention_percent: 5,
    dlp_months: 12,
    completion_date: '',
  });

  const fetchAllData = async () => {
    setLoading(true);
    const [{ data: woData }, { data: retData }, { data: projData }] = await Promise.all([
      supabase.from('subcontractor_work_orders').select('*, projects(name)').order('created_at', { ascending: false }),
      supabase.from('retention_ledger').select('*, projects(name)').order('dlp_release_date', { ascending: true }),
      supabase.from('projects').select('id, name'),
    ]);

    if (woData) setWorkOrders(woData);
    if (retData) setRetentions(retData);
    if (projData) setProjects(projData);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const totalContractVal = Number(form.estimated_qty) * Number(form.contract_rate);

  // Auto-calculate DLP Release Date from Completion Date + DLP Months
  const calculateDlpReleaseDate = (compDate: string, months: number) => {
    if (!compDate) return null;
    const dt = new Date(compDate);
    dt.setMonth(dt.getMonth() + Number(months));
    return dt.toISOString().slice(0, 10);
  };

  const handleCreateWO = async (e: React.FormEvent) => {
    e.preventDefault();
    const dlpDate = calculateDlpReleaseDate(form.completion_date, form.dlp_months);

    const { error } = await supabase.from('subcontractor_work_orders').insert([
      {
        wo_number: form.wo_number,
        project_id: form.project_id ? Number(form.project_id) : null,
        contractor_name: form.contractor_name,
        contractor_pan_gst: form.contractor_pan_gst,
        contractor_phone: form.contractor_phone,
        work_category: form.work_category,
        unit: form.unit,
        estimated_qty: Number(form.estimated_qty),
        contract_rate: Number(form.contract_rate),
        total_contract_value: totalContractVal,
        retention_percent: Number(form.retention_percent),
        dlp_months: Number(form.dlp_months),
        completion_date: form.completion_date || null,
        dlp_release_date: dlpDate,
        status: 'Active',
      },
    ]);

    if (error) {
      alert('Error issuing Work Order: ' + error.message);
    } else {
      setShowForm(false);
      fetchAllData();
    }
  };

  const handleReleaseRetention = async (id: number) => {
    const confirmRelease = window.confirm('Confirm release of Retention Money / Security Deposit to sub-contractor?');
    if (!confirmRelease) return;

    const { error } = await supabase
      .from('retention_ledger')
      .update({
        release_status: 'Released',
        released_at: new Date().toISOString().slice(0, 10),
      })
      .eq('id', id);

    if (error) {
      alert('Error updating retention status: ' + error.message);
    } else {
      fetchAllData();
    }
  };

  const totalHeldRetention = retentions
    .filter((r) => r.release_status !== 'Released')
    .reduce((sum, r) => sum + Number(r.retained_amount || 0), 0);

  const totalReleasedRetention = retentions
    .filter((r) => r.release_status === 'Released')
    .reduce((sum, r) => sum + Number(r.retained_amount || 0), 0);

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val || 0);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      {/* Top Corporate Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-900 text-white rounded-lg shadow">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Sub-Contractor Work Orders & Retention Tracker
            </h1>
            <p className="text-xs text-slate-500">
              UNIVERSAL ENGICON PVT. LTD. • Rate Contracts (Sq.ft / Cum / Rmt) & DLP Security Deposit Ledger
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setActiveTab('WORK_ORDERS');
            setShowForm(!showForm);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-800 text-white text-sm font-bold rounded-lg shadow hover:bg-slate-900 transition-all"
        >
          <Plus className="w-4 h-4" />
          Issue Work Order
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-blue-700">Active Work Orders</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{workOrders.length}</p>
          </div>
          <Briefcase className="w-7 h-7 text-blue-700" />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-amber-600">Retention Held (Under DLP)</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{formatINR(totalHeldRetention)}</p>
          </div>
          <ShieldAlert className="w-7 h-7 text-amber-600" />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-emerald-600">Retention Released</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{formatINR(totalReleasedRetention)}</p>
          </div>
          <IndianRupee className="w-7 h-7 text-emerald-600" />
        </div>
      </div>

      {/* Tab Navigation Buttons */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={() => setActiveTab('WORK_ORDERS')}
          className={`px-4 py-2.5 rounded-lg text-sm font-bold border shadow-sm transition-all ${
            activeTab === 'WORK_ORDERS'
              ? 'bg-blue-800 text-white border-blue-900'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          1. Rate Contract Work Orders ({workOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('RETENTION')}
          className={`px-4 py-2.5 rounded-lg text-sm font-bold border shadow-sm transition-all ${
            activeTab === 'RETENTION'
              ? 'bg-blue-800 text-white border-blue-900'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          2. Retention Money & DLP Release Tracker ({retentions.length})
        </button>
      </div>

      {/* Issue New Work Order Form */}
      {showForm && activeTab === 'WORK_ORDERS' && (
        <form onSubmit={handleCreateWO} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="font-bold text-slate-800">Issue Sub-Contractor Rate Contract Work Order</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block font-semibold mb-1">Work Order No</label>
              <input
                type="text"
                required
                value={form.wo_number}
                onChange={(e) => setForm({ ...form, wo_number: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
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
              <label className="block font-semibold mb-1">Sub-Contractor Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Vishwakarma Construction & Labor"
                value={form.contractor_name}
                onChange={(e) => setForm({ ...form, contractor_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Contractor PAN / GSTIN</label>
              <input
                type="text"
                placeholder="ABCDE1234F"
                value={form.contractor_pan_gst}
                onChange={(e) => setForm({ ...form, contractor_pan_gst: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Scope of Work (Item Description)</label>
              <input
                type="text"
                required
                placeholder="e.g., RCC Shuttering, Reinforcement & Concreting"
                value={form.work_category}
                onChange={(e) => setForm({ ...form, work_category: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold mb-1">Unit</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-2 py-2"
                >
                  <option value="Sq.ft">Sq.ft</option>
                  <option value="Cum">Cum</option>
                  <option value="Rmt">Rmt</option>
                  <option value="Sq.m">Sq.m</option>
                  <option value="Nos">Nos</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Est. Qty</label>
                <input
                  type="number"
                  required
                  value={form.estimated_qty}
                  onChange={(e) => setForm({ ...form, estimated_qty: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-2 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Rate (₹)</label>
                <input
                  type="number"
                  required
                  value={form.contract_rate}
                  onChange={(e) => setForm({ ...form, contract_rate: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-2 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Retention Deduction (%)</label>
              <select
                value={form.retention_percent}
                onChange={(e) => setForm({ ...form, retention_percent: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-amber-800"
              >
                <option value={5}>5% Retention Money (Standard)</option>
                <option value={10}>10% Security + Retention</option>
                <option value={0}>0% (No Retention)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Target Completion Date</label>
              <input
                type="date"
                required
                value={form.completion_date}
                onChange={(e) => setForm({ ...form, completion_date: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Defect Liability Period (DLP)</label>
              <select
                value={form.dlp_months}
                onChange={(e) => setForm({ ...form, dlp_months: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              >
                <option value={6}>6 Months Post-Completion</option>
                <option value={12}>12 Months (1 Year DLP)</option>
                <option value={24}>24 Months (2 Years DLP)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-100 p-4 rounded-lg gap-4">
            <div className="text-sm font-semibold text-slate-700">
              Total Contract Value: <span className="text-blue-900 font-black text-base">{formatINR(totalContractVal)}</span>{' '}
              • DLP Release Date:{' '}
              <span className="font-bold text-emerald-700">
                {calculateDlpReleaseDate(form.completion_date, form.dlp_months) || 'Select Completion Date'}
              </span>
            </div>
            <button type="submit" className="px-6 py-2.5 bg-emerald-700 text-white font-bold rounded-lg shadow hover:bg-emerald-800">
              Issue Official Work Order
            </button>
          </div>
        </form>
      )}

      {/* TAB 1: WORK ORDERS TABLE */}
      {activeTab === 'WORK_ORDERS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                  <th className="py-3 px-4">WO Number</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Sub-Contractor</th>
                  <th className="py-3 px-4">Work & Rate</th>
                  <th className="py-3 px-4 text-right">Contract Value</th>
                  <th className="py-3 px-4 text-center">Retention / DLP</th>
                  <th className="py-3 px-4 text-center">Official Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-800">{wo.wo_number}</td>
                    <td className="py-3 px-4 font-medium">{wo.projects?.name || 'Site'}</td>
                    <td className="py-3 px-4 font-semibold">{wo.contractor_name}</td>
                    <td className="py-3 px-4">
                      <div>{wo.work_category}</div>
                      <span className="text-xs text-slate-500">
                        {wo.estimated_qty} {wo.unit} @ ₹{wo.contract_rate}/{wo.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatINR(wo.total_contract_value)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-bold">
                        {wo.retention_percent}% Ret. • {wo.dlp_months}M DLP
                      </span>
                      {wo.dlp_release_date && (
                        <div className="text-[11px] text-slate-500 mt-0.5">Due: {wo.dlp_release_date}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setPrintWO(wo)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-slate-900"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print WO
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && workOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No Sub-Contractor Work Orders issued yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RETENTION MONEY & DLP TRACKER */}
      {activeTab === 'RETENTION' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                  <th className="py-3 px-4">RA Bill Ref</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Sub-Contractor</th>
                  <th className="py-3 px-4 text-right">Gross Bill</th>
                  <th className="py-3 px-4 text-right">Retained Amount</th>
                  <th className="py-3 px-4 text-center">DLP Release Date</th>
                  <th className="py-3 px-4 text-center">Status / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {retentions.map((ret) => {
                  const isDue = ret.dlp_release_date && ret.dlp_release_date <= todayStr && ret.release_status !== 'Released';
                  return (
                    <tr key={ret.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-800">{ret.ra_bill_no}</td>
                      <td className="py-3 px-4 font-medium">{ret.projects?.name || 'Site'}</td>
                      <td className="py-3 px-4 font-semibold">{ret.contractor_name}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatINR(ret.gross_bill_amount)}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-amber-700">
                        {formatINR(ret.retained_amount)} ({ret.retention_percent}%)
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
                          {ret.dlp_release_date || 'Upon Completion'}
                        </span>
                        {isDue && (
                          <span className="block text-[10px] font-bold text-emerald-700 uppercase">
                            DLP Completed • Eligible Now
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {ret.release_status === 'Released' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Released ({ret.released_at})
                          </span>
                        ) : (
                          <button
                            onClick={() => handleReleaseRetention(ret.id)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm text-white transition-all ${
                              isDue ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-amber-600 hover:bg-slate-900'
                            }`}
                          >
                            Release Deposit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!loading && retentions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No Retention Money entries recorded yet. Deductions from RA Bills will appear here automatically.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official A4 Work Order Print Modal */}
      {printWO && (
        <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto bg-white rounded-xl p-5 shadow-2xl">
            <div className="no-print flex justify-between items-center border-b pb-3 mb-4">
              <span className="font-bold text-slate-700 text-sm">Official Sub-Contractor Work Order (A4)</span>
              <button
                onClick={() => setPrintWO(null)}
                className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700"
              >
                Close Preview ✕
              </button>
            </div>
            <OfficialPrintDocument
              docType="PURCHASE ORDER"
              docNumber={printWO.wo_number}
              docDate={(printWO.created_at || todayStr).slice(0, 10)}
              projectName={printWO.projects?.name || 'Universal Engicon Site'}
              partyTitle="Sub-Contractor Details"
              partyName={printWO.contractor_name}
              partyGstOrPan={printWO.contractor_pan_gst}
              items={[
                {
                  description: `WORK ORDER: ${printWO.work_category} (Retention: ${printWO.retention_percent}%, DLP: ${printWO.dlp_months} Months)`,
                  unit: printWO.unit,
                  quantity: printWO.estimated_qty,
                  rate: printWO.contract_rate,
                  amount: Number(printWO.total_contract_value),
                },
              ]}
              subTotal={Number(printWO.total_contract_value)}
              gstAmount={0}
              grandTotal={Number(printWO.total_contract_value)}
              termsOrRemarks={`1. Retention Money @ ${printWO.retention_percent}% shall be deducted from each Running Account (RA) Bill and released after ${printWO.dlp_months} months Defect Liability Period (Due: ${printWO.dlp_release_date || 'Post Completion'}). 2. All safety & statutory labor compliances are mandatory at site.`}
            />
          </div>
        </div>
      )}
    </div>
  );
}