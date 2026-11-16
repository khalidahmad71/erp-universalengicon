'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
let supabase: any = null;
try { if (supabaseUrl && supabaseKey) { supabase = createClient(supabaseUrl, supabaseKey); } } catch (e) {}

const initialBoqItems = [
  { id: 1, item_code: 'BOQ-01', item_description: 'Earthwork Excavation in Foundation', unit: 'Cum', estimated_qty: 4500, rate_per_unit: 350, total_amount: 1575000 },
  { id: 2, item_code: 'BOQ-02', item_description: 'PCC Grade M15 Under Foundation', unit: 'Cum', estimated_qty: 850, rate_per_unit: 5200, total_amount: 4420000 },
  { id: 3, item_code: 'BOQ-03', item_description: 'RCC M25 Grade in Columns & Beams', unit: 'Cum', estimated_qty: 3200, rate_per_unit: 6800, total_amount: 21760000 },
  { id: 4, item_code: 'BOQ-04', item_description: 'TMT Steel Reinforcement Bars (Fe500D)', unit: 'MT', estimated_qty: 450, rate_per_unit: 62000, total_amount: 27900000 },
  { id: 5, item_code: 'BOQ-05', item_description: 'Flyash Bricks Masonry Work', unit: 'Cum', estimated_qty: 1800, rate_per_unit: 4500, total_amount: 8100000 }
];

export default function BOQEstimationModule() {
  const [boqList, setBoqList] = useState(initialBoqItems);
  const [itemCode, setItemCode] = useState('BOQ-06');
  const [desc, setDesc] = useState('Internal Plaster 12mm thick');
  const [unit, setUnit] = useState('Sqm');
  const [qty, setQty] = useState<number>(5000);
  const [rate, setRate] = useState<number>(220);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const calculatedTotal = Number((qty * rate).toFixed(2));
  const totalBoqBudget = boqList.reduce((acc, item) => acc + item.total_amount, 0);

  const handleAddBoqItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const newItem = {
      id: boqList.length + 1,
      item_code: itemCode,
      item_description: desc,
      unit: unit,
      estimated_qty: qty,
      rate_per_unit: rate,
      total_amount: calculatedTotal
    };

    try {
      if (supabase) {
        await supabase.from('project_boq').insert([newItem]);
      }
      setBoqList([...boqList, newItem]);
      setSuccessMsg('BOQ item added successfully!');
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
          <h2 className="text-xl font-bold">Bill of Quantities (BOQ) & Material Estimation</h2>
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

      {/* Summary Card */}
      <div className="max-w-6xl mx-auto bg-blue-900 text-white p-6 rounded-2xl shadow-lg mb-8 flex justify-between items-center">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-300 font-bold">Godrej Zen Estate Phase-2</span>
          <h3 className="text-2xl font-black mt-1">Total Project BOQ Budget Evaluation</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-blue-300 uppercase font-bold">Cumulative Budget</p>
          <p className="text-2xl font-black text-emerald-400">₹ {totalBoqBudget.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* BOQ Table & Form Container */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add BOQ Item Form */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 h-fit">
          <h3 className="text-lg font-black text-slate-900 mb-4 pb-2 border-b">Add New BOQ Item</h3>
          <form onSubmit={handleAddBoqItem} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Item Code</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={itemCode} onChange={(e) => setItemCode(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Item Description</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={desc} onChange={(e) => setDesc(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Unit</label>
              <select className="w-full p-3 border rounded-lg font-bold bg-white" value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="Cum">Cum</option>
                <option value="Sqm">Sqm</option>
                <option value="Rft">Rft</option>
                <option value="MT">MT</option>
                <option value="Nos">Nos</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Estimated Quantity</label>
              <input type="number" className="w-full p-3 border rounded-lg font-bold" value={qty} onChange={(e) => setQty(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Rate per Unit (₹)</label>
              <input type="number" className="w-full p-3 border rounded-lg font-bold text-blue-900" value={rate} onChange={(e) => setRate(Number(e.target.value))} required />
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border text-xs font-bold flex justify-between">
              <span>Calculated Amount:</span>
              <span className="text-blue-900">₹ {calculatedTotal.toLocaleString('en-IN')}</span>
            </div>
            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow transition uppercase tracking-wider text-sm">
              {isSaving ? 'Saving...' : '+ Add to BOQ Register'}
            </button>
          </form>
        </div>

        {/* BOQ Master Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 font-bold text-sm uppercase tracking-wider">
            Approved Bill of Quantities (BOQ) Items
          </div>
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-100 text-slate-700 border-b">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Qty / Unit</th>
                <th className="py-3 px-4 text-right">Rate (₹)</th>
                <th className="py-3 px-4 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {boqList.map((item) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-600">{item.item_code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{item.item_description}</td>
                  <td className="py-3 px-4 text-center font-medium">{item.estimated_qty.toLocaleString()} {item.unit}</td>
                  <td className="py-3 px-4 text-right font-semibold">₹ {item.rate_per_unit.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right font-black text-blue-900">₹ {item.total_amount.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}