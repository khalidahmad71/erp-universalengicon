'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
let supabase: any = null;
try { if (supabaseUrl && supabaseKey) { supabase = createClient(supabaseUrl, supabaseKey); } } catch (e) {}

const initialSalesUnits = [
  { id: 1, unit_number: 'Tower A - 202', unit_type: '3 BHK Flat', customer_name: 'Rajesh Kumar', contact_number: '9876543210', total_consideration: 7500000, booking_status: 'Booked' },
  { id: 2, unit_number: 'Tower A - 402', unit_type: '2 BHK Flat', customer_name: 'Amitabh Sinha', contact_number: '9123456789', total_consideration: 5800000, booking_status: 'Booked' },
  { id: 3, unit_number: 'Tower B - 101', unit_type: 'Commercial Shop', customer_name: 'Pending Allocation', contact_number: 'N/A', total_consideration: 4500000, booking_status: 'Available' },
  { id: 4, unit_number: 'Tower B - 304', unit_type: '3 BHK Flat', customer_name: 'Vikramaditya Roy', contact_number: '9934123456', total_consideration: 7800000, booking_status: 'Registry Done' }
];

export default function SalesManagementModule() {
  const [salesList, setSalesList] = useState(initialSalesUnits);
  const [unitNo, setUnitNo] = useState('Tower B - 102');
  const [unitType, setUnitType] = useState('2 BHK Flat');
  const [custName, setCustName] = useState('Sanjay Verma');
  const [phone, setPhone] = useState('9431012345');
  const [price, setPrice] = useState<number>(6000000);
  const [status, setStatus] = useState('Booked');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const newEntry = {
      id: salesList.length + 1,
      unit_number: unitNo,
      unit_type: unitType,
      customer_name: custName,
      contact_number: phone,
      total_consideration: price,
      booking_status: status
    };

    try {
      if (supabase) {
        await supabase.from('real_estate_sales').insert([newEntry]);
      }
      setSalesList([newEntry, ...salesList]);
      setSuccessMsg('Real estate unit sale/booking recorded successfully!');
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
          <h2 className="text-xl font-bold">Real Estate Sales & Unit Booking Management</h2>
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
        
        {/* Register New Sale Form */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 h-fit">
          <h3 className="text-lg font-black text-slate-900 mb-4 pb-2 border-b">Record Unit Booking / Sale</h3>
          <form onSubmit={handleAddSale} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Unit Number / Code</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={unitNo} onChange={(e) => setUnitNo(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Unit Type</label>
              <select className="w-full p-3 border rounded-lg font-bold bg-white" value={unitType} onChange={(e) => setUnitType(e.target.value)}>
                <option value="2 BHK Flat">2 BHK Flat</option>
                <option value="3 BHK Flat">3 BHK Flat</option>
                <option value="Commercial Shop">Commercial Shop</option>
                <option value="Office Space">Office Space</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Customer Full Name</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={custName} onChange={(e) => setCustName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contact Number</label>
              <input type="text" className="w-full p-3 border rounded-lg font-medium" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Total Consideration (₹)</label>
              <input type="number" className="w-full p-3 border rounded-lg font-bold text-blue-900" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Booking Status</label>
              <select className="w-full p-3 border rounded-lg font-bold bg-white" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Available">Available</option>
                <option value="Booked">Booked</option>
                <option value="Registry Done">Registry Done</option>
              </select>
            </div>
            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow transition uppercase tracking-wider text-sm">
              {isSaving ? 'Recording...' : '💾 Save Sale & Booking'}
            </button>
          </form>
        </div>

        {/* Sales Master Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 font-bold text-sm uppercase tracking-wider">
            Godrej Zen Estate Phase-2 — Sales & Allotment Register
          </div>
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-100 text-slate-700 border-b">
              <tr>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Consideration (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {salesList.map((s) => (
                <tr key={s.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{s.unit_number}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{s.unit_type}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{s.customer_name}</td>
                  <td className="py-3 px-4 text-right font-black text-blue-900">₹ {s.total_consideration.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.booking_status === 'Registry Done' ? 'bg-emerald-100 text-emerald-800' : s.booking_status === 'Booked' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'}`}>
                      {s.booking_status}
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