'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  PackageCheck,
  Boxes,
  CheckCircle2,
  Printer,
  ClipboardList,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PurchaseOrderRow {
  id: string;
  po_number: string;
  mr_number?: string | null;
  project_name: string;
  vendor_name: string;
  material_name: string;
  quantity: number;
  received_qty?: number | null;
  rate: number;
  gst_percent: number;
  total_amount: number;
  status: string;
}

interface InventoryRow {
  id: string;
  project_name: string;
  material_name: string;
  quantity: number;
  unit_rate?: number | null;
}

interface GrnRow {
  id: string;
  grn_number: string;
  po_number: string;
  project_name: string;
  vendor_name: string;
  material_name: string;
  received_qty: number;
  rate: number;
  gst_percent: number;
  total_amount: number;
  challan_no?: string | null;
  received_date: string;
  status: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

function getCookieValue(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : '';
}

export default function StoreInventoryGrnPage() {
  const [eligiblePOs, setEligiblePOs] = useState<PurchaseOrderRow[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryRow[]>([]);
  const [grnList, setGrnList] = useState<GrnRow[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentUser, setCurrentUser] = useState<string>('Store Manager');

  const [selectedPoId, setSelectedPoId] = useState<string>('');
  const [grnNumber, setGrnNumber] = useState<string>(
    `GRN-UE-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [receivedDate, setReceivedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [challanNo, setChallanNo] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [vendorName, setVendorName] = useState<string>('');
  const [materialName, setMaterialName] = useState<string>('');
  const [receivedQty, setReceivedQty] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [gstPercent, setGstPercent] = useState<string>('18');

  const fetchStoreData = async () => {
    setLoading(true);
    const [poRes, invRes, grnRes, projRes] = await Promise.all([
      supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('inventory')
        .select('*')
        .order('project_name', { ascending: true }),
      supabase
        .from('goods_receipt_notes')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name, project_name'),
    ]);

    if (!poRes.error && poRes.data) {
      const allowed = poRes.data.filter((po: any) =>
        ['Approved & Issued', 'Issued', 'Partially Received'].includes(po.status)
      );
      setEligiblePOs(allowed);
    }

    if (!invRes.error && invRes.data) {
      setInventoryList(invRes.data);
    }

    if (!grnRes.error && grnRes.data) {
      setGrnList(grnRes.data);
    }

    if (!projRes.error && projRes.data) {
      setProjects(
        projRes.data
          .map((p: any) => ({ id: String(p.id), name: p.name || p.project_name || '' }))
          .filter((p: ProjectOption) => Boolean(p.name))
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    const role = getCookieValue('ue_role');
    const email = getCookieValue('ue_session');
    if (role || email) {
      setCurrentUser(`${role || 'Store Manager'}${email ? ` (${email})` : ''}`);
    }
    fetchStoreData();
  }, []);

  const handleSelectPO = (poId: string) => {
    setSelectedPoId(poId);
    const po = eligiblePOs.find((item) => String(item.id) === poId);
    if (!po) {
      setProjectName('');
      setVendorName('');
      setMaterialName('');
      setReceivedQty('');
      setRate('');
      return;
    }

    const totalPoQty = Number(po.quantity || 0);
    const alreadyRec = Number(po.received_qty || 0);
    const remainingQty = Math.max(0, totalPoQty - alreadyRec);

    setProjectName(po.project_name || '');
    setVendorName(po.vendor_name || '');
    setMaterialName(po.material_name || '');
    setReceivedQty(remainingQty > 0 ? String(remainingQty) : String(totalPoQty));
    setRate(String(po.rate || 0));
    setGstPercent(String(po.gst_percent ?? 18));
  };

  const qtyNum = Number(receivedQty || 0);
  const rateNum = Number(rate || 0);
  const gstNum = Number(gstPercent || 0);
  const baseAmount = Math.round(qtyNum * rateNum * 100) / 100;
  const gstAmount = Math.round(((baseAmount * gstNum) / 100) * 100) / 100;
  const totalAmount = Math.round((baseAmount + gstAmount) * 100) / 100;

  const handleCreateGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenPO = eligiblePOs.find((p) => String(p.id) === selectedPoId);
    if (!chosenPO) {
      alert('Please select an Approved & Issued Purchase Order first.');
      return;
    }
    if (qtyNum <= 0 || rateNum <= 0) {
      alert('Please enter valid Received Quantity and Rate.');
      return;
    }

    setSubmitting(true);
    const matchedProj = projects.find(
      (p) => p.name.toLowerCase() === projectName.trim().toLowerCase()
    );
    const projectUuid = matchedProj && matchedProj.id ? matchedProj.id : null;

    const { error } = await supabase.rpc('post_grn_receipt', {
      p_grn_number: grnNumber.trim(),
      p_po_id: String(chosenPO.id),
      p_po_number: chosenPO.po_number,
      p_project_id: projectUuid,
      p_project_name: projectName.trim(),
      p_vendor_name: vendorName.trim(),
      p_material_name: materialName.trim(),
      p_received_qty: qtyNum,
      p_rate: rateNum,
      p_gst_percent: gstNum,
      p_challan_no: challanNo.trim() || null,
      p_received_date: receivedDate,
      p_received_by: currentUser,
    });

    setSubmitting(false);

    if (error) {
      alert('GRN Posting Error: ' + error.message);
      return;
    }

    setGrnNumber(`GRN-UE-${Math.floor(100000 + Math.random() * 900000)}`);
    setSelectedPoId('');
    setChallanNo('');
    setProjectName('');
    setVendorName('');
    setMaterialName('');
    setReceivedQty('');
    setRate('');
    await fetchStoreData();
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
              Universal Engicon Pvt. Ltd. • Store &amp; Stock Control
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Store Inventory &amp; GRN (PO Linked)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Receive material against Approved POs → Auto-Update Stock &amp; Post Balanced Finance Ledger
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Store Report
          </button>
        </div>

        {/* GRN Form Linked to Approved POs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <PackageCheck className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-extrabold text-slate-900">
              Record Goods Receipt Note (GRN) Against Approved PO
            </h2>
          </div>

          <form onSubmit={handleCreateGRN} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Approved PO *
              </label>
              <select
                required
                value={selectedPoId}
                onChange={(e) => handleSelectPO(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-blue-50/50 border border-blue-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
              >
                <option value="">
                  {loading
                    ? 'Loading Approved POs...'
                    : '-- Select Approved PO (Auto-Fills Site, Vendor & Material) --'}
                </option>
                {eligiblePOs.map((po) => {
                  const rem = Math.max(0, Number(po.quantity || 0) - Number(po.received_qty || 0));
                  return (
                    <option key={po.id} value={String(po.id)}>
                      {po.po_number} — {po.project_name} | {po.material_name} (Rem: {rem} / {po.quantity}) • {po.vendor_name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GRN Number *
              </label>
              <input
                type="text"
                required
                value={grnNumber}
                onChange={(e) => setGrnNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Receipt Date *
              </label>
              <input
                type="date"
                required
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project / Site (From PO)
              </label>
              <input
                type="text"
                readOnly
                value={projectName}
                placeholder="Auto-filled from PO"
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-extrabold text-blue-950"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vendor (From PO)
              </label>
              <input
                type="text"
                readOnly
                value={vendorName}
                placeholder="Auto-filled from PO"
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Material (From PO)
              </label>
              <input
                type="text"
                readOnly
                value={materialName}
                placeholder="Auto-filled from PO"
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vendor Challan / Invoice No
              </label>
              <input
                type="text"
                value={challanNo}
                onChange={(e) => setChallanNo(e.target.value)}
                placeholder="CH-2026-089"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Received Qty *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={receivedQty}
                onChange={(e) => setReceivedQty(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PO Rate (₹)
              </label>
              <input
                type="number"
                step="0.01"
                readOnly
                value={rate}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>

            <div className="lg:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <div className="text-xs text-slate-700">
                <span className="font-bold">GRN Value (incl. {gstNum}% GST): </span>
                <span className="text-base font-extrabold text-emerald-700 ml-1">
                  {formatINR(totalAmount)}
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? 'Syncing Stock & Ledger...' : 'Post GRN & Sync Stock/Ledger'}
              </button>
            </div>
          </form>
        </div>

        {/* Lower Grid: Current Inventory Stock + Recent GRNs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Inventory Stock */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Site Inventory Stock</h3>
              </div>
              <span className="text-xs font-bold text-slate-500">{inventoryList.length} Items</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Site &amp; Material</th>
                    <th className="py-3 px-4 text-right">Stock Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryList.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-slate-500">
                        No stock items recorded yet.
                      </td>
                    </tr>
                  ) : (
                    inventoryList.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{inv.material_name}</div>
                          <div className="text-[11px] text-slate-500">{inv.project_name}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-blue-800">
                          {Number(inv.quantity || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* GRN History */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Recent GRNs Posted</h3>
              </div>
              <span className="text-xs font-bold text-slate-500">{grnList.length} GRNs</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">GRN &amp; PO</th>
                    <th className="py-3 px-4">Site &amp; Material</th>
                    <th className="py-3 px-4 text-right">Qty</th>
                    <th className="py-3 px-4 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grnList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        No GRNs posted yet.
                      </td>
                    </tr>
                  ) : (
                    grnList.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-blue-700">{g.grn_number}</div>
                          <div className="font-mono text-[11px] text-slate-500">PO: {g.po_number}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{g.material_name}</div>
                          <div className="text-[11px] text-slate-500">{g.project_name}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">
                          {Number(g.received_qty || 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                          {formatINR(Number(g.total_amount || 0))}
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
    </div>
  );
}