'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type OwnershipMode = 'JDA_SHARE' | 'SELF_PURCHASE';
type UnitCategory = 'RESIDENTIAL' | 'COMMERCIAL';
type ShareOwner = 'BUILDER' | 'LANDOWNER';

interface GeneratedUnit {
  unitCode: string;
  floorNo: number;
  floorLabel: string;
  ownerShare: ShareOwner;
  category: UnitCategory;
  areaSqft: number;
  ratePerSqft: number;
  totalPrice: number;
  status: 'AVAILABLE' | 'BOOKED';
}

interface ProjectRow {
  id: string | number;
  project_name?: string | null;
  name?: string | null;
  site_name?: string | null;
  location?: string | null;
  client_name?: string | null;
  status?: string | null;
  total_floors?: number | null;
  units_per_floor?: number | null;
  ownership_mode?: string | null;
  builder_floors?: string | null;
  landowner_floors?: string | null;
  units_matrix?: GeneratedUnit[] | null;
  created_at?: string | null;
}

const PROJECTS_LOCAL_KEY = 'ue_projects_master_v2';

function parseFloorList(input: string, maxFloors: number): number[] {
  const nums = input
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= maxFloors);
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

function defaultBuilderFloors(totalFloors: number, mode: OwnershipMode): number[] {
  if (mode === 'SELF_PURCHASE') {
    return Array.from({ length: totalFloors }, (_, i) => i + 1);
  }
  // Odd floors (1, 3, 5, 7, 9...) for Builder by default in JDA
  const odd: number[] = [];
  for (let f = 1; f <= totalFloors; f += 2) odd.push(f);
  return odd.length > 0 ? odd : [1];
}

function buildFloorUnits(params: {
  totalFloors: number;
  unitsPerFloor: number;
  ownershipMode: OwnershipMode;
  builderFloorInput: string;
  landownerFloorInput: string;
  defaultCategory: UnitCategory;
  defaultArea: number;
  defaultRate: number;
}): {
  builderSet: Set<number>;
  landownerSet: Set<number>;
  units: GeneratedUnit[];
} {
  const floors = Math.max(1, Math.min(100, Math.floor(params.totalFloors || 1)));
  const perFloor = Math.max(1, Math.min(50, Math.floor(params.unitsPerFloor || 1)));

  const builderFloors =
    params.ownershipMode === 'SELF_PURCHASE'
      ? defaultBuilderFloors(floors, 'SELF_PURCHASE')
      : params.builderFloorInput.trim()
      ? parseFloorList(params.builderFloorInput, floors)
      : defaultBuilderFloors(floors, 'JDA_SHARE');

  const builderSet = new Set<number>(builderFloors);

  const explicitLandowner =
    params.ownershipMode === 'SELF_PURCHASE'
      ? []
      : params.landownerFloorInput.trim()
      ? parseFloorList(params.landownerFloorInput, floors)
      : [];

  const landownerSet = new Set<number>(explicitLandowner);
  if (params.ownershipMode === 'JDA_SHARE' && landownerSet.size === 0) {
    for (let f = 1; f <= floors; f++) {
      if (!builderSet.has(f)) landownerSet.add(f);
    }
  }

  const units: GeneratedUnit[] = [];
  for (let f = 1; f <= floors; f++) {
    const ownerShare: ShareOwner =
      params.ownershipMode === 'SELF_PURCHASE'
        ? 'BUILDER'
        : landownerSet.has(f) && !builderSet.has(f)
        ? 'LANDOWNER'
        : 'BUILDER';

    for (let u = 1; u <= perFloor; u++) {
      const unitCode = `${f}${String(u).padStart(2, '0')}`;
      const totalPrice = Number((params.defaultArea * params.defaultRate).toFixed(2));
      units.push({
        unitCode,
        floorNo: f,
        floorLabel: `Floor ${f}`,
        ownerShare,
        category: params.defaultCategory,
        areaSqft: params.defaultArea,
        ratePerSqft: params.defaultRate,
        totalPrice,
        status: 'AVAILABLE',
      });
    }
  }

  return { builderSet, landownerSet, units };
}

