'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
let supabase: any = null;
try { if (supabaseUrl && supabaseKey) { supabase = createClient(supabaseUrl, supabaseKey); } } catch (e) {}

const initialComplianceRecords = [
  { id: 1, inspection_type: 'Concrete Cube Compressive Test (M25 - 28 Days)', batch_or_ref_no: 'CUBE-BATCH-402', test_result_status: 'Passed', inspector_name: 'Er. Rakesh Ranjan', inspection_date: '2026-11-14' },
  { id: 2, inspection_type: 'TMT Steel Fe500D Tensile Strength Lab Report', batch_or_ref_no: 'TATA-STEEL-16MM', test_result_status: 'Passed', inspector_name: 'Third-Party NABL Lab', inspection_date: '2026-11-12' },
  { id: 3, inspection_type: 'Site Safety & Scaffolding Audit', batch_or_ref_no: 'AUDIT-NOV-01', test_result_status: 'Passed', inspector_name: 'Safety Officer Rahul', inspection_date: '2026-11-10' },
  { id: 4, inspection_type: 'GSTR-3B Tax Filing Compliance Verification', batch_or_ref_no: 'GST-AUG-OCT-2026', test_result_status: 'Passed', inspector_name: 'CA Firm / Accounts', inspection_date: '2026-11-08' }
];

export default function ComplianceModule() {
  const [records, setRecords] = useState(initialComplianceRecords);
  const [inspType, setInspType] = useState('Concrete Cube Compressive Test (M30 - 7 Days)');
  const [refNo, setRefNo] = useState('CUBE-BATCH-501');
  const [status, setStatus] = useState('Passed');
  const [inspector, setInspector] = useState('Er. Rakesh Ranjan');
  const [inspDate, setInspDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const newEntry = {
      id: records.length + 1,
      inspection_type: inspType,
      batch_or_ref_no: refNo,
      test_result_status: status,
      inspector_name: inspector,
      inspection_date: inspDate
    };

    try {
      if (supabase) {
        await supabase.from('site_quality_compliance').insert([newEntry]);
      }
      setRecords([newEntry, ...records]);
      setSuccessMsg('Quality & compliance record added successfully!');
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
          <h2 className="text-xl font-bold">Quality Control (QC) & Site Compliance</h2>
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
        
        {/* Add Record Form */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 h-fit">
          <h3 className="text-lg font-black text-slate-900 mb-4 pb-2 border-b">Add QC Test / Audit Log</h3>
          <form onSubmit={handleAddRecord} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Inspection / Test Type</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={inspType} onChange={(e) => setInspType(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Batch / Reference No.</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={refNo} onChange={(e) => setRefNo(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Test Result Status</label>
              <select className="w-full p-3 border rounded-lg font-bold bg-white" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Passed">Passed</option>
                <option value="Pending Re-Test">Pending Re-Test</option>
                <option value="Non-Conformance">Non-Conformance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Inspector / Authority</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={inspector} onChange={(e) => setInspector(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Inspection Date</label>
              <input type="date" className="w-full p-3 border rounded-lg font-bold" value={inspDate} onChange={(e) => setInspDate(e.target.value)} required />
            </div>
            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow transition uppercase tracking-wider text-sm">
              {isSaving ? 'Saving...' : '+ Save QC Compliance Record'}
            </button>
          </form>
        </div>

        {/* Master Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 font-bold text-sm uppercase tracking-wider">
            Godrej Zen Estate Phase-2 — Quality & Compliance Register
          </div>
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-100 text-slate-700 border-b">
              <tr>
                <th className="py-3 px-4">Inspection Type & Ref</th>
                <th className="py-3 px-4">Inspector</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{r.inspection_type}</span>
                    <span className="text-[11px] font-mono text-slate-500">{r.batch_or_ref_no}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium text-xs">{r.inspector_name}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-xs">{r.inspection_date}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.test_result_status === 'Passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {r.test_result_status}
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