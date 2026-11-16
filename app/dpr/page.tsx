'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
let supabase: any = null;
try { if (supabaseUrl && supabaseKey) { supabase = createClient(supabaseUrl, supabaseKey); } } catch (e) {}

const initialDprList = [
  { id: 1, report_date: '2026-11-15', work_summary: '4th Floor Slab Casting completed successfully using M25 grade RMC.', labor_count: 42, weather: 'Clear / Sunny', engineer: 'Er. Rakesh Ranjan' },
  { id: 2, report_date: '2026-11-14', work_summary: 'Brickwork masonry started in 3rd Floor East Wing. Steel binding for columns in progress.', labor_count: 38, weather: 'Clear / Pleasant', engineer: 'Er. Rakesh Ranjan' },
  { id: 3, report_date: '2026-11-13', work_summary: 'Curing of 3rd floor columns and external scaffolding erection.', labor_count: 35, weather: 'Clear', engineer: 'Er. Amit Kumar' }
];

export default function DPRModule() {
  const [dprList, setDprList] = useState(initialDprList);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [workSummary, setWorkSummary] = useState('Basement waterproofing and raft foundation casting.');
  const [laborCount, setLaborCount] = useState<number>(45);
  const [weather, setWeather] = useState('Clear / Sunny');
  const [engineer, setEngineer] = useState('Er. Rakesh Ranjan');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSaveDPR = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const newEntry = {
      id: dprList.length + 1,
      report_date: reportDate,
      work_summary: workSummary,
      labor_count: laborCount,
      weather: weather,
      engineer: engineer
    };

    try {
      if (supabase) {
        await supabase.from('site_dpr_entries').insert([newEntry]);
      }
      setDprList([newEntry, ...dprList]);
      setSuccessMsg('Daily Progress Report (DPR) submitted successfully!');
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
          <h2 className="text-xl font-bold">Daily Progress Report (DPR) & Site Log</h2>
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

      {/* Form & Feed Container */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Submit DPR Form */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 h-fit">
          <h3 className="text-lg font-black text-slate-900 mb-4 pb-2 border-b">Submit Today's Site DPR</h3>
          <form onSubmit={handleSaveDPR} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Report Date</label>
              <input type="date" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={reportDate} onChange={(e) => setReportDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Work Progress Summary</label>
              <textarea className="w-full p-3 border rounded-lg font-medium bg-slate-50 h-28" value={workSummary} onChange={(e) => setWorkSummary(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Total Labor Deployed</label>
              <input type="number" className="w-full p-3 border rounded-lg font-bold" value={laborCount} onChange={(e) => setLaborCount(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Weather Condition</label>
              <input type="text" className="w-full p-3 border rounded-lg font-medium" value={weather} onChange={(e) => setWeather(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Site Engineer In-Charge</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold" value={engineer} onChange={(e) => setEngineer(e.target.value)} required />
            </div>
            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow transition uppercase tracking-wider text-sm">
              {isSaving ? 'Submitting...' : '🚀 Submit DPR to Management'}
            </button>
          </form>
        </div>

        {/* DPR History Timeline / Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 font-bold text-sm uppercase tracking-wider">
            Godrej Zen Estate Phase-2 — DPR Archive
          </div>
          <div className="divide-y divide-slate-200">
            {dprList.map((dpr) => (
              <div key={dpr.id} className="p-6 hover:bg-slate-50 transition">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded">📅 {dpr.report_date}</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded">👷‍♂️ Labor: {dpr.labor_count} workers</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mb-2">{dpr.work_summary}</p>
                <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>Weather: <strong className="text-slate-700">{dpr.weather}</strong></span>
                  <span>Engineer: <strong className="text-slate-700">{dpr.engineer}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}