function readLocalProjects(): ProjectRow[] {
  try {
    const raw = localStorage.getItem(PROJECTS_LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ProjectRow[]) : [];
  } catch {
    return [];
  }
}

function saveLocalProjects(rows: ProjectRow[]) {
  try {
    localStorage.setItem(PROJECTS_LOCAL_KEY, JSON.stringify(rows));
  } catch {}
}

export default function ProjectsMasterPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Project & Building Setup Inputs
  const [projectName, setProjectName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');

  const [ownershipMode, setOwnershipMode] = useState<OwnershipMode>('JDA_SHARE');
  const [totalFloors, setTotalFloors] = useState<string>('10');
  const [unitsPerFloor, setUnitsPerFloor] = useState<string>('4');
  const [builderFloorsText, setBuilderFloorsText] = useState<string>('1, 3, 5, 7, 9');
  const [landownerFloorsText, setLandownerFloorsText] = useState<string>('2, 4, 6, 8, 10');
  const [defaultCategory, setDefaultCategory] = useState<UnitCategory>('RESIDENTIAL');
  const [defaultArea, setDefaultArea] = useState<string>('1200');
  const [defaultRate, setDefaultRate] = useState<string>('4500');

  // Unit feed editor state
  const [editingUnitCode, setEditingUnitCode] = useState<string | null>(null);
  const [editOwnerShare, setEditOwnerShare] = useState<ShareOwner>('BUILDER');
  const [editCategory, setEditCategory] = useState<UnitCategory>('RESIDENTIAL');
  const [editArea, setEditArea] = useState<string>('1200');
  const [editRate, setEditRate] = useState<string>('4500');
  const [editStatus, setEditStatus] = useState<'AVAILABLE' | 'BOOKED'>('AVAILABLE');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    const local = readLocalProjects();

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setErrorMsg(`Supabase notice: ${error.message} — showing cached/local projects.`);
        setProjects(local);
        if (local.length > 0 && selectedProjectId === null) {
          setSelectedProjectId(local[0].id);
        }
        return;
      }

      const dbRows = Array.isArray(data) ? (data as ProjectRow[]) : [];
      const merged = dbRows.length > 0 ? dbRows : local;
      setProjects(merged);
      if (dbRows.length > 0) saveLocalProjects(dbRows);

      if (merged.length > 0 && selectedProjectId === null) {
        setSelectedProjectId(merged[0].id);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load projects.');
      setProjects(local);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleOwnershipChange = (nextMode: OwnershipMode) => {
    setOwnershipMode(nextMode);
    const floorsNum = Math.max(1, Math.min(100, Number(totalFloors) || 10));
    if (nextMode === 'SELF_PURCHASE') {
      const all = Array.from({ length: floorsNum }, (_, i) => i + 1).join(', ');
      setBuilderFloorsText(all);
      setLandownerFloorsText('');
    } else {
      const odd = defaultBuilderFloors(floorsNum, 'JDA_SHARE').join(', ');
      const even: number[] = [];
      const oddSet = new Set(defaultBuilderFloors(floorsNum, 'JDA_SHARE'));
      for (let f = 1; f <= floorsNum; f++) {
        if (!oddSet.has(f)) even.push(f);
      }
      setBuilderFloorsText(odd);
      setLandownerFloorsText(even.join(', '));
    }
  };

  const previewStructure = useMemo(() => {
    return buildFloorUnits({
      totalFloors: Number(totalFloors) || 1,
      unitsPerFloor: Number(unitsPerFloor) || 1,
      ownershipMode,
      builderFloorInput: builderFloorsText,
      landownerFloorInput: landownerFloorsText,
      defaultCategory,
      defaultArea: Math.max(0, Number(defaultArea) || 0),
      defaultRate: Math.max(0, Number(defaultRate) || 0),
    });
  }, [
    totalFloors,
    unitsPerFloor,
    ownershipMode,
    builderFloorsText,
    landownerFloorsText,
    defaultCategory,
    defaultArea,
    defaultRate,
  ]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    setErrorMsg(null);

    const cleanName = projectName.trim();
    if (!cleanName) {
      setErrorMsg('Please enter Project / Site Name.');
      setSubmitting(false);
      return;
    }

    const built = buildFloorUnits({
      totalFloors: Number(totalFloors) || 1,
      unitsPerFloor: Number(unitsPerFloor) || 1,
      ownershipMode,
      builderFloorInput: builderFloorsText,
      landownerFloorInput: landownerFloorsText,
      defaultCategory,
      defaultArea: Math.max(0, Number(defaultArea) || 0),
      defaultRate: Math.max(0, Number(defaultRate) || 0),
    });

    const newProj: ProjectRow = {
      id: Date.now(),
      name: cleanName,
      project_name: cleanName,
      site_name: location.trim() || cleanName,
      location: location.trim() || '-',
      client_name:
        clientName.trim() ||
        (ownershipMode === 'SELF_PURCHASE'
          ? 'Self Purchase (100% Universal Engicon)'
          : 'JDA (Builder + Landowner)'),
      status,
      total_floors: Math.max(1, Number(totalFloors) || 1),
      units_per_floor: Math.max(1, Number(unitsPerFloor) || 1),
      ownership_mode: ownershipMode,
      builder_floors: Array.from(built.builderSet).join(', '),
      landowner_floors: Array.from(built.landownerSet).join(', '),
      units_matrix: built.units,
      created_at: new Date().toISOString(),
    };

    try {
      // Minimal safe insert first so schema differences on extra columns never block project creation
      let { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name: cleanName,
            site_name: location.trim() || cleanName,
            status,
          },
        ])
        .select('*');

      if (error) {
        const retry = await supabase
          .from('projects')
          .insert([
            {
              project_name: cleanName,
              site_name: location.trim() || cleanName,
              location: location.trim() || null,
              client_name: newProj.client_name,
              status,
            },
          ])
          .select('*');
        data = retry.data;
        error = retry.error;
      }

      const persistedProj: ProjectRow =
        Array.isArray(data) && data[0]?.id !== undefined
          ? { ...newProj, ...(data[0] as ProjectRow), units_matrix: built.units }
          : newProj;

      const updatedList = [
        persistedProj,
        ...projects.filter((p) => String(p.id) !== String(persistedProj.id)),
      ];
      setProjects(updatedList);
      saveLocalProjects(updatedList);
      setSelectedProjectId(persistedProj.id);

      if (error) {
        setStatusMsg(
          `Project "${cleanName}" opened with ${built.units.length} units (saved locally; DB notice: ${error.message}).`
        );
      } else {
        setStatusMsg(
          `Project "${cleanName}" saved & ${built.units.length} units opened across ${
            Number(totalFloors) || 1
          } floors.`
        );
      }

      setProjectName('');
      setLocation('');
      setClientName('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error creating project.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeProject = useMemo(() => {
    if (projects.length === 0) return null;
    return (
      projects.find((p) => String(p.id) === String(selectedProjectId)) || projects[0]
    );
  }, [projects, selectedProjectId]);

  const activeUnits = useMemo<GeneratedUnit[]>(() => {
    if (!activeProject) return [];
    if (Array.isArray(activeProject.units_matrix) && activeProject.units_matrix.length > 0) {
      return activeProject.units_matrix;
    }
    const floors = Math.max(1, Number(activeProject.total_floors) || 1);
    const perFloor = Math.max(1, Number(activeProject.units_per_floor) || 1);
    const mode: OwnershipMode =
      activeProject.ownership_mode === 'SELF_PURCHASE' ? 'SELF_PURCHASE' : 'JDA_SHARE';
    return buildFloorUnits({
      totalFloors: floors,
      unitsPerFloor: perFloor,
      ownershipMode: mode,
      builderFloorInput: activeProject.builder_floors || '',
      landownerFloorInput: activeProject.landowner_floors || '',
      defaultCategory: 'RESIDENTIAL',
      defaultArea: 1200,
      defaultRate: 4500,
    }).units;
  }, [activeProject]);

  const openUnitEditor = (u: GeneratedUnit) => {
    setEditingUnitCode(u.unitCode);
    setEditOwnerShare(u.ownerShare);
    setEditCategory(u.category);
    setEditArea(String(u.areaSqft));
    setEditRate(String(u.ratePerSqft));
    setEditStatus(u.status);
  };

  const handleSaveUnitData = (unitCode: string) => {
    if (!activeProject) return;
    const areaNum = Math.max(0, Number(editArea) || 0);
    const rateNum = Math.max(0, Number(editRate) || 0);
    const updatedUnits = activeUnits.map((u) =>
      u.unitCode === unitCode
        ? {
            ...u,
            ownerShare: editOwnerShare,
            category: editCategory,
            areaSqft: areaNum,
            ratePerSqft: rateNum,
            totalPrice: Number((areaNum * rateNum).toFixed(2)),
            status: editStatus,
          }
        : u
    );

    const updatedProjects = projects.map((p) =>
      String(p.id) === String(activeProject.id) ? { ...p, units_matrix: updatedUnits } : p
    );
    setProjects(updatedProjects);
    saveLocalProjects(updatedProjects);
    setEditingUnitCode(null);
    setStatusMsg(`Unit ${unitCode} data updated (${editOwnerShare} • ${editCategory}).`);
  };

  const summaryCounts = useMemo(() => {
    let builderCount = 0;
    let landownerCount = 0;
    let residentialCount = 0;
    let commercialCount = 0;

    for (const u of activeUnits) {
      if (u.ownerShare === 'BUILDER') builderCount++;
      else landownerCount++;

      if (u.category === 'RESIDENTIAL') residentialCount++;
      else commercialCount++;
    }

    return { builderCount, landownerCount, residentialCount, commercialCount };
  }, [activeUnits]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
              <Building2 className="w-4 h-4" />
              Project, Floor &amp; Unit Matrix Setup
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
              New Project &amp; Floor/Unit Generator — UNIVERSAL ENGICON PVT. LTD.
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Kisi bhi floor count (5, 10, 15+) ke liye JDA (Builder/Landowner) ya Self Purchase ke hisaab se floors aur units open karein.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/mr"
              className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold uppercase"
            >
              Go to MR Module
            </Link>
            <button
              type="button"
              onClick={() => loadProjects()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold uppercase"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Create Project & Open Floors Form */}
        <form
          onSubmit={handleAddProject}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              1. Add New Project &amp; Open Floors / Units
            </h2>
            <span className="text-xs text-slate-300 font-semibold">
              Preview: {previewStructure.units.length} Units Open (Builder:{' '}
              {Array.from(previewStructure.builderSet).join(',') || '-'} | Landowner:{' '}
              {Array.from(previewStructure.landownerSet).join(',') || 'None'})
            </span>
          </div>

          {statusMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/70 border border-emerald-700 text-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-950/60 border border-amber-700 text-amber-200 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Project / Building Name *
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Sahar Tower / Godrej Zen"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Location / Site
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Patna / Kolkata / Lucknow"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Ownership Type
              </label>
              <select
                value={ownershipMode}
                onChange={(e) => handleOwnershipChange(e.target.value as OwnershipMode)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="JDA_SHARE">JDA (Builder + Landowner Floors)</option>
                <option value="SELF_PURCHASE">Self Purchase (100% Builder)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Project Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PLANNING">PLANNING</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Total Floors (5 / 10 / 15+)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={totalFloors}
                onChange={(e) => setTotalFloors(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Units Per Floor
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={unitsPerFloor}
                onChange={(e) => setUnitsPerFloor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Builder Share Floors
              </label>
              <input
                type="text"
                disabled={ownershipMode === 'SELF_PURCHASE'}
                value={builderFloorsText}
                onChange={(e) => setBuilderFloorsText(e.target.value)}
                placeholder="e.g. 1, 3, 5, 7, 9"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white disabled:opacity-60 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Landowner Share Floors
              </label>
              <input
                type="text"
                disabled={ownershipMode === 'SELF_PURCHASE'}
                value={landownerFloorsText}
                onChange={(e) => setLandownerFloorsText(e.target.value)}
                placeholder="e.g. 2, 4, 6, 8, 10"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white disabled:opacity-60 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Default Unit Category
              </label>
              <select
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value as UnitCategory)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="RESIDENTIAL">RESIDENTIAL (Flat/Apartment)</option>
                <option value="COMMERCIAL">COMMERCIAL (Shop/Office)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Default Area (Sq.Ft)
              </label>
              <input
                type="number"
                min="0"
                value={defaultArea}
                onChange={(e) => setDefaultArea(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Default Rate / Sq.Ft (₹)
              </label>
              <input
                type="number"
                min="0"
                value={defaultRate}
                onChange={(e) => setDefaultRate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Landowner / Partner Note
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Optional landowner or developer note"
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
            {submitting
              ? 'Opening Floors & Saving Project...'
              : 'Save Project & Open Floors/Units'}
          </button>
        </form>

        {/* Active Project Selector & Opened Units Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                2. Opened Floors &amp; Units Data Feed
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeProject
                  ? `Project: ${
                      activeProject.project_name || activeProject.name || `#${activeProject.id}`
                    } • Builder Units: ${summaryCounts.builderCount} • Landowner Units: ${
                      summaryCounts.landownerCount
                    } • Residential: ${summaryCounts.residentialCount} • Commercial: ${
                      summaryCounts.commercialCount
                    }`
                  : 'Add a project above to open floors and units.'}
              </p>
            </div>

            {projects.length > 0 && (
              <select
                value={activeProject ? String(activeProject.id) : ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-amber-300"
              >
                {projects.map((p) => (
                  <option key={String(p.id)} value={String(p.id)}>
                    {p.project_name || p.name || p.site_name || `Project #${p.id}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {activeUnits.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No units opened yet. Submit a project above with floor count and units per floor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                    <th className="py-2.5 px-3">Floor</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Share</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Area (Sq.Ft)</th>
                    <th className="py-2.5 px-3 text-right">Total Price (₹)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {activeUnits.map((u) => {
                    const isEditing = editingUnitCode === u.unitCode;
                    return (
                      <tr key={u.unitCode} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-slate-300">{u.floorLabel}</td>
                        <td className="py-2.5 px-3 font-bold text-white">{u.unitCode}</td>
                        <td className="py-2.5 px-3">
                          {isEditing ? (
                            <select
                              value={editOwnerShare}
                              onChange={(e) => setEditOwnerShare(e.target.value as ShareOwner)}
                              className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs"
                            >
                              <option value="BUILDER">BUILDER</option>
                              <option value="LANDOWNER">LANDOWNER</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                u.ownerShare === 'BUILDER'
                                  ? 'bg-amber-500/15 text-amber-300'
                                  : 'bg-sky-500/15 text-sky-300'
                              }`}
                            >
                              {u.ownerShare}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isEditing ? (
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value as UnitCategory)}
                              className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs"
                            >
                              <option value="RESIDENTIAL">RESIDENTIAL</option>
                              <option value="COMMERCIAL">COMMERCIAL</option>
                            </select>
                          ) : (
                            <span className="text-slate-200 font-semibold">{u.category}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editArea}
                              onChange={(e) => setEditArea(e.target.value)}
                              className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-right text-xs"
                            />
                          ) : (
                            <span className="text-slate-300">{u.areaSqft}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-300">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editRate}
                              onChange={(e) => setEditRate(e.target.value)}
                              className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-right text-xs"
                            />
                          ) : (
                            `₹${Number(u.totalPrice || 0).toLocaleString('en-IN')}`
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isEditing ? (
                            <select
                              value={editStatus}
                              onChange={(e) =>
                                setEditStatus(e.target.value as 'AVAILABLE' | 'BOOKED')
                              }
                              className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs"
                            >
                              <option value="AVAILABLE">AVAILABLE</option>
                              <option value="BOOKED">BOOKED</option>
                            </select>
                          ) : (
                            <span className="text-slate-300">{u.status}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isEditing ? (
                            <button
                              type="button"
                              onClick={() => handleSaveUnitData(u.unitCode)}
                              className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-xs"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openUnitEditor(u)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-bold text-xs transition"
                            >
                              Edit Data
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}