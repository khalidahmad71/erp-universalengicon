'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
let supabase: any = null;
try { if (supabaseUrl && supabaseKey) { supabase = createClient(supabaseUrl, supabaseKey); } } catch (e) {}

const initialAssets = [
  { id: 1, asset_name: 'Toyota Innova Hycross (Site Inspection Vehicle)', asset_category: 'Vehicles', purchase_date: '2024-05-15', purchase_cost: 3100000, current_book_value: 2600000, asset_status: 'Active / Operational' },
  { id: 2, asset_name: 'Hydraulic Crawler Crane 25T', asset_category: 'Heavy Machinery', purchase_date: '2023-11-10', purchase_cost: 6500000, current_book_value: 5200000, asset_status: 'Active / Operational' },
  { id: 3, asset_name: 'Steel scaffolding pipes & props (Batch 1)', asset_category: 'Formwork & Scaffolding', purchase_date: '2025-02-20', purchase_cost: 1800000, current_book_value: 1550000, asset_status: 'Active / Operational' },
  { id: 4, asset_name: 'Diesel Generator 125 KVA (Kirloskar)', asset_category: 'Heavy Machinery', purchase_date: '2024-08-12', purchase_cost: 1200000, current_book_value: 1000000, asset_status: 'Active / Operational' }
];

export default function FixedAssetsModule() {
  const [assetList, setAssetList] = useState(initialAssets);
  const [assetName, setAssetName] = useState('Concrete Boom Placer Pump');
  const [category, setCategory] = useState('Heavy Machinery');
  const [purchaseDate, setPurchaseDate] = useState('2026-03-10');
  const [cost, setCost] = useState<number>(3500000);
  const [bookValue, setBookValue] = useState<number>(3300000);
  const [status, setStatus] = useState('Active / Operational');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const newEntry = {
      id: assetList.length + 1,
      asset_name: assetName,
      asset_category: category,
      purchase_date: purchaseDate,
      purchase_cost: cost,
      current_book_value: bookValue,
      asset_status: status
    };

    try {
      if (supabase) {
        await supabase.from('corporate_fixed_assets').insert([newEntry]);
      }
      setAssetList([newEntry, ...assetList]);
      setSuccessMsg('Fixed asset registered successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const totalAssetValuation = assetList.reduce((acc, a) => acc + a.current_book_value, 0);

  return (
    <div className="p-8 pb-20">
      
      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center bg-slate-900 text-white px-6 py-4 rounded-xl shadow-md">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">Universal Engicon ERP</span>
          <h2 className="text-xl font-bold">Fixed Assets & Heavy Machinery Register</h2>
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
      <div className="max-w-6xl mx-auto bg-cyan-900 text-white p-6 rounded-2xl shadow-lg mb-8 flex justify-between items-center">
        <div>
          <span className="text-xs uppercase tracking-widest text-cyan-300 font-bold">Asset Valuation Summary</span>
          <h3 className="text-2xl font-black mt-1">Total Current Book Value</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-cyan-300 uppercase font-bold">Valuation Sum</p>
          <p className="text-2xl font-black text-emerald-300">₹ {totalAssetValuation.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Form & Table Container */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Asset Form */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 h-fit">
          <h3 className="text-lg font-black text-slate-900 mb-4 pb-2 border-b">Register New Fixed Asset</h3>
          <form onSubmit={handleAddAsset} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Asset Name & Specifications</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={assetName} onChange={(e) => setAssetName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Asset Category</label>
              <select className="w-full p-3 border rounded-lg font-bold bg-white" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Heavy Machinery">Heavy Machinery</option>
                <option value="Vehicles">Vehicles</option>
                <option value="Formwork & Scaffolding">Formwork & Scaffolding</option>
                <option value="IT & Office Equipment">IT & Office Equipment</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Purchase Date</label>
              <input type="date" className="w-full p-3 border rounded-lg font-bold text-xs" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Purchase Cost (₹)</label>
                <input type="number" className="w-full p-3 border rounded-lg font-bold text-blue-900" value={cost} onChange={(e) => setCost(Number(e.target.value))} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Current Book Value (₹)</label>
                <input type="number" className="w-full p-3 border rounded-lg font-bold text-emerald-700" value={bookValue} onChange={(e) => setBookValue(Number(e.target.value))} required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Asset Status</label>
              <select className="w-full p-3 border rounded-lg font-bold bg-white" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Active / Operational">Active / Operational</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Written Off">Written Off</option>
              </select>
            </div>
            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow transition uppercase tracking-wider text-sm">
              {isSaving ? 'Saving...' : '+ Register Fixed Asset'}
            </button>
          </form>
        </div>

        {/* Master Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 font-bold text-sm uppercase tracking-wider">
            Universal Engicon — Corporate Fixed Assets Register
          </div>
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-100 text-slate-700 border-b">
              <tr>
                <th className="py-3 px-4">Asset Description</th>
                <th className="py-3 px-4 text-right">Purchase Cost (₹)</th>
                <th className="py-3 px-4 text-right text-emerald-700">Book Value (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {assetList.map((a) => (
                <tr key={a.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{a.asset_name}</span>
                    <span className="text-[11px] text-cyan-800 font-semibold">{a.asset_category} (Purchased: {a.purchase_date})</span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-700">₹ {a.purchase_cost.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right font-black text-emerald-700">₹ {a.current_book_value.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      {a.asset_status}
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