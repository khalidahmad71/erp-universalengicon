'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Truck,
  Fuel,
  Wrench,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Gauge,
} from 'lucide-react';

interface MachineAsset {
  id: string;
  asset_code: string;
  machine_name: string;
  category: string;
  ownership_type: 'OWNED' | 'HIRED_RENTAL';
  project_id: number;
  hourly_hire_rate: number;
  current_hmr: number;
  operational_status: 'OPERATIONAL' | 'BREAKDOWN' | 'MAINTENANCE' | 'IDLE';
  projects?: { name: string };
}

interface DieselLog {
  id: string;
  log_date: string;
  machine_id: string;
  project_id: number;
  operator_name: string;
  opening_hmr: number;
  closing_hmr: number;
  hours_worked: number;
  diesel_issued_litres: number;
  diesel_rate_per_litre: number;
  total_diesel_cost: number;
  avg_litres_per_hour: number;
  work_remarks: string;
  plant_machinery?: { asset_code: string; machine_name: string };
  projects?: { name: string };
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';
  return createClient(url, key);
}

export default function PlantMachineryPage() {
  const [activeTab, setActiveTab] = useState<'logs' | 'fleet'>('logs');
  const [machines, setMachines] = useState<MachineAsset[]>([]);
  const [logs, setLogs] = useState<DieselLog[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [showMachineModal, setShowMachineModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  const [machineForm, setMachineForm] = useState({
    asset_code: '',
    machine_name: '',
    category: 'EARTHMOVING',
    ownership_type: 'OWNED' as 'OWNED' | 'HIRED_RENTAL',
    project_id: '',
    hourly_hire_rate: 0,
    current_hmr: 0,
  });

  const [logForm, setLogForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    machine_id: '',
    project_id: '',
    operator_name: '',
    opening_hmr: 0,
    closing_hmr: 0,
    diesel_issued_litres: 0,
    diesel_rate_per_litre: 92,
    work_remarks: '',
  });

  const fetchAllData = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const [machRes, logRes, projRes] = await Promise.all([
      supabase.from('plant_machinery').select('*, projects(name)').order('asset_code', { ascending: true }),
      supabase
        .from('machinery_diesel_logs')
        .select('*, plant_machinery(asset_code, machine_name), projects(name)')
        .order('log_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name'),
    ]);

    if (machRes.data) setMachines(machRes.data as MachineAsset[]);
    if (logRes.data) setLogs(logRes.data as DieselLog[]);
    if (projRes.data) setProjects(projRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleMachineSelectForLog = (machineId: string) => {
    const selected = machines.find((m) => m.id === machineId);
    if (selected) {
      setLogForm({
        ...logForm,
        machine_id: selected.id,
        project_id: selected.project_id ? String(selected.project_id) : logForm.project_id,
        opening_hmr: Number(selected.current_hmr) || 0,
        closing_hmr: Number(selected.current_hmr) || 0,
      });
    }
  };

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('plant_machinery').insert([
      {
        asset_code: machineForm.asset_code.toUpperCase(),
        machine_name: machineForm.machine_name,
        category: machineForm.category,
        ownership_type: machineForm.ownership_type,
        project_id: machineForm.project_id ? Number(machineForm.project_id) : null,
        hourly_hire_rate: Number(machineForm.hourly_hire_rate),
        current_hmr: Number(machineForm.current_hmr),
      },
    ]);

    if (!error) {
      setShowMachineModal(false);
      setMachineForm({
        asset_code: '',
        machine_name: '',
        category: 'EARTHMOVING',
        ownership_type: 'OWNED',
        project_id: '',
        hourly_hire_rate: 0,
        current_hmr: 0,
      });
      fetchAllData();
    } else {
      alert('Error adding machine: ' + error.message);
    }
  };

  const handleCreateDieselLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(logForm.closing_hmr) < Number(logForm.opening_hmr)) {
      alert('Closing HMR cannot be less than Opening HMR.');
      return;
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.from('machinery_diesel_logs').insert([
      {
        log_date: logForm.log_date,
        machine_id: logForm.machine_id,
        project_id: logForm.project_id ? Number(logForm.project_id) : null,
        operator_name: logForm.operator_name,
        opening_hmr: Number(logForm.opening_hmr),
        closing_hmr: Number(logForm.closing_hmr),
        diesel_issued_litres: Number(logForm.diesel_issued_litres),
        diesel_rate_per_litre: Number(logForm.diesel_rate_per_litre),
        work_remarks: logForm.work_remarks,
      },
    ]);

    if (!error) {
      await supabase
        .from('plant_machinery')
        .update({ current_hmr: Number(logForm.closing_hmr) })
        .eq('id', logForm.machine_id);

      setShowLogModal(false);
      fetchAllData();
    } else {
      alert('Error saving log: ' + error.message);
    }
  };

  const updateMachineStatus = async (id: string, status: MachineAsset['operational_status']) => {
    const supabase = getSupabaseClient();
    await supabase.from('plant_machinery').update({ operational_status: status }).eq('id', id);
    fetchAllData();
  };

  const totalDieselLitres = logs.reduce((s, l) => s + Number(l.diesel_issued_litres || 0), 0);
  const totalDieselCost = logs.reduce((s, l) => s + Number(l.total_diesel_cost || 0), 0);
  const totalHoursWorked = logs.reduce((s, l) => s + Number(l.hours_worked || 0), 0);
  const breakdownCount = machines.filter((m) => m.operational_status === 'BREAKDOWN').length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center">
        <div>
          <span className="text-xs font-bold tracking-wider text-blue-700 uppercase">
            Universal Engicon Pvt. Ltd. • Plant &amp; Equipment Control
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Plant, Machinery &amp; Diesel Logbook
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowMachineModal(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
          >
            <Truck className="h-4 w-4 text-blue-700" /> + Register Machine
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" /> Log Daily HMR &amp; Diesel
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Active Fleet Count</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {machines.filter((m) => m.operational_status === 'OPERATIONAL').length} / {machines.length}
          </p>
          <span className="text-xs text-slate-400">Operational Equipment</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Running Hours (HMR)</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">
            {totalHoursWorked.toLocaleString('en-IN', { maximumFractionDigits: 1 })} Hrs
          </p>
          <span className="text-xs text-slate-400">Logged productive machine hours</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Diesel Consumed</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {totalDieselLitres.toLocaleString('en-IN', { maximumFractionDigits: 1 })} Ltrs
          </p>
          <span className="text-xs text-slate-400">
            Cost: ₹ {totalDieselCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Breakdown / Maintenance</p>
          <p className={`mt-1 text-2xl font-bold ${breakdownCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            {breakdownCount}
          </p>
          <span className="text-xs text-slate-400">Machines requiring repair</span>
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'logs'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Fuel className="h-4 w-4" /> Daily Diesel &amp; HMR Logbook
        </button>
        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'fleet'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="h-4 w-4" /> Plant &amp; Machinery Fleet ({machines.length})
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading plant &amp; diesel logs...
        </div>
      ) : (
        <>
          {activeTab === 'logs' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="px-4 py-3">Date &amp; Machine</th>
                    <th className="px-4 py-3">Site &amp; Operator</th>
                    <th className="px-4 py-3 text-right">HMR (Open &rarr; Close)</th>
                    <th className="px-4 py-3 text-right">Net Hours</th>
                    <th className="px-4 py-3 text-right">Diesel Issued</th>
                    <th className="px-4 py-3 text-right">Avg (Ltr/Hr)</th>
                    <th className="px-4 py-3 text-right">Fuel Cost (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No diesel or HMR entries logged yet. Click &quot;Log Daily HMR &amp; Diesel&quot; to begin.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">
                            {log.plant_machinery?.asset_code} — {log.plant_machinery?.machine_name}
                          </div>
                          <div className="text-xs text-slate-500">{log.log_date}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-700">{log.projects?.name || 'General'}</div>
                          <div className="text-xs text-slate-500">Op: {log.operator_name}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {Number(log.opening_hmr)} &rarr; <strong>{Number(log.closing_hmr)}</strong>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-blue-700">
                          {Number(log.hours_worked).toFixed(1)} Hrs
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold">
                          {Number(log.diesel_issued_litres).toFixed(1)} L
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-bold ${
                              Number(log.avg_litres_per_hour) > 12
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {Number(log.avg_litres_per_hour).toFixed(2)} L/hr
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          ₹ {Number(log.total_diesel_cost).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'fleet' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="px-4 py-3">Asset Code &amp; Name</th>
                    <th className="px-4 py-3">Category &amp; Ownership</th>
                    <th className="px-4 py-3">Deployed Site</th>
                    <th className="px-4 py-3 text-right">Current HMR</th>
                    <th className="px-4 py-3 text-right">Hourly Rate (₹)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Quick Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {machines.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No machines registered yet. Click &quot;+ Register Machine&quot; first.
                      </td>
                    </tr>
                  ) : (
                    machines.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{m.asset_code}</div>
                          <div className="text-xs text-slate-600">{m.machine_name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-semibold">{m.category}</div>
                          <div className="text-[11px] text-slate-500">{m.ownership_type}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{m.projects?.name || 'Central Yard'}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          {Number(m.current_hmr).toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          ₹ {Number(m.hourly_hire_rate).toLocaleString('en-IN')}/hr
                        </td>
                        <td className="px-4 py-3">
                          {m.operational_status === 'OPERATIONAL' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" /> OPERATIONAL
                            </span>
                          )}
                          {m.operational_status === 'BREAKDOWN' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                              <AlertTriangle className="h-3.5 w-3.5" /> BREAKDOWN
                            </span>
                          )}
                          {(m.operational_status === 'IDLE' || m.operational_status === 'MAINTENANCE') && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                              <Clock className="h-3.5 w-3.5" /> {m.operational_status}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <select
                            className="rounded border bg-white px-2 py-1 text-xs font-semibold"
                            value={m.operational_status}
                            onChange={(e) =>
                              updateMachineStatus(m.id, e.target.value as MachineAsset['operational_status'])
                            }
                          >
                            <option value="OPERATIONAL">Operational</option>
                            <option value="BREAKDOWN">Breakdown</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="IDLE">Idle</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showMachineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreateMachine} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Truck className="h-5 w-5 text-blue-700" /> Register Plant &amp; Machinery Asset
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="mb-1 block font-semibold">Asset Code *</label>
                <input
                  required
                  className="w-full rounded border p-2 uppercase"
                  placeholder="UE-JCB-01"
                  value={machineForm.asset_code}
                  onChange={(e) => setMachineForm({ ...machineForm, asset_code: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Machine Name / Model *</label>
                <input
                  required
                  className="w-full rounded border p-2"
                  placeholder="JCB 3DX Backhoe Loader"
                  value={machineForm.machine_name}
                  onChange={(e) => setMachineForm({ ...machineForm, machine_name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Category</label>
                <select
                  className="w-full rounded border p-2"
                  value={machineForm.category}
                  onChange={(e) => setMachineForm({ ...machineForm, category: e.target.value })}
                >
                  <option value="EARTHMOVING">Earthmoving (JCB / Excavator)</option>
                  <option value="CONCRETING">Concreting (Transit Mixer / Pump)</option>
                  <option value="LIFTING">Lifting (Tower Crane / Hoist)</option>
                  <option value="POWER_DG">Power Backup (DG Set)</option>
                  <option value="COMPACTION">Compaction (Roller / Vibrator)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold">Ownership</label>
                <select
                  className="w-full rounded border p-2"
                  value={machineForm.ownership_type}
                  onChange={(e) =>
                    setMachineForm({
                      ...machineForm,
                      ownership_type: e.target.value as 'OWNED' | 'HIRED_RENTAL',
                    })
                  }
                >
                  <option value="OWNED">Company Owned</option>
                  <option value="HIRED_RENTAL">Hired / Rental</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold">Deployed Site</label>
                <select
                  className="w-full rounded border p-2"
                  value={machineForm.project_id}
                  onChange={(e) => setMachineForm({ ...machineForm, project_id: e.target.value })}
                >
                  <option value="">-- Central Yard --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold">Hourly Rate / Internal Charge (₹)</label>
                <input
                  type="number"
                  className="w-full rounded border p-2 font-mono"
                  value={machineForm.hourly_hire_rate}
                  onChange={(e) => setMachineForm({ ...machineForm, hourly_hire_rate: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block font-semibold">Initial Hour Meter Reading (HMR)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full rounded border p-2 font-mono"
                  value={machineForm.current_hmr}
                  onChange={(e) => setMachineForm({ ...machineForm, current_hmr: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMachineModal(false)}
                className="rounded border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
                Save Machine
              </button>
            </div>
          </form>
        </div>
      )}

      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreateDieselLog} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Gauge className="h-5 w-5 text-blue-700" /> Daily HMR &amp; Diesel Issue Entry
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <label className="mb-1 block font-semibold">Select Machine *</label>
                <select
                  required
                  className="w-full rounded border p-2 font-semibold"
                  value={logForm.machine_id}
                  onChange={(e) => handleMachineSelectForLog(e.target.value)}
                >
                  <option value="">-- Choose Equipment --</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.asset_code} — {m.machine_name} (HMR: {m.current_hmr})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold">Log Date *</label>
                <input
                  type="date"
                  required
                  className="w-full rounded border p-2"
                  value={logForm.log_date}
                  onChange={(e) => setLogForm({ ...logForm, log_date: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Site / Project *</label>
                <select
                  required
                  className="w-full rounded border p-2"
                  value={logForm.project_id}
                  onChange={(e) => setLogForm({ ...logForm, project_id: e.target.value })}
                >
                  <option value="">-- Select Site --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold">Operator Name *</label>
                <input
                  required
                  className="w-full rounded border p-2"
                  placeholder="Driver / Operator Name"
                  value={logForm.operator_name}
                  onChange={(e) => setLogForm({ ...logForm, operator_name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Opening HMR</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  className="w-full rounded border bg-slate-50 p-2 font-mono"
                  value={logForm.opening_hmr}
                  onChange={(e) => setLogForm({ ...logForm, opening_hmr: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-blue-800">Closing HMR *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  className="w-full rounded border-2 border-blue-600 p-2 font-mono font-bold"
                  value={logForm.closing_hmr}
                  onChange={(e) => setLogForm({ ...logForm, closing_hmr: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-amber-800">Diesel Issued (Litres) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  className="w-full rounded border p-2 font-mono font-bold"
                  value={logForm.diesel_issued_litres}
                  onChange={(e) => setLogForm({ ...logForm, diesel_issued_litres: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Diesel Rate (₹/Ltr)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full rounded border p-2 font-mono"
                  value={logForm.diesel_rate_per_litre}
                  onChange={(e) => setLogForm({ ...logForm, diesel_rate_per_litre: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block font-semibold">Work Activity / Remarks</label>
                <input
                  className="w-full rounded border p-2"
                  placeholder="e.g. Foundation excavation Block-A"
                  value={logForm.work_remarks}
                  onChange={(e) => setLogForm({ ...logForm, work_remarks: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="rounded border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
                Save Log &amp; Update HMR
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
