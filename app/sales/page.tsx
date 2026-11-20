'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import OfficialPrintDocument from '../../components/OfficialPrintDocument';import { Home, Plus, Printer, X } from 'lucide-react';

export default function RealEstateSalesPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [printReceipt, setPrintReceipt] = useState<any | null>(null);

  const [form, setForm] = useState({
    project_id: '',
    unit_no: '',
    unit_type: '3 BHK Residential Flat',
    customer_name: '',
    customer_phone: '',
    customer_pan: '',
    booking_amount: 0,
    gst_percent: 5,
    payment_mode: 'RTGS / NEFT',
  });

  const fetchData = async () => {
    setLoading(true);
    const [{ data: bookingData }, { data: projData }] = await Promise.all([
      supabase.from('real_estate_bookings').select('*, projects(name)').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name'),
    ]);
    if (bookingData) setBookings(bookingData);
    if (projData) setProjects(projData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const baseAmt = Number(form.booking_amount);
  const gstAmt = (baseAmt * Number(form.gst_percent)) / 100;
  const totalReceived = baseAmt + gstAmt;

  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('real_estate_bookings').insert([
      {
        project_id: form.project_id ? Number(form.project_id) : null,
        unit_no: form.unit_no,
        unit_type: form.unit_type,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_pan: form.customer_pan,
        booking_amount: totalReceived,
        gst_amount: gstAmt,
        payment_mode: form.payment_mode,
        booking_date: new Date().toISOString().slice(0, 10),
      },
    ]);

    if (error) {
      alert('Error saving booking: ' + error.message);
    } else {
      setShowForm(false);
      fetchData();
    }
  };

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val || 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-800 text-white rounded-lg shadow">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Real Estate Sales & Customer Receipts</h1>
            <p className="text-xs text-slate-500">UNIVERSAL ENGICON PVT. LTD. • Unit Bookings & Payment Milestones</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-800 text-white text-sm font-bold rounded-lg shadow hover:bg-slate-900 transition-all"
        >
          <Plus className="w-4 h-4" />
          Record Customer Receipt
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSaveBooking} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="font-bold text-slate-800">New Unit Booking / Installment Receipt</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block font-semibold mb-1">Project Name</label>
              <select
                required
                value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Unit / Flat / Shop No</label>
              <input
                type="text"
                required
                placeholder="e.g., Tower A - Flat 502"
                value={form.unit_no}
                onChange={(e) => setForm({ ...form, unit_no: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Customer Full Name</label>
              <input
                type="text"
                required
                placeholder="Buyer Name"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Customer Mobile</label>
              <input
                type="text"
                placeholder="+91 98350 XXXXX"
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Customer PAN</label>
              <input
                type="text"
                placeholder="ABCDE1234F"
                value={form.customer_pan}
                onChange={(e) => setForm({ ...form, customer_pan: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Installment Amount (Excl. GST ₹)</label>
              <input
                type="number"
                required
                value={form.booking_amount}
                onChange={(e) => setForm({ ...form, booking_amount: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-100 p-4 rounded-lg gap-4">
            <div className="text-sm font-semibold text-slate-700">
              Installment: <span className="font-bold">{formatINR(baseAmt)}</span> + GST (5%):{' '}
              <span className="font-bold">{formatINR(gstAmt)}</span> = Total Receipt:{' '}
              <span className="text-emerald-700 font-black text-base">{formatINR(totalReceived)}</span>
            </div>
            <button type="submit" className="px-6 py-2.5 bg-emerald-700 text-white font-bold rounded-lg shadow hover:bg-emerald-800">
              Generate Receipt & Sync Ledger
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <th className="py-3 px-4">Unit No</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4 text-center">Official Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((bk) => (
                <tr key={bk.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-blue-800">{bk.unit_no}</td>
                  <td className="py-3 px-4 font-medium">{bk.projects?.name || 'Real Estate Project'}</td>
                  <td className="py-3 px-4 font-semibold">{bk.customer_name}</td>
                  <td className="py-3 px-4 text-slate-600">{bk.payment_mode || 'Bank Transfer'}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">
                    {formatINR(bk.booking_amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setPrintReceipt(bk)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-slate-900 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Receipt
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No customer receipts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {printReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto bg-white rounded-xl p-5 shadow-2xl">
            <div className="no-print flex justify-between items-center border-b pb-3 mb-4">
              <span className="font-bold text-slate-700 text-sm">Official Customer Payment Receipt (A4)</span>
              <button
                onClick={() => setPrintReceipt(null)}
                className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700"
              >
                Close Preview ✕
              </button>
            </div>
            <OfficialPrintDocument
              docType="CUSTOMER PAYMENT RECEIPT"
              docNumber={`REC-${printReceipt.unit_no || printReceipt.id}`}
              docDate={(printReceipt.booking_date || printReceipt.created_at || new Date().toISOString()).slice(0, 10)}
              projectName={printReceipt.projects?.name || 'Universal Engicon Real Estate'}
              partyTitle="Allottee / Customer Details"
              partyName={printReceipt.customer_name}
              partyPhone={printReceipt.customer_phone}
              partyGstOrPan={printReceipt.customer_pan}
              items={[
                {
                  description: `Booking / Installment Received for Unit ${printReceipt.unit_no} (${printReceipt.unit_type || 'Property Unit'}) via ${printReceipt.payment_mode || 'Bank Transfer'}`,
                  unit: 'Unit',
                  quantity: 1,
                  rate: Number(printReceipt.booking_amount || 0) - Number(printReceipt.gst_amount || 0),
                  amount: Number(printReceipt.booking_amount || 0) - Number(printReceipt.gst_amount || 0),
                },
              ]}
              subTotal={Number(printReceipt.booking_amount || 0) - Number(printReceipt.gst_amount || 0)}
              gstAmount={Number(printReceipt.gst_amount || 0)}
              grandTotal={Number(printReceipt.booking_amount || 0)}
            />
          </div>
        </div>
      )}
    </div>
  );
}