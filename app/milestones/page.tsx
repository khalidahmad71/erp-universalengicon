'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
let supabase: any = null;
try { if (supabaseUrl && supabaseKey) { supabase = createClient(supabaseUrl, supabaseKey); } } catch (e) {}

const initialMilestones = [
  { id: 1, milestone_name: 'Site Excavation & Earthwork (Tower A & B)', target_completion_date: '2026-06-30', completion_percentage: 100, milestone_status: 'Completed', responsible_engineer: 'Er. Rakesh Ranjan' },
  { id: 2, milestone_name: 'Raft Foundation & PCC Casting', target_completion_date: '2026-08-15', completion_percentage: 100, milestone_status: 'Completed', responsible_engineer: 'Er. Rakesh Ranjan' },
  { id: 3, milestone_name: 'Superstructure Columns & Slabs up to 4th Floor', target_completion_date: '2026-12-31', completion_percentage: 75, milestone_status: 'In Progress', responsible_engineer: 'Er. Rakesh Ranjan' },
  { id: 4, milestone_name: 'Brick Masonry & Internal Partition Walls', target_completion_date: '2027-04-30', completion_percentage: 20, milestone_status: 'In Progress', responsible_engineer: 'Er. Amit Kumar' }
];

export default function MilestonesModule() {
  const [milestones, setMilestones] = useState(initialMilestones);
  const [msName, setMsName] = useState('Electrical Conduit & Plumbing Rough-in');
  const [targetDate, setTargetDate] = useState('2027-07-31');
  const [pct, setPct] = useState<number>(0);
  const [status, setStatus] = useState('Not Started');
  const [engineer, setEngineer] = useState('Er. Amit Kumar');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const newEntry = {
      id: milestones.length + 1,
      milestone_name: msName,
      target_completion_date: targetDate,
      completion_percentage: pct,
      milestone_status: status,
      responsible_engineer: engineer
    };

    try {
      if (supabase) {
        await supabase.from('project_milestones').insert([newEntry]);
      }
      setMilestones([...milestones, newEntry]);
      setSuccessMsg('Project milestone added successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 pb-20">
      
      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center bg-slate-900 text-white px-6 py-4 rounded-xl shadow-md">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">Universal Engicon ERP</span>
          <h2 className="text-xl font-bold">Project Milestones & Timeline Tracking</h2>
        </div>
        <Link href="/" className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold py-2 px-4 rounded border border-slate-700 transition">
          ← Dashboard
        </Link>
      </div>

      {successMsg && (
        <div className="max-w-6xl mx-auto mb-6 bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl font-bold text-center">
          ✓ {successMsg}
        </div>
      )}

      {/* Form & Table Container */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Milestone Form */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 h-fit">
          <h3 className="text-lg font-black text-slate-900 mb-4 pb-2 border-b">Add New Project Milestone</h3>
          <form onSubmit={handleAddMilestone} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Milestone Name / Scope</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={msName} onChange={(e) => setMsName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Target Completion Date</label>
              <input type="date" className="w-full p-3 border rounded-lg font-bold text-xs" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Progress (%)</label>
                <input type="number" min="0" max="100" className="w-full p-3 border rounded-lg font-bold text-blue-900" value={pct} onChange={(e) => setPct(Number(e.target.value))} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Status</label>
                <select className="w-full p-3 border rounded-lg font-bold text-xs bg-white" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Responsible Engineer</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={engineer} onChange={(e) => setEngineer(e.target.value)} required />
            </div>
            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow transition uppercase tracking-wider text-sm">
              {isSaving ? 'Saving...' : '+ Add Project Milestone'}
            </button>
          </form>
        </div>

        {/* Master Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 font-bold text-sm uppercase tracking-wider">
            Godrej Zen Estate Phase-2 — Master Project Timeline & Milestones
          </div>
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-100 text-slate-700 border-b">
              <tr>
                <th className="py-3 px-4">Milestone Scope & In-Charge</th>
                <th className="py-3 px-4 text-center">Target Date</th>
                <th className="py-3 px-4 text-center">Progress</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => (
                <tr key={m.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{m.milestone_name}</span>
                    <span className="text-[11px] text-slate-500 font-medium">Engineer: {m.responsible_engineer}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs font-semibold text-slate-700">{m.target_completion_date}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full" style={{ width: `${m.completion_percentage}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{m.completion_percentage}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${m.completion_percentage === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                      {m.milestone_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}