'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
  name?: string | null;
  project_name?: string | null;
  site_name?: string | null;
  title?: string | null;
}

interface MaterialRequestRow {
  id: string | number;
  mr_no?: string | null;
  mr_number?: string | null;
  project_id?: string | number | null;
  project_name?: string | null;
  project_site?: string | null;
  site_name?: string | null;
  project?: string | { name?: string | null; title?: string | null } | null;
  projects?: { name?: string | null; title?: string | null; site_name?: string | null } | null;
  material_name?: string | null;
  item_name?: string | null;
  quantity?: number | null;
  unit?: string | null;
  needed_by?: string | null;
  status?: string | null;
  remarks?: string | null;
  created_at?: string | null;
}

const MR_LOCAL_STORAGE_KEY = 'ue_material_requests_cache_v1';
const PROJECTS_LOCAL_KEY = 'ue_projects_master_v1';

function getProjectLabel(p?: ProjectOption | null): string {
  if (!p) return '';
  const vals = [p.project_name, p.name, p.site_name, p.title];
  const hit = vals.find((v) => typeof v === 'string' && v.trim().length > 0);
  return hit ? hit.trim() : '';
}

function resolveRowProjectName(
  row?: Partial<MaterialRequestRow> | null,
  projectLookup?: Map<string, string>
): string {
  if (!row) return '';

  if (typeof row.project === 'string' && row.project.trim()) {
    return row.project.trim();
  }
  if (typeof row.project === 'object' && row.project) {
    const nested = row.project.name || row.project.title;
    if (typeof nested === 'string' && nested.trim()) return nested.trim();
  }

  const anyRow = row as Record<string, unknown>;
  const extraVals = [
    anyRow.project_title,
    anyRow.site,
    anyRow.work_site,
    anyRow.projectName,
    anyRow.siteName,
  ];
  const foundExtra = extraVals.find(
    (v) => typeof v === 'string' && v.trim().length > 0
  ) as string | undefined;
  if (foundExtra) return foundExtra.trim();

  const directCandidates = [
    row.project_name,
    row.project_site,
    row.site_name,
    row.projects?.name,
    row.projects?.title,
    row.projects?.site_name,
  ];
  const foundDirect = directCandidates.find(
    (v) => typeof v === 'string' && v.trim().length > 0
  );
  if (foundDirect) return foundDirect.trim();

  if (row.project_id !== undefined && row.project_id !== null && projectLookup) {
    const mapped = projectLookup.get(String(row.project_id));
    if (mapped) return mapped;
  }

  return '';
}

