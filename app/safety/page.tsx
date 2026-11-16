'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
let supabase: any = null;
try { if (supabaseUrl && supabaseKey) { supabase = createClient(supabaseUrl, supabaseKey); } } catch (e) {}

const initialSafetyLogs = [
  { id: 1, incident_type: 'Toolbox Talk Conducted', severity_level: 'Low', description: 'Morning safety briefing on mandatory use of harnesses during exterior scaffolding work.', action_taken: 'Briefed 45 workers and supervisors.', reported_by: 'Safety Officer Rahul', incident_date: '2026-11-15' },
  { id: 2, incident_type: 'Near Miss', severity_level: 'Medium', description: 'Loose electrical wire spotted near temporary distribution board on 3rd floor.', action_taken: 'Power isolated immediately and cabling re-routed by electrician.', reported_by: 'Er. Rakesh Ranjan', incident_date: '2026-11-14' },
  { id: 3, incident_type: 'First Aid Case', severity_level: 'Low', description: 'Minor abrasion on laborer finger while handling brick stacking.', action_taken: 'First aid applied at site medical room. Worker resumed work.', reported_by: 'Site Nurse / Supervisor', incident_date: '2026-11-12' }
];

export default function SafetyModule() {
  const [safetyLogs, setSafetyLogs] = useState(initialSafetyLogs);
  const [incType, setIncType] = useState('Toolbox Talk Conducted');
  const [severity, setSeverity] = useState('Low');
  const [desc, setDesc] = useState('Scaffolding stability inspection and PPE compliance check before slab casting.');
  const [action, setAction] = useState('Checked all toe boards, safety nets, and harness anchor points.');
  const [reporter, setReporter] = useState('Safety Officer Rahul');
  const [incDate, setIncDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddSafetyLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const newEntry = {
      id: safetyLogs.length + 1,
      incident_type: incType,
      severity_level: severity,
      description: desc,
      action_taken: action,
      reported_by: reporter,
      incident_date: incDate
    };

    try {
      if (supabase) {
        await supabase.from('site_safety_incidents').insert([newEntry]);
      }
      setSafetyLogs([newEntry, ...safetyLogs]);
      setSuccessMsg('HSE safety log recorded successfully!');
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
          <h2 className="text-xl font-bold">Site Safety & HSE Incident Register</h2>
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
        
        {/* Add Safety Log Form */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 h-fit">
          <h3 className="text-lg font-black text-slate-900 mb-4 pb-2 border-b">Record Safety / HSE Log</h3>
          <form onSubmit={handleAddSafetyLog} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Incident / Activity Type</label>
              <select className="w-full p-3 border rounded-lg font-bold bg-white text-xs" value={incType} onChange={(e) => setIncType(e.target.value)}>
                <option value="Toolbox Talk Conducted">Toolbox Talk Conducted</option>
                <option value="Near Miss">Near Miss</option>
                <option value="First Aid Case">First Aid Case</option>
                <option value="Lost Time Injury">Lost Time Injury</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Severity Level</label>
                <select className="w-full p-3 border rounded-lg font-bold bg-white text-xs" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Incident Date</label>
                <input type="date" className="w-full p-3 border rounded-lg font-bold text-xs" value={incDate} onChange={(e) => setIncDate(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Description</label>
              <textarea className="w-full p-3 border rounded-lg font-medium text-xs bg-slate-50 h-20" value={desc} onChange={(e) => setDesc(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Corrective Action Taken</label>
              <textarea className="w-full p-3 border rounded-lg font-medium text-xs bg-slate-50 h-20" value={action} onChange={(e) => setAction(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Reported By</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={reporter} onChange={(e) => setReporter(e.target.value)} required />
            </div>
            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow transition uppercase tracking-wider text-sm">
              {isSaving ? 'Saving...' : '🛡️ Record Safety Log'}
            </button>
          </form>
        </div>

        {/* Master Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 font-bold text-sm uppercase tracking-wider">
            Godrej Zen Estate Phase-2 — HSE & Safety Register
          </div>
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-100 text-slate-700 border-b">
              <tr>
                <th className="py-3 px-4">Event & Description</th>
                <th className="py-3 px-4">Corrective Action</th>
                <th className="py-3 px-4 text-center">Severity</th>
                <th className="py-3 px-4 text-center">Date</th>
              </tr>
            </thead>
            <tbody>
              {safetyLogs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{log.incident_type}</span>
                    <p className="text-xs text-slate-600 mt-0.5">{log.description}</p>
                    <span className="text-[10px] text-slate-400">By: {log.reported_by}</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-700 font-medium">
                    {log.action_taken}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${log.severity_level === 'Critical' ? 'bg-rose-100 text-rose-800' : log.severity_level === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {log.severity_level}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">{log.incident_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}