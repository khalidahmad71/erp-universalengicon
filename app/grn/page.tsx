'use client';

import React, { useEffect, useState } from 'react';
import { PackageCheck, PlusCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getClientErpRole } from '@/lib/erp-session';
import type { ErpRole } from '@/lib/rbac';

interface MaterialRow {
  id: string | number;
  name?: string;
  material_name?: string;
  unit?: string;
  stock_qty?: number;
}

export default function GrnPage() {
  const [role, setRole] = useState<ErpRole | null>(null);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [grnNumber, setGrnNumber] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>('');
  const [receivedQty, setReceivedQty] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateGrnNo = () => {
    const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `GRN-UEPL-${stamp}-${rand}`;
  };

  const loadMaterials = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.from('materials').select('*');
      if (error) {
        setErrorMsg(error.message);
        setMaterials([]);
      } else if (Array.isArray(data)) {
        setMaterials(data as MaterialRow[]);
        if (data.length > 0 && !selectedMaterialId) {
          setSelectedMaterialId(String(data[0].id));
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load materials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRole(getClientErpRole());
    setGrnNumber(generateGrnNo());
    loadMaterials();
  }, []);

  const handleGrnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    setErrorMsg(null);

    const qtyNum = Number(receivedQty);
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      setErrorMsg('Please enter a valid received quantity greater than 0.');
      setSubmitting(false);
      return;
    }

    try {
      const chosen = materials.find((m) => String(m.id) === selectedMaterialId);
      const materialLabel = chosen?.name ?? chosen?.material_name ?? 'Material Item';

      if (chosen && typeof chosen.stock_qty === 'number') {
        const updatedQty = chosen.stock_qty + qtyNum;
        const { error: updErr } = await supabase
          .from('materials')
          .update({ stock_qty: updatedQty })
          .eq('id', chosen.id);

        if (updErr) {
          setErrorMsg(updErr.message);
          setSubmitting(false);
          return;
        }
      }

      try {
        await supabase.from('erp_audit_logs').insert([
          {
            action: 'GRN_RECORDED',
            module: 'CENTRAL_STORE_GRN',
            performed_by: `Role: ${role ?? 'Unauthenticated'}`,
            role_used: role ?? 'STORE_MANAGER',
            details: `${grnNumber} | PO: ${poNumber || 'N/A'} | ${materialLabel} (+${qtyNum}) | ${remarks || 'Verified at store'}`,
          },
        ]);
      } catch {
        // Non-blocking audit insert
      }

      setStatusMsg(`GRN ${grnNumber} recorded for ${materialLabel} (+${qtyNum}).`);
      setReceivedQty('');
      setRemarks('');
      setGrnNumber(generateGrnNo());
      await loadMaterials();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not save GRN.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
              <PackageCheck className="w-4 h-4" />
              Central Store & Goods Receipt Note
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
              GRN & Material Inward — UNIVERSAL ENGICON PVT. LTD.
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Active Role:{' '}
              <span className="font-semibold text-amber-300">
                {role ?? 'Not Authenticated'}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={loadMaterials}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold uppercase tracking-wider transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Catalog
          </button>
        </div>

        {/* GRN Entry Card */}
        <form
          onSubmit={handleGrnSubmit}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
            New Goods Receipt Note (GRN)
          </h2>

          {statusMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/70 border border-emerald-700 text-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/70 border border-red-700 text-red-200 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                GRN Number
              </label>
              <input
                type="text"
                value={grnNumber}
                onChange={(e) => setGrnNumber(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                PO Reference (Optional)
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="PO-UEPL-..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Material Item
              </label>
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                {materials.length === 0 ? (
                  <option value="">No materials found in catalog</option>
                ) : (
                  materials.map((m) => (
                    <option key={String(m.id)} value={String(m.id)}>
                      {m.name ?? m.material_name ?? `Item #${m.id}`}
                      {m.unit ? ` (${m.unit})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Received Quantity
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={receivedQty}
                onChange={(e) => setReceivedQty(e.target.value)}
                placeholder="Enter quantity"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Challan / Inspection Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Vehicle no., challan no., quality check"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm shadow-lg transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            {submitting ? 'Saving GRN...' : 'Submit Goods Receipt (GRN)'}
          </button>
        </form>
      </div>
    </div>
  );
}