export default function MaterialRequestsPage() {
  const [role, setRole] = useState<ErpRole | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [mrs, setMrs] = useState<MaterialRequestRow[]>([]);
  const [selectedMrId, setSelectedMrId] = useState<string | number | null>(null);
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

  const [showQuickProjectBox, setShowQuickProjectBox] = useState<boolean>(false);
  const [quickProjectName, setQuickProjectName] = useState<string>('');

  const generateMrNo = () => {
    const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `MR-UEPL-${stamp}-${rand}`;
  };

  const saveLocalCache = (rows: MaterialRequestRow[]) => {
    try {
      localStorage.setItem(MR_LOCAL_STORAGE_KEY, JSON.stringify(rows));
    } catch {}
  };

  const readLocalCache = (): MaterialRequestRow[] => {
    try {
      const raw = localStorage.getItem(MR_LOCAL_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as MaterialRequestRow[]) : [];
    } catch {
      return [];
    }
  };

  const readLocalProjects = (): ProjectOption[] => {
    try {
      const raw = localStorage.getItem(PROJECTS_LOCAL_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as ProjectOption[]) : [];
    } catch {
      return [];
    }
  };

  const projectLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) {
      const label = getProjectLabel(p);
      if (label && p.id !== undefined && p.id !== null) {
        map.set(String(p.id), label);
      }
    }
    return map;
  }, [projects]);

  const loadEmptyOrLiveData = async () => {
    setLoading(true);
    setErrorMsg(null);
    const localProjects = readLocalProjects();
    try {
      const { data: projData, error: projErr } = await supabase
        .from('projects')
        .select('*');

      const dbProjects: ProjectOption[] =
        !projErr && Array.isArray(projData) ? (projData as ProjectOption[]) : [];
      const loadedProjects = dbProjects.length > 0 ? dbProjects : localProjects;
      setProjects(loadedProjects);

      const lookup = new Map<string, string>();
      for (const p of loadedProjects) {
        const label = getProjectLabel(p);
        if (label && p.id !== undefined && p.id !== null) {
          lookup.set(String(p.id), label);
        }
      }

      const cachedRows = readLocalCache();
      const cacheMap = new Map<string, string>();
      for (const c of cachedRows) {
        const cProj = resolveRowProjectName(c, lookup);
        if (cProj) {
          cacheMap.set(String(c.id), cProj);
          if (c.mr_no) cacheMap.set(String(c.mr_no), cProj);
        }
      }

      const { data: mrData, error: mrErr } = await supabase
        .from('material_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (mrErr || !Array.isArray(mrData)) {
        setMrs(cachedRows);
      } else {
        const mergedRows = (mrData as MaterialRequestRow[]).map((row) => {
          const resolved = resolveRowProjectName(row, lookup);
          const fallbackProj =
            resolved ||
            cacheMap.get(String(row.id)) ||
            (row.mr_no ? cacheMap.get(String(row.mr_no)) : '') ||
            '';
          return {
            ...row,
            project_name: fallbackProj || row.project_name || '',
          };
        });

        setMrs(mergedRows);
        saveLocalCache(mergedRows);

        if (mergedRows.length > 0 && selectedMrId === null) {
          const firstRow = mergedRows[0];
          setSelectedMrId(firstRow.id);
          const firstProj = resolveRowProjectName(firstRow, lookup);
          if (firstProj) {
            setSelectedProject(firstProj);
          }
        }
      }
    } catch {
      setProjects(localProjects);
      setMrs(readLocalCache());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRole(getClientErpRole());
    setMrNo(generateMrNo());
    loadEmptyOrLiveData();
  }, []);

  const handleQuickAddProject = async () => {
    const cleanName = quickProjectName.trim();
    if (!cleanName) return;

    const newProj: ProjectOption = {
      id: Date.now(),
      name: cleanName,
      project_name: cleanName,
      site_name: cleanName,
    };

    const nextProjects = [newProj, ...projects];
    setProjects(nextProjects);
    setSelectedProject(cleanName);
    setQuickProjectName('');
    setShowQuickProjectBox(false);
    setStatusMsg(`New project "${cleanName}" added and selected.`);

    try {
      const existingLocal = readLocalProjects();
      localStorage.setItem(PROJECTS_LOCAL_KEY, JSON.stringify([newProj, ...existingLocal]));
    } catch {}

    try {
      const { error } = await supabase
        .from('projects')
        .insert([{ name: cleanName, site_name: cleanName, status: 'ACTIVE' }]);
      if (error) {
        await supabase
          .from('projects')
          .insert([{ project_name: cleanName, status: 'ACTIVE' }]);
      }
    } catch {}
  };

  const projectSuggestions = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      const label = getProjectLabel(p);
      if (label) set.add(label);
    }
    for (const row of mrs) {
      const proj = resolveRowProjectName(row, projectLookup);
      if (proj) set.add(proj);
    }
    return Array.from(set);
  }, [projects, mrs, projectLookup]);

  const activeMr = useMemo(
    () => mrs.find((item) => String(item.id) === String(selectedMrId)) || null,
    [mrs, selectedMrId]
  );

  const activeMrProject = useMemo(
    () => resolveRowProjectName(activeMr, projectLookup),
    [activeMr, projectLookup]
  );

  const handleSelectMrRow = (row: MaterialRequestRow) => {
    setSelectedMrId(row.id);
    const proj = resolveRowProjectName(row, projectLookup);
    setSelectedProject(proj);
  };

  const handleAssignProjectToMr = async (
    targetRow: MaterialRequestRow,
    projName: string
  ) => {
    const cleanProj = projName.trim();
    if (!cleanProj) return;

    setSelectedMrId(targetRow.id);
    setSelectedProject(cleanProj);

    const updated = mrs.map((r) =>
      String(r.id) === String(targetRow.id) ? { ...r, project_name: cleanProj } : r
    );
    setMrs(updated);
    saveLocalCache(updated);

    try {
      await supabase
        .from('material_requests')
        .update({ project_name: cleanProj })
        .eq('id', targetRow.id);
    } catch {}
  };

  const handleCreateMr = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    setErrorMsg(null);

    const qtyNum = Number(quantity);
    const cleanProject = selectedProject.trim();
    if (!cleanProject || !materialName.trim() || !Number.isFinite(qtyNum) || qtyNum <= 0) {
      setErrorMsg(
        'Please select/enter Project/Site, Material Name, and a valid Quantity greater than 0.'
      );
      setSubmitting(false);
      return;
    }

    const newRow: MaterialRequestRow = {
      id: Date.now(),
      mr_no: mrNo,
      project_name: cleanProject,
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
      } catch {}

      if (error) {
        const nextList = [newRow, ...mrs];
        setMrs(nextList);
        saveLocalCache(nextList);
      } else {
        const nextList = [newRow, ...mrs];
        saveLocalCache(nextList);
        await loadEmptyOrLiveData();
      }

      setSelectedMrId(newRow.id);
      setSelectedProject(cleanProject);
      setStatusMsg(`Material Request ${newRow.mr_no} created for ${cleanProject}.`);
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
              Material Indent &amp; Requisition
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

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              + Add New Project
            </Link>
            <button
              type="button"
              onClick={loadEmptyOrLiveData}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold uppercase tracking-wider transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Selected MR -> Indenting Project / Site Display */}
        <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
              Indenting Project / Site Against MR
            </p>
            <p className="text-lg font-extrabold text-white mt-0.5">
              {activeMrProject || selectedProject || 'No project linked yet'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeMr
                ? `Selected MR: ${activeMr.mr_no ?? activeMr.mr_number ?? `#${activeMr.id}`}`
                : 'Enter or add a project below, then submit your MR'}
            </p>
          </div>

          {projectSuggestions.length > 0 && activeMr && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Link Project to Selected MR:</span>
              {projectSuggestions.map((proj) => (
                <button
                  key={proj}
                  type="button"
                  onClick={() => handleAssignProjectToMr(activeMr, proj)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 text-xs font-bold text-amber-300 transition"
                >
                  {proj}
                </button>
              ))}
            </div>
          )}
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase text-slate-300">
                  Project / Site Name
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickProjectBox((prev) => !prev)}
                  className="text-[11px] font-bold text-amber-400 hover:underline"
                >
                  {showQuickProjectBox ? 'Cancel' : '+ Quick Add Project'}
                </button>
              </div>

              {showQuickProjectBox ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickProjectName}
                    onChange={(e) => setQuickProjectName(e.target.value)}
                    placeholder="New project name..."
                    className="flex-1 px-3 py-2.5 rounded-lg bg-slate-950 border border-amber-400 text-sm text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddProject}
                    className="px-3 py-2.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-extrabold"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  list="erp-projects-list"
                  required
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  placeholder="Enter or select project/site"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              )}

              <datalist id="erp-projects-list">
                {projectSuggestions.map((label) => (
                  <option key={label} value={label} />
                ))}
              </datalist>
              {projectSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {projectSuggestions.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSelectedProject(label)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-[11px] font-semibold text-amber-300 border border-slate-700 transition"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
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

        {/* MR List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
              Material Requests ({mrs.length})
            </h2>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              Select MR row or pick project directly in row
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
                  mrs.map((row) => {
                    const rowProj = resolveRowProjectName(row, projectLookup);
                    const isSelected = String(row.id) === String(selectedMrId);
                    return (
                      <tr
                        key={String(row.id)}
                        onClick={() => handleSelectMrRow(row)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-500/15 border-l-4 border-amber-400'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-white">
                          {row.mr_no ?? row.mr_number ?? `#${row.id}`}
                        </td>
                        <td
                          className="py-3 px-4 font-bold text-amber-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {projectSuggestions.length > 0 ? (
                            <select
                              value={rowProj}
                              onChange={(e) => handleAssignProjectToMr(row, e.target.value)}
                              className="px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-amber-300 font-bold text-xs focus:outline-none focus:border-amber-400"
                            >
                              <option value="">
                                {rowProj ? rowProj : '-- Select Project --'}
                              </option>
                              {projectSuggestions.map((proj) => (
                                <option key={proj} value={proj}>
                                  {proj}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span>{rowProj || 'Unlinked'}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-200">
                          {row.material_name ?? row.item_name ?? '-'}
                        </td>
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}