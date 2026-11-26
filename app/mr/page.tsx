'use client';

import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getClientErpRole } from '@/lib/erp-session';
import type { ErpRole } from '@/lib/rbac';

interface ProjectOption {
  id: string | number;
  name?: string;
  project_name?: string;
  site_name?: string;
}

interface MaterialRequestRow {
  id: string | number;
  mr_no?: string;
  project_name?: string;
  material_name?: string;
  quantity?: number;
  unit?: string;
  needed_by?: string;
  status?: string;
  remarks?: string;
  created_at?: string;
}

export default function MaterialRequestsPage() {
  const [role, setRole] = useState<ErpRole | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [mrs, setMrs] = useState<MaterialRequestRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [mrNo, setMrNo] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [materialName, setMaterialName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<string>('MT');
  const [neededBy, setNeededBy] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const generateMrNo = () => {
    const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `MR-UEPL-${stamp}-${rand}`;
  };

  const loadEmptyOrLiveData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: projData, error: projErr } = await supabase
        .from('projects')
        .select('*');

      if (!projErr && Array.isArray(projData)) {
        setProjects(projData as ProjectOption[]);
      } else {
        setProjects([]);
      }

      const { data: mrData, error: mrErr } = await supabase
        .from('material_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (mrErr) {
        setMrs([]);
      } else if (Array.isArray(mrData)) {
        setMrs(mrData as MaterialRequestRow[]);
      } else {
        setMrs([]);
      }
    } catch {
      setProjects([]);
      setMrs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRole(getClientErpRole());
    setMrNo(generateMrNo());
    loadEmptyOrLiveData();
  }, []);

  const handleCreateMr = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    setErrorMsg(null);

    const qtyNum = Number(quantity);
    if (!selectedProject.trim() || !materialName.trim() || !Number.isFinite(qtyNum) || qtyNum <= 0) {
      setErrorMsg('Please select/enter Project/Site, Material Name, and a valid Quantity greater than 0.');
      setSubmitting(false);
      return;
    }

    const newRow: MaterialRequestRow = {
      id: Date.now(),
      mr_no: mrNo,
      project_name: selectedProject.trim(),
      material_name: materialName.trim(),
      quantity: qtyNum,
      unit,
      needed_by: neededBy || '-',
      status: 'PENDING_APPROVAL',
      remarks: remarks.trim() || '-',
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('material_requests').insert([
        {
          mr_no: newRow.mr_no,
          project_name: newRow.project_name,
          material_name: newRow.material_name,
          quantity: newRow.quantity,
          unit: newRow.unit,
          needed_by: neededBy || null,
          status: newRow.status,
          remarks: newRow.remarks,
        },
      ]);

      try {
        await supabase.from('erp_audit_logs').insert([
          {
            action: 'MR_CREATED',
            module: 'MATERIAL_REQUEST',
            performed_by: `Role: ${role ?? 'Unauthenticated'}`,
            role_used: role ?? 'SITE_ENGINEER',
            details: `${newRow.mr_no} | Project: ${newRow.project_name} | ${newRow.material_name}: ${qtyNum} ${unit}`,
          },
        ]);
      } catch {
        // Non-blocking audit log insert
      }

      if (error) {
        setMrs((prev) => [newRow, ...prev]);
      } else {
        await loadEmptyOrLiveData();
      }

      setStatusMsg(`Material Request ${newRow.mr_no} created for ${newRow.project_name}.`);
      setMaterialName('');
      setQuantity('');
      setNeededBy('');
      setRemarks('');
      setMrNo(generateMrNo());
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not create Material Request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
              <ClipboardList className="w-4 h-4" />
              Material Indent & Requisition
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
              Material Requests (MR) — UNIVERSAL ENGICON PVT. LTD.
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
            onClick={loadEmptyOrLiveData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold uppercase tracking-wider transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Create MR Form */}
        <form
          onSubmit={handleCreateMr}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
            Generate New Material Request
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
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                MR Number
              </label>
              <input
                type="text"
                required
                value={mrNo}
                onChange={(e) => setMrNo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Project / Site Name
              </label>
              <input
                type="text"
                list="erp-projects-list"
                required
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                placeholder="Enter or select project/site"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
              <datalist id="erp-projects-list">
                {projects.map((p) => {
                  const label = p.project_name || p.name || p.site_name || String(p.id);
                  return <option key={String(p.id)} value={label} />;
                })}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Material Item
              </label>
              <input
                type="text"
                required
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="Material description"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Required Quantity
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Unit (UOM)
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="MT">MT</option>
                <option value="Bags">Bags</option>
                <option value="Cum">Cum</option>
                <option value="Sqft">Sqft</option>
                <option value="Nos">Nos</option>
                <option value="Ltrs">Ltrs</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Needed By Date
              </label>
              <input
                type="date"
                value={neededBy}
                onChange={(e) => setNeededBy(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Site Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Activity / BOQ reference"
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
            {submitting ? 'Submitting MR...' : 'Submit Material Request'}
          </button>
        </form>

        {/* MR List (Starts Empty When No MRs Exist) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
              Material Requests ({mrs.length})
            </h2>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              Empty until new MR is submitted
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <th className="py-3 px-4">MR No.</th>
                  <th className="py-3 px-4">Project / Site</th>
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4">Needed By</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {mrs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {loading
                        ? 'Checking material requests...'
                        : 'No Material Requests yet. Use the form above to create your first MR.'}
                    </td>
                  </tr>
                ) : (
                  mrs.map((row) => (
                    <tr key={String(row.id)} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white">
                        {row.mr_no ?? `#${row.id}`}
                      </td>
                      <td className="py-3 px-4 text-slate-200">{row.project_name ?? '-'}</td>
                      <td className="py-3 px-4 text-slate-200">{row.material_name ?? '-'}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-300">
                        {row.quantity ?? 0} {row.unit ?? ''}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{row.needed_by ?? '-'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold">
                          {row.status ?? 'PENDING'}
                        </span>
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