'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Lock, Unlock, Plus, Layers, ShieldAlert, 
  CheckCircle2, Calculator, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

interface BOQItem {
  id: number;
  project_id: number;
  wbs_code: string;
  item_name: string;
  unit: string;
  quantity: number;
  rate: number; // Client Billing Rate
  zero_cost_rate: number; // Internal Target Cost Rate
  ordered_qty: number;
  is_budget_locked: boolean;
}

interface Project {
  id: number;
  name: string;
}

export default function EnterpriseBOQControl() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [boqItems, setBoqItems] = useState<BOQItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State for New BOQ + Zero-Cost Item
  const [wbsCode, setWbsCode] = useState('WBS-1.0');
  const [itemName, setItemName] = useState('');
  const [unit, setUnit] = useState('Cum');
  const [quantity, setQuantity] = useState('');
  const [clientRate, setClientRate] = useState('');
  const [zeroCostRate, setZeroCostRate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchBOQItems(selectedProjectId);
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

  async function fetchBOQItems(projectId: number) {
    setLoading(true);
    const { data, error } = await supabase
      .from('boq')
      .select('*')
      .eq('project_id', projectId)
      .order('wbs_code', { ascending: true });

    if (!error && data) {
      setBoqItems(data);
    }
    setLoading(false);
  }

  async function handleAddBOQItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !itemName || !quantity || !zeroCostRate) return;

    setSaving(true);
    const { error } = await supabase.from('boq').insert({
      project_id: selectedProjectId,
      wbs_code: wbsCode,
      item_name: itemName,
      unit,
      quantity: Number(quantity),
      rate: Number(clientRate) || Number(zeroCostRate),
      zero_cost_rate: Number(zeroCostRate),
      ordered_qty: 0,
      is_budget_locked: false
    });

    if (!error) {
      setItemName('');
      setQuantity('');
      setClientRate('');
      setZeroCostRate('');
      fetchBOQItems(selectedProjectId);
    } else {
      alert('Error saving BOQ item: ' + error.message);
    }
    setSaving(false);
  }

  async function toggleBudgetLock(item: BOQItem) {
    const newLockState = !item.is_budget_locked;
    const { error } = await supabase
      .from('boq')
      .update({ is_budget_locked: newLockState })
      .eq('id', item.id);

    if (!error) {
      // Audit log entry
      await supabase.from('enterprise_audit_logs').insert({
        module_name: 'WBS_BOQ_CONTROL',
        action_type: newLockState ? 'LOCK_BUDGET' : 'UNLOCK_BUDGET',
        document_number: `${item.wbs_code} - ${item.item_name}`,
        new_values: { is_budget_locked: newLockState, zero_cost_rate: item.zero_cost_rate, quantity: item.quantity }
      });

      setBoqItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, is_budget_locked: newLockState } : row))
      );
    }
  }

  const totalClientValue = boqItems.reduce((sum, i) => sum + i.quantity * (i.rate || 0), 0);
  const totalZeroCostBudget = boqItems.reduce((sum, i) => sum + i.quantity * (i.zero_cost_rate || i.rate || 0), 0);
  const projectedMargin = totalClientValue - totalZeroCostBudget;

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to MD Command Center
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-600" /> WBS & Zero-Cost BOQ Budget Control
          </h1>
        </div>

        <div className="mt-3 md:mt-0 flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Active Project:</label>
          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Zero-Cost Margin Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Client Contract BOQ Value</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">{formatINR(totalClientValue)}</div>
          <span className="text-xs text-slate-500">Total Billable Contract Revenue</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Internal Zero-Cost Budget (Locked Limit)</span>
          <div className="mt-2 text-2xl font-bold text-blue-700">{formatINR(totalZeroCostBudget)}</div>
          <span className="text-xs text-slate-500">Max Allowed Spend (Material + Labor + Plant)</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <span className="text-xs font-semibold text-emerald-800 uppercase">Target Project Gross Margin</span>
          <div className="mt-2 text-2xl font-bold text-emerald-700">{formatINR(projectedMargin)}</div>
          <span className="text-xs text-emerald-700 font-medium">
            {totalClientValue > 0 ? ((projectedMargin / totalClientValue) * 100).toFixed(1) : '0.0'}% Baseline Profit Protection
          </span>
        </div>
      </div>

      {/* Add WBS + BOQ Item Form */}
      <form onSubmit={handleAddBOQItem} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
          <Calculator className="w-4 h-4 text-blue-600" /> Add WBS Activity & Zero-Cost Estimate
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">WBS Code</label>
            <select
              value={wbsCode}
              onChange={(e) => setWbsCode(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-2.5 py-2 text-sm"
            >
              <option value="WBS-1.0">WBS-1.0 Sub-Structure</option>
              <option value="WBS-2.0">WBS-2.0 Super-Structure</option>
              <option value="WBS-3.0">WBS-3.0 Masonry & Plaster</option>
              <option value="WBS-4.0">WBS-4.0 MEP & Fire</option>
              <option value="WBS-5.0">WBS-5.0 Finishing & Infra</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">BOQ Item / Material Description</label>
            <input
              type="text"
              required
              placeholder="e.g., Fe-550D TMT Steel Bars / M25 RMC Concrete"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Unit & Max Qty</label>
            <div className="flex gap-1">
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="border border-slate-300 rounded-md px-2 py-2 text-sm bg-slate-50"
              >
                <option value="MT">MT</option>
                <option value="Cum">Cum</option>
                <option value="Sqm">Sqm</option>
                <option value="Bags">Bags</option>
                <option value="Nos">Nos</option>
              </select>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Qty"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-2.5 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Client Rate (₹)</label>
            <input
              type="number"
              step="0.01"
              placeholder="Bill Rate"
              value={clientRate}
              onChange={(e) => setClientRate(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-2.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-blue-700 mb-1">Zero-Cost Rate (₹)*</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="Target Cost"
              value={zeroCostRate}
              onChange={(e) => setZeroCostRate(e.target.value)}
              className="w-full border border-blue-300 bg-blue-50/30 rounded-md px-2.5 py-2 text-sm font-semibold"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
          >
            <Plus className="w-4 h-4" /> {saving ? 'Saving...' : 'Add to Master BOQ'}
          </button>
        </div>
      </form>

      {/* Master BOQ Budget Lock Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-900 text-white flex justify-between items-center">
          <span className="font-semibold text-sm">Master WBS-BOQ Control Register</span>
          <span className="text-xs text-amber-300 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Locked items cannot exceed BOQ Qty in Purchase Orders
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading BOQ Register...</div>
          ) : boqItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">Is project mein abhi koi BOQ item nahi hai. Upar form se add karein.</div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                  <th className="py-3 px-4">WBS</th>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-4">Approved Qty</th>
                  <th className="py-3 px-4">PO Consumed</th>
                  <th className="py-3 px-4">Zero-Cost Rate</th>
                  <th className="py-3 px-4">Zero-Cost Budget</th>
                  <th className="py-3 px-4 text-right">Budget Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {boqItems.map((item) => {
                  const zRate = item.zero_cost_rate || item.rate || 0;
                  const totalBudget = item.quantity * zRate;
                  const consumed = item.ordered_qty || 0;
                  const pctUsed = item.quantity > 0 ? Math.min(100, Math.round((consumed / item.quantity) * 100)) : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-600">{item.wbs_code || 'WBS-1.0'}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.item_name}</td>
                      <td className="py-3 px-4 font-medium">{item.quantity} {item.unit}</td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-slate-700">{consumed} / {item.quantity} {item.unit} ({pctUsed}%)</div>
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                          <div className={`h-full ${pctUsed > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pctUsed}%` }} />
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-blue-700">{formatINR(zRate)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{formatINR(totalBudget)}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => toggleBudgetLock(item)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                            item.is_budget_locked
                              ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {item.is_budget_locked ? (
                            <><Lock className="w-3.5 h-3.5 text-amber-700" /> Locked (Active)</>
                          ) : (
                            <><Unlock className="w-3.5 h-3.5" /> Draft (Click to Lock)</>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}