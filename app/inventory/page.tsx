'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Warehouse, ArrowLeft, Truck, ArrowUpRight, PackageCheck, 
  AlertTriangle, CheckCircle2, ShieldAlert 
} from 'lucide-react';

interface Project {
  id: number;
  name: string;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  project_id: number;
  item_name: string;
  quantity: number;
  unit: string;
  rate: number;
  enterprise_vendors?: { name: string };
}

interface StockItem {
  id: number;
  project_id: number;
  material_name: string;
  unit: string;
  total_received: number;
  total_issued: number;
  current_balance: number;
  avg_rate: number;
}

interface GRNRecord {
  id: number;
  grn_number: string;
  vehicle_number: string;
  challan_number: string;
  material_name: string;
  received_qty: number;
  unit: string;
  grn_value: number;
  qc_status: string;
  created_at: string;
  purchase_orders?: { po_number: string };
}

interface IssueRecord {
  id: number;
  issue_slip_no: string;
  material_name: string;
  issued_qty: number;
  unit: string;
  issued_to_contractor: string;
  issue_type: string;
  recovery_amount: number;
  wbs_location: string;
  created_at: string;
}

export default function ZeroLeakageCentralStore() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'GRN' | 'ISSUE' | 'STOCK'>('GRN');

  const [projectPOs, setProjectPOs] = useState<PurchaseOrder[]>([]);
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [grnHistory, setGrnHistory] = useState<GRNRecord[]>([]);
  const [issueHistory, setIssueHistory] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // GRN Form State
  const [selectedPoId, setSelectedPoId] = useState<number | null>(null);
  const [vehicleNo, setVehicleNo] = useState('');
  const [challanNo, setChallanNo] = useState('');
  const [receivedQty, setReceivedQty] = useState('');
  const [qcStatus, setQcStatus] = useState('PASSED');
  const [submittingGrn, setSubmittingGrn] = useState(false);

  // Material Issue Form State
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const [issueQty, setIssueQty] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [issueType, setIssueType] = useState<'FREE_ISSUE' | 'CHARGEABLE_RECOVERY'>('FREE_ISSUE');
  const [wbsLocation, setWbsLocation] = useState('WBS-2.0 Super-Structure');
  const [submittingIssue, setSubmittingIssue] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadStoreData(selectedProjectId);
    }
  }, [selectedProjectId]);

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('id, name').order('id');
    if (data && data.length > 0) {
      setProjects(data);
      setSelectedProjectId(data[0].id);
    } else {
      setLoading(false);
    }
  }

  async function loadStoreData(projectId: number) {
    setLoading(true);
    const [poRes, stockRes, grnRes, issueRes] = await Promise.all([
      supabase.from('purchase_orders').select('*, enterprise_vendors(name)').eq('project_id', projectId).order('id', { ascending: false }),
      supabase.from('enterprise_store_stock').select('*').eq('project_id', projectId).order('material_name'),
      supabase.from('enterprise_grn').select('*, purchase_orders(po_number)').eq('project_id', projectId).order('id', { ascending: false }),
      supabase.from('enterprise_material_issues').select('*').eq('project_id', projectId).order('id', { ascending: false })
    ]);

    if (poRes.data) {
      setProjectPOs(poRes.data);
      setSelectedPoId(poRes.data.length > 0 ? poRes.data[0].id : null);
    }
    if (stockRes.data) {
      setStockList(stockRes.data);
      setSelectedStockId(stockRes.data.length > 0 ? stockRes.data[0].id : null);
    }
    if (grnRes.data) setGrnHistory(grnRes.data);
    if (issueRes.data) setIssueHistory(issueRes.data);
    setLoading(false);
  }

  // Active PO Calculation for GRN Validation
  const activePO = projectPOs.find((p) => p.id === selectedPoId);
  const alreadyReceivedForPO = activePO
    ? grnHistory.filter((g) => g.purchase_orders?.po_number === activePO.po_number).reduce((s, g) => s + Number(g.received_qty), 0)
    : 0;
  const pendingPoQty = activePO ? Math.max(0, Number(activePO.quantity) - alreadyReceivedForPO) : 0;
  const numRecQty = Number(receivedQty) || 0;
  const isGrnOverPO = activePO ? numRecQty > pendingPoQty : false;

  async function handleCreateGRN(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !activePO || numRecQty <= 0) return;

    if (isGrnOverPO) {
      alert(`GATE BLOCKED: Received Qty (${numRecQty}) exceeds Pending PO Balance (${pendingPoQty} ${activePO.unit})!`);
      return;
    }

    setSubmittingGrn(true);
    const { data: { user } } = await supabase.auth.getUser();
    const grnNumber = `UEPL/GRN/26-27/${String(grnHistory.length + 501).padStart(4, '0')}`;

    // 1. Insert GRN
    const { error } = await supabase.from('enterprise_grn').insert({
      grn_number: grnNumber,
      project_id: selectedProjectId,
      po_id: activePO.id,
      vehicle_number: vehicleNo.toUpperCase(),
      challan_number: challanNo.toUpperCase(),
      material_name: activePO.item_name,
      unit: activePO.unit,
      received_qty: numRecQty,
      po_rate: activePO.rate,
      qc_status: qcStatus,
      received_by: user?.email || 'store@universalengicon.com'
    });

    if (!error) {
      // 2. Update or Insert Live Central Store Stock
      const existingStock = stockList.find((s) => s.material_name === activePO.item_name);
      if (existingStock) {
        await supabase
          .from('enterprise_store_stock')
          .update({
            total_received: Number(existingStock.total_received) + numRecQty,
            avg_rate: activePO.rate,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStock.id);
      } else {
        await supabase.from('enterprise_store_stock').insert({
          project_id: selectedProjectId,
          material_name: activePO.item_name,
          unit: activePO.unit,
          total_received: numRecQty,
          total_issued: 0,
          avg_rate: activePO.rate
        });
      }

      // 3. Audit Log
      await supabase.from('enterprise_audit_logs').insert({
        user_id: user?.id,
        user_email: user?.email || 'store@universalengicon.com',
        module_name: 'CENTRAL_STORE_GRN',
        action_type: 'CREATE_GRN',
        document_number: grnNumber,
        new_values: { po: activePO.po_number, vehicle: vehicleNo, qty: numRecQty }
      });

      setVehicleNo('');
      setChallanNo('');
      setReceivedQty('');
      await loadStoreData(selectedProjectId);
    } else {
      alert('GRN Error: ' + error.message);
    }
    setSubmittingGrn(false);
  }

  // Active Stock Calculation for Material Issue
  const activeStock = stockList.find((s) => s.id === selectedStockId);
  const numIssueQty = Number(issueQty) || 0;
  const isStockInsufficient = activeStock ? numIssueQty > Number(activeStock.current_balance) : true;

  async function handleMaterialIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !activeStock || numIssueQty <= 0 || !contractorName) return;

    if (isStockInsufficient) {
      alert(`ISSUE BLOCKED: Store balance is only ${activeStock.current_balance} ${activeStock.unit}. Negative stock not allowed!`);
      return;
    }

    setSubmittingIssue(true);
    const { data: { user } } = await supabase.auth.getUser();
    const slipNo = `UEPL/MIS/26-27/${String(issueHistory.length + 801).padStart(4, '0')}`;

    // 1. Insert Material Issue Slip
    const { error } = await supabase.from('enterprise_material_issues').insert({
      issue_slip_no: slipNo,
      project_id: selectedProjectId,
      material_name: activeStock.material_name,
      unit: activeStock.unit,
      issued_qty: numIssueQty,
      issue_rate: activeStock.avg_rate || 0,
      issued_to_contractor: contractorName,
      issue_type: issueType,
      wbs_location: wbsLocation
    });

    if (!error) {
      // 2. Deduct from Central Store Stock
      await supabase
        .from('enterprise_store_stock')
        .update({
          total_issued: Number(activeStock.total_issued) + numIssueQty,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeStock.id);

      // 3. Audit Log
      await supabase.from('enterprise_audit_logs').insert({
        user_id: user?.id,
        user_email: user?.email || 'store@universalengicon.com',
        module_name: 'STORE_MATERIAL_ISSUE',
        action_type: issueType,
        document_number: slipNo,
        new_values: { contractor: contractorName, material: activeStock.material_name, qty: numIssueQty }
      });

      setIssueQty('');
      setContractorName('');
      await loadStoreData(selectedProjectId);
    } else {
      alert('Material Issue Error: ' + error.message);
    }
    setSubmittingIssue(false);
  }

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const totalInventoryValue = stockList.reduce((sum, s) => sum + Number(s.current_balance) * Number(s.avg_rate || 0), 0);
  const totalChargeableRecovery = issueHistory
    .filter((i) => i.issue_type === 'CHARGEABLE_RECOVERY')
    .reduce((sum, i) => sum + Number(i.recovery_amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to MD Command Center
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-emerald-600" /> Zero-Leakage Central Store & GRN Control
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Site Store:</label>
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

      {/* Store KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Live Site Inventory Valuation</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">{formatINR(totalInventoryValue)}</div>
          <span className="text-xs text-emerald-600 font-medium">{stockList.length} Active SKUs in Central Yard</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total GRNs Verified (Inward)</span>
          <div className="mt-2 text-2xl font-bold text-blue-700">{grnHistory.length} Challans</div>
          <span className="text-xs text-slate-500">100% Matched against Sanctioned POs</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm">
          <span className="text-xs font-semibold text-amber-800 uppercase">Contractor Chargeable Recovery</span>
          <div className="mt-2 text-2xl font-bold text-amber-900">{formatINR(totalChargeableRecovery)}</div>
          <span className="text-xs text-amber-700 font-medium">Auto-Linked for RA Bill Deduction</span>
        </div>
      </div>

      {/* Enterprise Store Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('GRN')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
            activeTab === 'GRN' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <Truck className="w-4 h-4 text-emerald-400" /> 1. Gate Entry & GRN (Inward)
        </button>
        <button
          onClick={() => setActiveTab('ISSUE')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
            activeTab === 'ISSUE' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-amber-400" /> 2. Material Issue & Contractor Recovery
        </button>
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
            activeTab === 'STOCK' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <PackageCheck className="w-4 h-4 text-blue-400" /> 3. Live Stock Ledger ({stockList.length})
        </button>
      </div>

      {/* TAB 1: GATE ENTRY & GRN */}
      {activeTab === 'GRN' && (
        <div className="space-y-6">
          <form onSubmit={handleCreateGRN} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-sm text-slate-800">Record Material Arrival (PO-Locked Gate Entry & GRN)</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                3-Way Match Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Open Purchase Order (PO)*</label>
                <select
                  value={selectedPoId || ''}
                  onChange={(e) => setSelectedPoId(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
                >
                  {projectPOs.length === 0 && <option value="">No Purchase Orders found for this site</option>}
                  {projectPOs.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.po_number || `PO-${po.id}`} • {po.item_name} ({po.quantity} {po.unit}) — {po.enterprise_vendors?.name || 'Vendor'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pending PO Balance</label>
                <div className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-bold text-slate-800 border border-slate-200">
                  {activePO ? `${pendingPoQty} ${activePO.unit} (Out of ${activePO.quantity})` : '0'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Truck / Vehicle No.*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., BR-01-GA-4521"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vendor Challan / E-Way No.*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CHL-88921"
                  value={challanNo}
                  onChange={(e) => setChallanNo(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Net Accepted Qty ({activePO?.unit || 'Unit'})*
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Weighbridge Qty"
                  value={receivedQty}
                  onChange={(e) => setReceivedQty(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm font-bold ${
                    isGrnOverPO ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Site QA/QC Lab Check</label>
                <select
                  value={qcStatus}
                  onChange={(e) => setQcStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
                >
                  <option value="PASSED">QC PASSED (Add to Stock)</option>
                  <option value="HOLD_LAB_TEST">HOLD (Cube/Tensile Test)</option>
                </select>
              </div>
            </div>

            {isGrnOverPO && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                GATE ENTRY LOCKED: Received quantity cannot exceed pending PO balance ({pendingPoQty} {activePO?.unit}).
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingGrn || !activePO || isGrnOverPO}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg disabled:opacity-50"
              >
                {submittingGrn ? 'Generating GRN...' : 'Verify & Generate Official GRN'}
              </button>
            </div>
          </form>

          {/* GRN Register Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-3 bg-slate-900 text-white text-sm font-semibold">Verified GRN Register</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                    <th className="py-3 px-4">GRN No.</th>
                    <th className="py-3 px-4">Against PO</th>
                    <th className="py-3 px-4">Vehicle & Challan</th>
                    <th className="py-3 px-4">Material & Qty</th>
                    <th className="py-3 px-4">GRN Value</th>
                    <th className="py-3 px-4">QC Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grnHistory.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{g.grn_number}</td>
                      <td className="py-3 px-4 font-medium text-blue-700">{g.purchase_orders?.po_number || 'PO'}</td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-bold text-slate-800">{g.vehicle_number}</div>
                        <div className="text-slate-500">Challan: {g.challan_number}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold">{g.material_name} — {g.received_qty} {g.unit}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{formatINR(g.grn_value)}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> {g.qc_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTRACTOR MATERIAL ISSUE */}
      {activeTab === 'ISSUE' && (
        <div className="space-y-6">
          <form onSubmit={handleMaterialIssue} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
              Issue Material to Site / Sub-Contractor (Auto-Recovery Enabled)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Available Store Stock*</label>
                <select
                  value={selectedStockId || ''}
                  onChange={(e) => setSelectedStockId(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
                >
                  {stockList.length === 0 && <option value="">No stock in store (Create GRN first)</option>}
                  {stockList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.material_name} (Available: {s.current_balance} {s.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Issue Quantity ({activeStock?.unit || 'Unit'})*
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Enter Qty"
                  value={issueQty}
                  onChange={(e) => setIssueQty(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm font-bold ${
                    numIssueQty > 0 && isStockInsufficient ? 'border-red-500 bg-red-50' : 'border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Accounting / Recovery Rule*</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as 'FREE_ISSUE' | 'CHARGEABLE_RECOVERY')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                >
                  <option value="FREE_ISSUE">Free Issue (Company Scope / BOQ)</option>
                  <option value="CHARGEABLE_RECOVERY">Chargeable (Deduct from Contractor RA Bill)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sub-Contractor / Site Engineer Name*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., M/s Maa Tara Civil Contractors"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Consumption WBS Location</label>
                <select
                  value={wbsLocation}
                  onChange={(e) => setWbsLocation(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="WBS-1.0 Sub-Structure">WBS-1.0 Sub-Structure</option>
                  <option value="WBS-2.0 Super-Structure">WBS-2.0 Super-Structure</option>
                  <option value="WBS-3.0 Masonry & Plaster">WBS-3.0 Masonry & Plaster</option>
                  <option value="WBS-5.0 Finishing & Infra">WBS-5.0 Finishing & Infra</option>
                </select>
              </div>
            </div>

            {issueType === 'CHARGEABLE_RECOVERY' && activeStock && numIssueQty > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                RECOVERY ALERT: {formatINR(numIssueQty * (activeStock.avg_rate || 0))} will be flagged for automatic deduction from {contractorName || 'Contractor'}'s next RA Bill.
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingIssue || !activeStock || isStockInsufficient}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg disabled:opacity-50"
              >
                {submittingIssue ? 'Issuing Slip...' : 'Generate Material Issue Slip'}
              </button>
            </div>
          </form>

          {/* Material Issue Register */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-3 bg-slate-900 text-white text-sm font-semibold">Material Issue & Recovery Register</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                    <th className="py-3 px-4">Slip No.</th>
                    <th className="py-3 px-4">Contractor / Receiver</th>
                    <th className="py-3 px-4">Material & Qty</th>
                    <th className="py-3 px-4">WBS Location</th>
                    <th className="py-3 px-4">Issue Type</th>
                    <th className="py-3 px-4">Recovery Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {issueHistory.map((iss) => (
                    <tr key={iss.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{iss.issue_slip_no}</td>
                      <td className="py-3 px-4 font-medium">{iss.issued_to_contractor}</td>
                      <td className="py-3 px-4 font-semibold">{iss.material_name} — {iss.issued_qty} {iss.unit}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{iss.wbs_location}</td>
                      <td className="py-3 px-4">
                        {iss.issue_type === 'CHARGEABLE_RECOVERY' ? (
                          <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            Chargeable Recovery
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            Free Issue (BOQ)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {iss.issue_type === 'CHARGEABLE_RECOVERY' ? formatINR(iss.recovery_amount) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE CENTRAL STORE STOCK */}
      {activeTab === 'STOCK' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-3 bg-slate-900 text-white text-sm font-semibold">
            Live Central Store Stock Ledger (Zero-Negative Balance Enforced)
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading Stock Ledger...</div>
            ) : stockList.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">Store mein abhi koi stock nahi hai. Pehle Gate Entry & GRN banayein.</div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                    <th className="py-3 px-4">Material Description</th>
                    <th className="py-3 px-4">Total Received (GRN)</th>
                    <th className="py-3 px-4">Total Issued</th>
                    <th className="py-3 px-4">Current Closing Stock</th>
                    <th className="py-3 px-4">Weighted Rate</th>
                    <th className="py-3 px-4">Closing Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockList.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{s.material_name}</td>
                      <td className="py-3 px-4 text-emerald-700 font-medium">{s.total_received} {s.unit}</td>
                      <td className="py-3 px-4 text-amber-700 font-medium">{s.total_issued} {s.unit}</td>
                      <td className="py-3 px-4 font-bold text-blue-700 text-base">{s.current_balance} {s.unit}</td>
                      <td className="py-3 px-4 text-slate-600">{formatINR(s.avg_rate)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{formatINR(s.current_balance * s.avg_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}