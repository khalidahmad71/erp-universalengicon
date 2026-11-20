'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import OfficialPrintDocument from '../../components/OfficialPrintDocument';import { Plus, Printer, ShoppingCart, X } from 'lucide-react';
export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [printPO, setPrintPO] = useState<any | null>(null);

  const [form, setForm] = useState({
    po_number: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    project_id: '',
    vendor_name: '',
    vendor_gstin: '',
    material_name: '',
    unit: 'Bags',
    quantity: 100,
    rate: 380,
    gst_percent: 18,
  });

  const fetchData = async () => {
    setLoading(true);
    const [{ data: poData }, { data: projData }] = await Promise.all([
      supabase.from('purchase_orders').select('*, projects(name)').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name'),
    ]);
    if (poData) setOrders(poData);
    if (projData) setProjects(projData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const baseAmount = Number(form.quantity) * Number(form.rate);
  const gstAmount = (baseAmount * Number(form.gst_percent)) / 100;
  const totalAmount = baseAmount + gstAmount;

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('purchase_orders').insert([
      {
        po_number: form.po_number,
        project_id: form.project_id ? Number(form.project_id) : null,
        vendor_name: form.vendor_name,
        vendor_gstin: form.vendor_gstin,
        material_name: form.material_name,
        unit: form.unit,
        quantity: Number(form.quantity),
        rate: Number(form.rate),
        gst_percent: Number(form.gst_percent),
        base_amount: baseAmount,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        status: 'Approved',
      },
    ]);

    if (error) {
      alert('Error saving PO: ' + error.message);
    } else {
      setShowForm(false);
      fetchData();
    }
  };

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val || 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-800 text-white rounded-lg shadow">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Purchase Orders (PO)</h1>
            <p className="text-xs text-slate-500">UNIVERSAL ENGICON PVT. LTD. • Procurement & GST Billing</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-800 text-white text-sm font-bold rounded-lg shadow hover:bg-slate-900 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create New PO
        </button>
      </div>

      {/* Create PO Form */}
      {showForm && (
        <form onSubmit={handleCreatePO} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="font-bold text-slate-800">Issue New Purchase Order</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block font-semibold mb-1">PO Number</label>
              <input
                type="text"
                required
                value={form.po_number}
                onChange={(e) => setForm({ ...form, po_number: e.target.value })}
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
              <label className="block font-semibold mb-1">Vendor / Supplier Name</label>
              <input
                type="text"
                required
                placeholder="e.g., UltraTech Cement Distributors"
                value={form.vendor_name}
                onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Vendor GSTIN</label>
              <input
                type="text"
                placeholder="10AAACT1234F1Z2"
                value={form.vendor_gstin}
                onChange={(e) => setForm({ ...form, vendor_gstin: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Material / Item Description</label>
              <input
                type="text"
                required
                placeholder="e.g., OPC 53 Grade Cement"
                value={form.material_name}
                onChange={(e) => setForm({ ...form, material_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold mb-1">Qty</label>
                <input
                  type="number"
                  required
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-2 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Unit</label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-2 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Rate (₹)</label>
                <input
                  type="number"
                  required
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-2 py-2"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-100 p-4 rounded-lg gap-4">
            <div className="text-sm font-semibold text-slate-700">
              Base: <span className="font-bold">{formatINR(baseAmount)}</span> + GST ({form.gst_percent}%):{' '}
              <span className="font-bold">{formatINR(gstAmount)}</span> = Grand Total:{' '}
              <span className="text-blue-800 font-black text-base">{formatINR(totalAmount)}</span>
            </div>
            <button type="submit" className="px-6 py-2.5 bg-emerald-700 text-white font-bold rounded-lg shadow hover:bg-emerald-800">
              Save & Approve PO
            </button>
          </div>
        </form>
      )}

      {/* PO Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4 text-right">Qty / Rate</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Official PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-blue-800">{po.po_number || `PO-${po.id}`}</td>
                  <td className="py-3 px-4 font-medium">{po.projects?.name || 'General Site'}</td>
                  <td className="py-3 px-4 font-semibold">{po.vendor_name}</td>
                  <td className="py-3 px-4">{po.material_name}</td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {po.quantity} {po.unit} @ ₹{po.rate}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatINR(po.total_amount || po.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setPrintPO(po)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-slate-900 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print PDF
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No Purchase Orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* A4 Official Print Modal */}
      {printPO && (
        <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto bg-white rounded-xl p-5 shadow-2xl">
            <div className="no-print flex justify-between items-center border-b pb-3 mb-4">
              <span className="font-bold text-slate-700 text-sm">Official A4 Letterhead Preview</span>
              <button
                onClick={() => setPrintPO(null)}
                className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700"
              >
                Close Preview ✕
              </button>
            </div>
            <OfficialPrintDocument
              docType="PURCHASE ORDER"
              docNumber={printPO.po_number || `PO-${printPO.id}`}
              docDate={(printPO.created_at || new Date().toISOString()).slice(0, 10)}
              projectName={printPO.projects?.name || 'Universal Engicon Site'}
              partyTitle="Supplier / Vendor Details"
              partyName={printPO.vendor_name || 'Approved Vendor'}
              partyGstOrPan={printPO.vendor_gstin}
              items={[
                {
                  description: printPO.material_name || 'Construction Material Supply',
                  unit: printPO.unit || 'Nos',
                  quantity: printPO.quantity || 1,
                  rate: printPO.rate || 0,
                  amount: Number(printPO.base_amount || printPO.total_amount || 0),
                },
              ]}
              subTotal={Number(printPO.base_amount || printPO.total_amount || 0)}
              gstAmount={Number(printPO.gst_amount || 0)}
              grandTotal={Number(printPO.total_amount || printPO.amount || 0)}
            />
          </div>
        </div>
      )}
    </div>
  );
}