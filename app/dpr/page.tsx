'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ClipboardList, ArrowLeft, FlaskConical, HardHat, CheckCircle2, 
  AlertTriangle, Building, Sparkles, Plus 
} from 'lucide-react';

interface Project {
  id: number;
  name: string;
}

interface BOQItem {
  id: number;
  wbs_code: string;
  item_name: string;
  unit: string;
  quantity: number;
  executed_qty: number;
}

interface DPRRecord {
  id: number;
  dpr_number: string;
  report_date: string;
  wbs_zone: string;
  activity_description: string;
  executed_qty: number;
  unit: string;
  skilled_masons: number;
  unskilled_helpers: number;
  machinery_deployed: string;
  weather_status: string;
  clp_milestone_tag: string;
}

interface CubeRecord {
  id: number;
  sample_code: string;
  casting_date: string;
  structural_member: string;
  concrete_grade: string;
  target_strength_mpa: number;
  day7_strength_mpa: number;
  day28_strength_mpa: number;
  qc_verdict: string;
}

export default function EnterpriseSiteDPR() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'DPR' | 'QAQC'>('DPR');

  const [boqItems, setBoqItems] = useState<BOQItem[]>([]);
  const [dprList, setDprList] = useState<DPRRecord[]>([]);
  const [cubeList, setCubeList] = useState<CubeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // DPR Form States
  const [selectedBoqId, setSelectedBoqId] = useState<number | null>(null);
  const [wbsZone, setWbsZone] = useState('Tower A - 5th Floor Slab');
  const [activityDesc, setActivityDesc] = useState('');
  const [execQty, setExecQty] = useState('');
  const [masons, setMasons] = useState('12');
  const [helpers, setHelpers] = useState('28');
  const [machinery, setMachinery] = useState('1 Boom Placer, 2 Transit Mixers');
  const [weather, setWeather] = useState('CLEAR');
  const [clpMilestone, setClpMilestone] = useState('NONE');
  const [submittingDpr, setSubmittingDpr] = useState(false);

  // QA/QC Cube Form States
  const [memberLocation, setMemberLocation] = useState('Tower A - 5th Floor Slab');
  const [grade, setGrade] = useState('M25');
  const [day7Mpa, setDay7Mpa] = useState('');
  const [day28Mpa, setDay28Mpa] = useState('');
  const [submittingCube, setSubmittingCube] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadSiteData(selectedProjectId);
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

  async function loadSiteData(projectId: number) {
    setLoading(true);
    const [boqRes, dprRes, cubeRes] = await Promise.all([
      supabase.from('boq').select('id, wbs_code, item_name, unit, quantity, executed_qty').eq('project_id', projectId).order('wbs_code'),
      supabase.from('enterprise_dpr').select('*').eq('project_id', projectId).order('id', { ascending: false }),
      supabase.from('enterprise_qa_cubes').select('*').eq('project_id', projectId).order('id', { ascending: false })
    ]);

    if (boqRes.data) {
      setBoqItems(boqRes.data);
      setSelectedBoqId(boqRes.data.length > 0 ? boqRes.data[0].id : null);
    }
    if (dprRes.data) setDprList(dprRes.data);
    if (cubeRes.data) setCubeList(cubeRes.data);
    setLoading(false);
  }

  const activeBOQ = boqItems.find((b) => b.id === selectedBoqId);

  async function handleLogDPR(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !activeBOQ || !execQty) return;

    setSubmittingDpr(true);
    const { data: { user } } = await supabase.auth.getUser();
    const dprNumber = `UEPL/DPR/26-27/${String(dprList.length + 1001).padStart(4, '0')}`;
    const numExec = Number(execQty);

    // 1. Insert DPR Entry
    const { error } = await supabase.from('enterprise_dpr').insert({
      dpr_number: dprNumber,
      project_id: selectedProjectId,
      boq_id: activeBOQ.id,
      wbs_zone: wbsZone,
      activity_description: activityDesc || activeBOQ.item_name,
      executed_qty: numExec,
      unit: activeBOQ.unit,
      skilled_masons: Number(masons) || 0,
      unskilled_helpers: Number(helpers) || 0,
      machinery_deployed: machinery,
      weather_status: weather,
      clp_milestone_tag: clpMilestone,
      engineer_name: user?.email || 'site.engineer@universalengicon.com'
    });

    if (!error) {
      // 2. Update BOQ Physical Executed Quantity
      await supabase
        .from('boq')
        .update({ executed_qty: Number(activeBOQ.executed_qty || 0) + numExec })
        .eq('id', activeBOQ.id);

      // 3. If Real Estate CLP Milestone Achieved -> Trigger Customer Demand Queue!
      if (clpMilestone !== 'NONE') {
        await supabase.from('enterprise_clp_triggers').insert({
          project_id: selectedProjectId,
          milestone_name: clpMilestone,
          wbs_zone: wbsZone,
          dpr_reference: dprNumber
        });

        await supabase.from('enterprise_audit_logs').insert({
          user_id: user?.id,
          user_email: user?.email || 'site.engineer@universalengicon.com',
          module_name: 'SITE_DPR_CLP_TRIGGER',
          action_type: 'MILESTONE_ACHIEVED',
          document_number: dprNumber,
          new_values: { milestone: clpMilestone, zone: wbsZone }
        });
      }

      setActivityDesc('');
      setExecQty('');
      setClpMilestone('NONE');
      await loadSiteData(selectedProjectId);
    } else {
      alert('DPR Error: ' + error.message);
    }
    setSubmittingDpr(false);
  }

  async function handleLogCubeTest(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !memberLocation) return;

    setSubmittingCube(true);
    const sampleCode = `UEPL/QC/${grade}/${String(cubeList.length + 401).padStart(3, '0')}`;
    const targetMpa = Number(grade.replace('M', '')) || 25;
    const d7 = Number(day7Mpa) || 0;
    const d28 = Number(day28Mpa) || 0;

    let verdict = 'PENDING_28_DAY';
    if (d28 > 0) {
      verdict = d28 >= targetMpa ? 'PASSED' : 'FAILED_NCR';
    } else if (d7 > 0 && d7 < targetMpa * 0.65) {
      verdict = 'WARNING_LOW_7DAY';
    }

    const { error } = await supabase.from('enterprise_qa_cubes').insert({
      sample_code: sampleCode,
      project_id: selectedProjectId,
      structural_member: memberLocation,
      concrete_grade: grade,
      target_strength_mpa: targetMpa,
      day7_strength_mpa: d7,
      day28_strength_mpa: d28,
      qc_verdict: verdict
    });

    if (!error) {
      setDay7Mpa('');
      setDay28Mpa('');
      await loadSiteData(selectedProjectId);
    } else {
      alert('Cube Test Error: ' + error.message);
    }
    setSubmittingCube(false);
  }

  const totalManpowerToday = dprList.slice(0, 5).reduce((s, d) => s + d.skilled_masons + d.unskilled_helpers, 0);
  const milestoneTriggersCount = dprList.filter((d) => d.clp_milestone_tag !== 'NONE').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to MD Command Center
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-600" /> Site Execution DPR, QA/QC Lab & CLP Trigger
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Active Site:</label>
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

      {/* Site Execution Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Recent Site Manpower Deployment</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalManpowerToday} Workers</div>
          <span className="text-xs text-slate-500">Skilled Masons + Helpers across active zones</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">QA/QC Concrete Cube Samples</span>
          <div className="mt-2 text-2xl font-bold text-indigo-700">{cubeList.length} Batches Tested</div>
          <span className="text-xs text-emerald-600 font-medium">IS 456 Compressive Strength Monitored</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-rose-200 bg-rose-50/30 shadow-sm">
          <span className="text-xs font-semibold text-rose-800 uppercase">Real Estate CLP Milestones Achieved</span>
          <div className="mt-2 text-2xl font-bold text-rose-900">{milestoneTriggersCount} Stages Unlocked</div>
          <span className="text-xs text-rose-700 font-medium">Auto-Linked to Customer Demand Letters</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('DPR')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
            activeTab === 'DPR' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <HardHat className="w-4 h-4 text-indigo-400" /> 1. Smart Daily Progress Report (DPR)
        </button>
        <button
          onClick={() => setActiveTab('QAQC')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
            activeTab === 'QAQC' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <FlaskConical className="w-4 h-4 text-emerald-400" /> 2. QA/QC Concrete Cube Strength Lab
        </button>
      </div>

      {/* TAB 1: SMART SITE DPR */}
      {activeTab === 'DPR' && (
        <div className="space-y-6">
          <form onSubmit={handleLogDPR} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-sm text-slate-800">Log Daily Site Execution (Updates Master BOQ Progress)</span>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded">
                BOQ & CLP Synced
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Link to BOQ Activity*</label>
                <select
                  value={selectedBoqId || ''}
                  onChange={(e) => setSelectedBoqId(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
                >
                  {boqItems.length === 0 && <option value="">No BOQ items found in this project</option>}
                  {boqItems.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.wbs_code}] {b.item_name} (Done: {b.executed_qty || 0}/{b.quantity} {b.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tower / Floor / Chainage Zone*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Tower A - 5th Floor Slab"
                  value={wbsZone}
                  onChange={(e) => setWbsZone(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Today's Achieved Qty ({activeBOQ?.unit || 'Unit'})*
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Enter Executed Qty"
                  value={execQty}
                  onChange={(e) => setExecQty(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-indigo-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Skilled Masons</label>
                <input
                  type="number"
                  value={masons}
                  onChange={(e) => setMasons(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Unskilled Helpers</label>
                <input
                  type="number"
                  value={helpers}
                  onChange={(e) => setHelpers(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Plant & Machinery Deployed</label>
                <input
                  type="text"
                  value={machinery}
                  onChange={(e) => setMachinery(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Site Weather</label>
                <select
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="CLEAR">Clear / Normal</option>
                  <option value="RAIN_DELAY">Rain Delay (EOT Log)</option>
                  <option value="HEAT_WAVE">Extreme Heat</option>
                </select>
              </div>
            </div>

            {/* Real Estate CLP Milestone Trigger Selector */}
            <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-rose-600" /> Real Estate CLP Billing Milestone Trigger (Optional)
                </span>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Agar aaj koi slab ya structural stage complete hua hai, toh select karein—Customer Demand Letters automatically unlock ho jayenge.
                </p>
              </div>
              <div>
                <select
                  value={clpMilestone}
                  onChange={(e) => setClpMilestone(e.target.value)}
                  className="w-full border border-rose-300 bg-white rounded-lg px-3 py-2 text-sm font-bold text-rose-900"
                >
                  <option value="NONE">-- No Milestone Completed Today --</option>
                  <option value="EXCAVATION_PLINTH">Milestone: Excavation & Plinth Complete (15% Demand)</option>
                  <option value="GROUND_FLOOR_SLAB">Milestone: Ground / Podium Slab Cast (10% Demand)</option>
                  <option value="THIRD_FLOOR_SLAB">Milestone: 3rd Floor Roof Slab Cast (10% Demand)</option>
                  <option value="FIFTH_FLOOR_SLAB">Milestone: 5th Floor Roof Slab Cast (10% Demand)</option>
                  <option value="BRICKWORK_PLASTER">Milestone: Internal Brickwork & Plaster (10% Demand)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingDpr || !activeBOQ}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> {submittingDpr ? 'Saving DPR...' : 'Submit Site DPR & Sync Progress'}
              </button>
            </div>
          </form>

          {/* DPR History Register */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-3 bg-slate-900 text-white text-sm font-semibold">Daily Progress Report (DPR) Logbook</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                    <th className="py-3 px-4">DPR No. & Date</th>
                    <th className="py-3 px-4">Location / Zone</th>
                    <th className="py-3 px-4">Executed Work</th>
                    <th className="py-3 px-4">Manpower & Plant</th>
                    <th className="py-3 px-4">CLP Milestone Trigger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dprList.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{d.dpr_number}</div>
                        <div className="text-xs text-slate-500">{d.report_date}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{d.wbs_zone}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{d.activity_description}</div>
                        <div className="text-xs font-bold text-indigo-700">+{d.executed_qty} {d.unit}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        <div>{d.skilled_masons} Masons, {d.unskilled_helpers} Helpers</div>
                        <div className="text-slate-500">{d.machinery_deployed}</div>
                      </td>
                      <td className="py-3 px-4">
                        {d.clp_milestone_tag !== 'NONE' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                            <Building className="w-3.5 h-3.5" /> {d.clp_milestone_tag}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Routine Execution</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QA/QC CONCRETE CUBE TESTING */}
      {activeTab === 'QAQC' && (
        <div className="space-y-6">
          <form onSubmit={handleLogCubeTest} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
              Concrete Cube Compressive Strength Register (IS 456:2000 Lab Log)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Structural Member / Pour Location*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Tower A - 5th Floor Slab & Beams"
                  value={memberLocation}
                  onChange={(e) => setMemberLocation(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Design Concrete Grade</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold"
                >
                  <option value="M20">M20 (Target: 20 N/mm²)</option>
                  <option value="M25">M25 (Target: 25 N/mm²)</option>
                  <option value="M30">M30 (Target: 30 N/mm²)</option>
                  <option value="M35">M35 (Target: 35 N/mm²)</option>
                  <option value="M40">M40 (Target: 40 N/mm²)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">7-Day Strength (N/mm²)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 18.5"
                  value={day7Mpa}
                  onChange={(e) => setDay7Mpa(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">28-Day Final Strength (N/mm²)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Leave 0 if pending"
                  value={day28Mpa}
                  onChange={(e) => setDay28Mpa(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold"
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingCube}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg"
                >
                  {submittingCube ? 'Recording Test...' : 'Save QA/QC Cube Result'}
                </button>
              </div>
            </div>
          </form>

          {/* Cube Test Register */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-3 bg-slate-900 text-white text-sm font-semibold">Laboratory Cube Test Register</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                    <th className="py-3 px-4">Sample ID</th>
                    <th className="py-3 px-4">Structural Member</th>
                    <th className="py-3 px-4">Grade & Target</th>
                    <th className="py-3 px-4">7-Day Result</th>
                    <th className="py-3 px-4">28-Day Result</th>
                    <th className="py-3 px-4">QA/QC Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cubeList.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.sample_code}</td>
                      <td className="py-3 px-4 font-medium">{c.structural_member}</td>
                      <td className="py-3 px-4 font-bold text-blue-700">{c.concrete_grade} (≥ {c.target_strength_mpa} MPa)</td>
                      <td className="py-3 px-4">{c.day7_strength_mpa > 0 ? `${c.day7_strength_mpa} MPa` : '—'}</td>
                      <td className="py-3 px-4 font-bold">{c.day28_strength_mpa > 0 ? `${c.day28_strength_mpa} MPa` : 'Pending'}</td>
                      <td className="py-3 px-4">
                        {c.qc_verdict === 'PASSED' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                          </span>
                        ) : c.qc_verdict.includes('FAILED') || c.qc_verdict.includes('WARNING') ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200">
                            <AlertTriangle className="w-3.5 h-3.5" /> {c.qc_verdict}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded">
                            28-Day Curing Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}