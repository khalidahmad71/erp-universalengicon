'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
let supabase: any = null;
try { if (supabaseUrl && supabaseKey) { supabase = createClient(supabaseUrl, supabaseKey); } } catch (e) {}

const initialStockItems = [
  { id: 1, material_name: 'OPC 53 Grade Cement (UltraTech)', category: 'Cement & Binders', unit_of_measure: 'Bags (50kg)', opening_stock: 1200, received_qty: 500, consumed_qty: 350, closing_balance: 1350 },
  { id: 2, material_name: 'TMT Rebar 16mm (Fe500D Tata Steel)', category: 'Steel', unit_of_measure: 'Metric Tons', opening_stock: 85, received_qty: 40, consumed_qty: 25, closing_balance: 100 },
  { id: 3, material_name: 'Flyash Bricks (Standard Size)', category: 'Aggregates & Bricks', unit_of_measure: 'Pcs', opening_stock: 45000, received_qty: 15000, consumed_qty: 12000, closing_balance: 48000 },
  { id: 4, material_name: 'Coarse Sand (River Sand)', category: 'Aggregates & Bricks', unit_of_measure: 'Cum', opening_stock: 320, received_qty: 150, consumed_qty: 90, closing_balance: 380 }
];

export default function StoreInventoryModule() {
  const [stockList, setStockList] = useState(initialStockItems);
  const [materialName, setMaterialName] = useState('PPC Cement (Nuvoco)');
  const [category, setCategory] = useState('Cement & Binders');
  const [uom, setUom] = useState('Bags (50kg)');
  const [opening, setOpening] = useState<number>(800);
  const [received, setReceived] = useState<number>(400);
  const [consumed, setConsumed] = useState<number>(200);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const calculatedClosing = opening + received - consumed;

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const newItem = {
      id: stockList.length + 1,
      material_name: materialName,
      category: category,
      unit_of_measure: uom,
      opening_stock: opening,
      received_qty: received,
      consumed_qty: consumed,
      closing_balance: calculatedClosing,
      warehouse_location: 'Godrej Zen Estate Central Yard'
    };

    try {
      if (supabase) {
        await supabase.from('store_inventory_stock').insert([newItem]);
      }
      setStockList([newItem, ...stockList]);
      setSuccessMsg('Store inventory item registered successfully!');
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
          <h2 className="text-xl font-bold">Store Inventory & Goods Receipt Note (GRN)</h2>
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
        
        {/* Add Stock / GRN Form */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 h-fit">
          <h3 className="text-lg font-black text-slate-900 mb-4 pb-2 border-b">New Material GRN / Stock Entry</h3>
          <form onSubmit={handleAddStock} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Material Name & Grade</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={materialName} onChange={(e) => setMaterialName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Category</label>
              <select className="w-full p-3 border rounded-lg font-bold bg-white" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Cement & Binders">Cement & Binders</option>
                <option value="Steel">Steel</option>
                <option value="Aggregates & Bricks">Aggregates & Bricks</option>
                <option value="Finishing & Hardware">Finishing & Hardware</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Unit of Measure (UoM)</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={uom} onChange={(e) => setUom(e.target.value)} required />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Opening</label>
                <input type="number" className="w-full p-2.5 border rounded-lg font-bold text-xs" value={opening} onChange={(e) => setOpening(Number(e.target.value))} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Received (GRN)</label>
                <input type="number" className="w-full p-2.5 border rounded-lg font-bold text-xs text-emerald-700" value={received} onChange={(e) => setReceived(Number(e.target.value))} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Consumed</label>
                <input type="number" className="w-full p-2.5 border rounded-lg font-bold text-xs text-rose-700" value={consumed} onChange={(e) => setConsumed(Number(e.target.value))} required />
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border text-xs font-bold flex justify-between">
              <span>Calculated Closing Stock:</span>
              <span className="text-blue-900">{calculatedClosing.toLocaleString()} {uom}</span>
            </div>
            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow transition uppercase tracking-wider text-sm">
              {isSaving ? 'Saving...' : '📦 Record GRN Stock Entry'}
            </button>
          </form>
        </div>

        {/* Store Inventory Master Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 font-bold text-sm uppercase tracking-wider">
            Godrej Zen Estate Phase-2 — Central Warehouse Stock Register
          </div>
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-100 text-slate-700 border-b">
              <tr>
                <th className="py-3 px-4">Material Description</th>
                <th className="py-3 px-4 text-center">Opening</th>
                <th className="py-3 px-4 text-center text-emerald-700">+ Recv</th>
                <th className="py-3 px-4 text-center text-rose-700">- Cons</th>
                <th className="py-3 px-4 text-right">Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {stockList.map((item) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{item.material_name}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{item.category} ({item.unit_of_measure})</span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-600">{item.opening_stock.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-700">+{item.received_qty.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center font-bold text-rose-700">-{item.consumed_qty.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-black text-blue-900">{item.closing_balance.toLocaleString()} {item.unit_of_measure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}