'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FileText, CheckCircle2, PlusCircle, Printer } from 'lucide-react';

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
  created_at?: string;
}

export default function PurchaseOrdersPage() {
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    fetchData();
  }, []);

  const handleSelectMR = (mrId: string) => {
    setSelectedMrId(mrId);
    const mr = materialRequests.find((item) => item.id === mrId);
    if (!mr) {
      setSelectedProject('');
      return;
    }

    setSelectedProject(mr.project_name);
    if (mr.material_desc) setSelectedMaterial(mr.material_desc);
    if (mr.quantity > 0) setPoQuantity(String(mr.quantity));
  };

  const qtyNum = Number(poQuantity || 0);
  const rateNum = Number(poRate || 0);
  const gstNum = Number(gstPercent || 0);
  const baseAmount = qtyNum * rateNum;
  const gstAmount = (baseAmount * gstNum) / 100;
  const totalAmount = Math.round(baseAmount + gstAmount);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject.trim() || !vendorName.trim() || !selectedMaterial.trim() || qtyNum <= 0) {
      alert('Please select an MR (or fill Project, Vendor, Material, and Quantity).');
      return;
    }

    setSaving(true);
    const chosenMR = materialRequests.find((m) => m.id === selectedMrId);

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
        status: 'Issued',
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
        .update({ status: 'PO Issued' })
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
              Universal Engicon Pvt. Ltd. • Procurement
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Purchase Orders (PO)
            </h1>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Register
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <PlusCircle className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-extrabold text-slate-900">
              Issue Purchase Order from Material Request
            </h2>
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
                  {loading ? 'Loading Material Requests...' : '-- Select MR (Shows Site, Material & Qty) --'}
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
              <div className="text-xs text-slate-700">
                <span className="font-bold">Total PO Value (incl. GST): </span>
                <span className="text-base font-extrabold text-emerald-700 ml-1">
                  {formatINR(totalAmount)}
                </span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving ? 'Issuing PO...' : 'Issue Purchase Order'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Issued Purchase Orders</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-5">PO No</th>
                  <th className="py-3.5 px-5">MR No</th>
                  <th className="py-3.5 px-5">Project / Site</th>
                  <th className="py-3.5 px-5">Vendor</th>
                  <th className="py-3.5 px-5">Material &amp; Qty</th>
                  <th className="py-3.5 px-5 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No purchase orders issued yet.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-5 font-mono font-bold text-blue-700">{po.po_number}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-600">{po.mr_number || '-'}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-900">{po.project_name}</td>
                      <td className="py-3.5 px-5 text-slate-700">{po.vendor_name}</td>
                      <td className="py-3.5 px-5 text-slate-700">
                        {po.material_name} ({po.quantity})
                      </td>
                      <td className="py-3.5 px-5 text-right font-extrabold text-emerald-700">
                        {formatINR(Number(po.total_amount || 0))}
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