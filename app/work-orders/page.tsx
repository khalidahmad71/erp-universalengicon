'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
let supabase: any = null;
try { if (supabaseUrl && supabaseKey) { supabase = createClient(supabaseUrl, supabaseKey); } } catch (e) {}

const initialWorkOrders = [
  { id: 1, work_order_no: 'UEPL/WO/26-27/001', subcontractor_name: 'Maa Shuttering & Scaffolding Works', work_package: 'Formwork & Shuttering Package (Towers A & B)', contract_value: 4500000, completion_target_date: '2027-03-31', wo_status: 'Active' },
  { id: 2, work_order_no: 'UEPL/WO/26-27/002', subcontractor_name: 'Bihar Electrical & Hardware House', work_package: 'Internal Wiring & Conduit Piping', contract_value: 2800000, completion_target_date: '2027-05-15', wo_status: 'Active' },
  { id: 3, work_order_no: 'UEPL/WO/26-27/003', subcontractor_name: 'Ganga Plumbing & Sanitary Solutions', work_package: 'Drainage and Water Supply Piping', contract_value: 3200000, completion_target_date: '2027-06-30', wo_status: 'Active' }
];

export default function WorkOrdersModule() {
  const [woList, setWoList] = useState(initialWorkOrders);
  const [woNo, setWoNo] = useState('UEPL/WO/26-27/004');
  const [subName, setSubName] = useState('Patna Waterproofing & Painting Co.');
  const [packageType, setPackageType] = useState('External Painting & Waterproofing');
  const [val, setVal] = useState<number>(1800000);
  const [targetDate, setTargetDate] = useState('2027-08-15');
  const [status, setStatus] = useState('Active');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddWO = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const newEntry = {
      id: woList.length + 1,
      work_order_no: woNo,
      subcontractor_name: subName,
      work_package: packageType,
      contract_value: val,
      completion_target_date: targetDate,
      wo_status: status
    };

    try {
      if (supabase) {
        await supabase.from('subcontractor_work_orders').insert([newEntry]);
      }
      setWoList([newEntry, ...woList]);
      setSuccessMsg('Subcontractor Work Order issued and saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const totalContractCommitment = woList.reduce((acc, w) => acc + w.contract_value, 0);

  return (
    <div className="p-8 pb-20">
      
      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center bg-slate-900 text-white px-6 py-4 rounded-xl shadow-md">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">Universal Engicon ERP</span>
          <h2 className="text-xl font-bold">Subcontractor Work Orders & Service Agreements</h2>
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

      {/* Summary Stat Card */}
      <div className="max-w-6xl mx-auto bg-indigo-900 text-white p-6 rounded-2xl shadow-lg mb-8 flex justify-between items-center">
        <div>
          <span className="text-xs uppercase tracking-widest text-indigo-300 font-bold">Subcontract Commitments</span>
          <h3 className="text-2xl font-black mt-1">Total Active Work Order Value</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-indigo-300 uppercase font-bold">Committed Sum</p>
          <p className="text-2xl font-black text-amber-300">₹ {totalContractCommitment.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Form & Table Container */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Issue Work Order Form */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 h-fit">
          <h3 className="text-lg font-black text-slate-900 mb-4 pb-2 border-b">Issue New Work Order</h3>
          <form onSubmit={handleAddWO} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Work Order No.</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={woNo} onChange={(e) => setWoNo(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Subcontractor Name</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={subName} onChange={(e) => setSubName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Work Package Description</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={packageType} onChange={(e) => setPackageType(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contract Value (₹)</label>
              <input type="number" className="w-full p-3 border rounded-lg font-bold text-blue-900" value={val} onChange={(e) => setVal(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Completion Target Date</label>
              <input type="date" className="w-full p-3 border rounded-lg font-bold" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
            </div>
            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow transition uppercase tracking-wider text-sm">
              {isSaving ? 'Issuing...' : '📝 Issue & Save Work Order'}
            </button>
          </form>
        </div>

        {/* Master Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 font-bold text-sm uppercase tracking-wider">
            Godrej Zen Estate Phase-2 — Subcontractor Work Orders Register
          </div>
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-100 text-slate-700 border-b">
              <tr>
                <th className="py-3 px-4">WO No. & Subcontractor</th>
                <th className="py-3 px-4">Package</th>
                <th className="py-3 px-4 text-right">Value (₹)</th>
                <th className="py-3 px-4 text-center">Target</th>
              </tr>
            </thead>
            <tbody>
              {woList.map((w) => (
                <tr key={w.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{w.subcontractor_name}</span>
                    <span className="text-[11px] font-mono text-slate-500">{w.work_order_no}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium text-xs">{w.work_package}</td>
                  <td className="py-3 px-4 text-right font-black text-blue-900">₹ {w.contract_value.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-center font-mono text-xs font-semibold">{w.completion_target_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}