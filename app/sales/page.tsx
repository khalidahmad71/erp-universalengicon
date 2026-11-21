'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Building2,
  Home,
  Store,
  Briefcase,
  CheckCircle2,
  Plus,
  Phone,
  User,
  IndianRupee,
  X,
  Receipt,
  Printer,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface RealEstateUnit {
  id: string;
  project_name: string;
  floor_no: string;
  unit_number: string;
  unit_type: 'Flat' | 'Shop' | 'Office' | string;
  area_sqft: number;
  total_price: number;
  status: 'Available' | 'Booked' | 'Hold' | string;
  customer_name?: string | null;
  customer_phone?: string | null;
  booking_date?: string | null;
  amount_received?: number;
}

interface CustomerReceipt {
  id: string;
  receipt_no: string;
  project_name: string;
  unit_number: string;
  customer_name: string;
  payment_mode: string;
  transaction_ref?: string;
  amount_received: number;
  receipt_date: string;
}

export default function RealEstateSalesPage() {
  const [units, setUnits] = useState<RealEstateUnit[]>([]);
  const [receipts, setReceipts] = useState<CustomerReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('Godrej Zen Estate Phase-2');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Booking Modal State
  const [activeUnit, setActiveUnit] = useState<RealEstateUnit | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingBooking, setSavingBooking] = useState(false);

  // Add New Unit Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState('Godrej Zen Estate Phase-2');
  const [newFloor, setNewFloor] = useState('4th Floor');
  const [newUnitNo, setNewUnitNo] = useState('');
  const [newUnitType, setNewUnitType] = useState<'Flat' | 'Shop' | 'Office'>('Flat');
  const [newArea, setNewArea] = useState('1500');
  const [newPrice, setNewPrice] = useState('9800000');

  // Record Customer Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [recUnitNo, setRecUnitNo] = useState('');
  const [recCustomerName, setRecCustomerName] = useState('');
  const [recPaymentMode, setRecPaymentMode] = useState('NEFT / RTGS');
  const [recRefNo, setRecRefNo] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recDate, setRecDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchAllData = async () => {
    setLoading(true);
    const [unitsRes, receiptsRes] = await Promise.all([
      supabase
        .from('real_estate_units')
        .select('*')
        .order('floor_no', { ascending: true })
        .order('unit_number', { ascending: true }),
      supabase
        .from('customer_receipts')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    if (!unitsRes.error && unitsRes.data) {
      setUnits(unitsRes.data);
      const projects = Array.from(new Set(unitsRes.data.map((u) => u.project_name)));
      if (projects.length > 0 && !projects.includes(selectedProject)) {
        setSelectedProject(projects[0]);
      }
    }
    if (!receiptsRes.error && receiptsRes.data) {
      setReceipts(receiptsRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const projectsList = useMemo(() => {
    const list = Array.from(new Set(units.map((u) => u.project_name)));
    return list.length > 0 ? list : ['Godrej Zen Estate Phase-2'];
  }, [units]);

  const projectUnits = useMemo(() => {
    return units.filter((u) => u.project_name === selectedProject);
  }, [units, selectedProject]);

  const projectReceipts = useMemo(() => {
    return receipts.filter((r) => r.project_name === selectedProject);
  }, [receipts, selectedProject]);

  const stats = useMemo(() => {
    const total = projectUnits.length;
    const booked = projectUnits.filter((u) => u.status === 'Booked').length;
    const available = projectUnits.filter((u) => u.status === 'Available').length;

    const flatsTotal = projectUnits.filter((u) => u.unit_type === 'Flat').length;
    const flatsBooked = projectUnits.filter((u) => u.unit_type === 'Flat' && u.status === 'Booked').length;

    const shopsTotal = projectUnits.filter((u) => u.unit_type === 'Shop').length;
    const shopsBooked = projectUnits.filter((u) => u.unit_type === 'Shop' && u.status === 'Booked').length;

    const officesTotal = projectUnits.filter((u) => u.unit_type === 'Office').length;
    const officesBooked = projectUnits.filter((u) => u.unit_type === 'Office' && u.status === 'Booked').length;

    const totalRevenue = projectUnits
      .filter((u) => u.status === 'Booked')
      .reduce((acc, u) => acc + Number(u.total_price || 0), 0);

    const totalCollected = projectUnits.reduce((acc, u) => acc + Number(u.amount_received || 0), 0);

    return {
      total,
      booked,
      available,
      flatsTotal,
      flatsBooked,
      shopsTotal,
      shopsBooked,
      officesTotal,
      officesBooked,
      totalRevenue,
      totalCollected,
    };
  }, [projectUnits]);

  const floorGroups = useMemo(() => {
    const filtered = projectUnits.filter((u) => {
      const matchType = typeFilter === 'ALL' || u.unit_type === typeFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      return matchType && matchStatus;
    });

    const groups: Record<string, RealEstateUnit[]> = {};
    filtered.forEach((u) => {
      if (!groups[u.floor_no]) groups[u.floor_no] = [];
      groups[u.floor_no].push(u);
    });
    return groups;
  }, [projectUnits, typeFilter, statusFilter]);

  const openUnitModal = (unit: RealEstateUnit) => {
    setActiveUnit(unit);
    setCustomerName(unit.customer_name || '');
    setCustomerPhone(unit.customer_phone || '');
    setAmountReceived(unit.amount_received ? String(unit.amount_received) : '');
    setBookingDate(unit.booking_date || new Date().toISOString().split('T')[0]);
  };

  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUnit) return;
    setSavingBooking(true);

    const paidAmt = Number(amountReceived || 0);
    const { error } = await supabase
      .from('real_estate_units')
      .update({
        status: 'Booked',
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        booking_date: bookingDate,
        amount_received: paidAmt,
      })
      .eq('id', activeUnit.id);

    // Also auto-log receipt if initial booking amount > 0 and newly booked
    if (!error && activeUnit.status === 'Available' && paidAmt > 0) {
      const recNo = `UE-REC-${Math.floor(100000 + Math.random() * 900000)}`;
      await supabase.from('customer_receipts').insert([
        {
          receipt_no: recNo,
          project_name: activeUnit.project_name,
          unit_number: activeUnit.unit_number,
          customer_name: customerName.trim(),
          payment_mode: 'Booking Advance',
          amount_received: paidAmt,
          receipt_date: bookingDate,
        },
      ]);
    }

    setSavingBooking(false);
    if (error) {
      alert('Booking error: ' + error.message);
    } else {
      setActiveUnit(null);
      fetchAllData();
    }
  };

  const handleCancelBooking = async () => {
    if (!activeUnit) return;
    if (!confirm(`Cancel booking for ${activeUnit.unit_number} and mark Available?`)) return;

    await supabase
      .from('real_estate_units')
      .update({
        status: 'Available',
        customer_name: null,
        customer_phone: null,
        booking_date: null,
        amount_received: 0,
      })
      .eq('id', activeUnit.id);

    setActiveUnit(null);
    fetchAllData();
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('real_estate_units').insert([
      {
        project_name: newProject.trim(),
        floor_no: newFloor.trim(),
        unit_number: newUnitNo.trim(),
        unit_type: newUnitType,
        area_sqft: Number(newArea || 0),
        total_price: Number(newPrice || 0),
        status: 'Available',
        amount_received: 0,
      },
    ]);

    if (error) {
      alert('Error adding unit: ' + error.message);
    } else {
      setShowAddModal(false);
      setNewUnitNo('');
      setSelectedProject(newProject.trim());
      fetchAllData();
    }
  };

  const handleRecordReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(recAmount || 0);
    if (amt <= 0) return;

    const recNo = `UE-REC-${Math.floor(100000 + Math.random() * 900000)}`;
    const { error } = await supabase.from('customer_receipts').insert([
      {
        receipt_no: recNo,
        project_name: selectedProject,
        unit_number: recUnitNo,
        customer_name: recCustomerName.trim(),
        payment_mode: recPaymentMode,
        transaction_ref: recRefNo.trim(),
        amount_received: amt,
        receipt_date: recDate,
      },
    ]);

    if (error) {
      alert('Receipt Error: ' + error.message);
      return;
    }

    // Update total received on that unit automatically
    const matchedUnit = projectUnits.find((u) => u.unit_number === recUnitNo);
    if (matchedUnit) {
      await supabase
        .from('real_estate_units')
        .update({
          status: 'Booked',
          customer_name: matchedUnit.customer_name || recCustomerName.trim(),
          amount_received: Number(matchedUnit.amount_received || 0) + amt,
        })
        .eq('id', matchedUnit.id);
    }

    setShowReceiptModal(false);
    setRecAmount('');
    setRecRefNo('');
    fetchAllData();
  };

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Project Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Real Estate Sales &amp; Customer Receipts
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5">
            Project Inventory, Bookings &amp; Payment Receipts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Floor-wise Flats, Shops &amp; Offices availability + Customer Payment Receipts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-extrabold text-slate-900 focus:border-blue-600 focus:outline-none"
          >
            {projectsList.map((proj) => (
              <option key={proj} value={proj}>
                {proj}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setNewProject(selectedProject);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-lg shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Flat / Shop / Office
          </button>

          <button
            onClick={() => {
              const firstBooked = projectUnits.find((u) => u.status === 'Booked') || projectUnits[0];
              if (firstBooked) {
                setRecUnitNo(firstBooked.unit_number);
                setRecCustomerName(firstBooked.customer_name || '');
              }
              setShowReceiptModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            + Record Customer Receipt
          </button>
        </div>
      </div>

      {/* Top KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">Total Project Units</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          <div className="mt-2 flex items-center gap-2 text-xs font-bold">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {stats.available} Khali
            </span>
            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              {stats.booked} Booked
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Flats</span>
            <Home className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.flatsTotal}</div>
          <div className="text-xs font-semibold text-slate-600 mt-1">
            Booked: <strong className="text-rose-700">{stats.flatsBooked}</strong> • Khali:{' '}
            <strong className="text-emerald-700">{stats.flatsTotal - stats.flatsBooked}</strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Shops</span>
            <Store className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.shopsTotal}</div>
          <div className="text-xs font-semibold text-slate-600 mt-1">
            Booked: <strong className="text-rose-700">{stats.shopsBooked}</strong> • Khali:{' '}
            <strong className="text-emerald-700">{stats.shopsTotal - stats.shopsBooked}</strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Offices</span>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.officesTotal}</div>
          <div className="text-xs font-semibold text-slate-600 mt-1">
            Booked: <strong className="text-rose-700">{stats.officesBooked}</strong> • Khali:{' '}
            <strong className="text-emerald-700">{stats.officesTotal - stats.officesBooked}</strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Sales &amp; Collection</span>
            <IndianRupee className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-lg font-black text-slate-900 mt-1">
            {formatINR(stats.totalRevenue)}
          </div>
          <div className="text-xs font-semibold text-emerald-700 mt-1">
            Received: {formatINR(stats.totalCollected)}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase mr-1">Unit Type:</span>
          {['ALL', 'Flat', 'Shop', 'Office'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                typeFilter === t
                  ? 'bg-blue-800 text-white border-blue-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t === 'ALL' ? 'All Types' : t + 's'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase mr-1">Status:</span>
          {['ALL', 'Available', 'Booked'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                statusFilter === s
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {s === 'ALL' ? 'All Units' : s === 'Available' ? 'Khali (Available)' : 'Booked'}
            </button>
          ))}
        </div>
      </div>

      {/* Floor-by-Floor Unit Matrix */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          Loading project inventory...
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(floorGroups).map(([floorName, items]) => {
            const floorBooked = items.filter((i) => i.status === 'Booked').length;
            const floorKhali = items.filter((i) => i.status === 'Available').length;

            return (
              <div
                key={floorName}
                className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
              >
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-800" />
                    <h2 className="text-sm font-black text-slate-900 uppercase">{floorName}</h2>
                    <span className="text-xs font-semibold text-slate-500">
                      (Total: {items.length})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
                      Khali: {floorKhali}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800">
                      Booked: {floorBooked}
                    </span>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((unit) => {
                    const isBooked = unit.status === 'Booked';
                    return (
                      <div
                        key={unit.id}
                        onClick={() => openUnitModal(unit)}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
                          isBooked
                            ? 'bg-rose-50/70 border-rose-300 hover:border-rose-500'
                            : 'bg-emerald-50/60 border-emerald-300 hover:border-emerald-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-black text-slate-900">
                            {unit.unit_number}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              isBooked
                                ? 'bg-rose-600 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {isBooked ? 'BOOKED' : 'KHALI'}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between text-xs font-bold text-slate-600">
                          <span>{unit.unit_type}</span>
                          <span>{unit.area_sqft} sq.ft</span>
                        </div>

                        <div className="mt-1.5 text-sm font-extrabold text-slate-900">
                          {formatINR(Number(unit.total_price || 0))}
                        </div>

                        {isBooked ? (
                          <div className="mt-3 pt-2.5 border-t border-rose-200 space-y-1 text-xs">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
                              <User className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                              {unit.customer_name || 'Customer'}
                            </div>
                            {unit.customer_phone && (
                              <div className="text-slate-600 flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-slate-500" />
                                {unit.customer_phone}
                              </div>
                            )}
                            <div className="text-[11px] font-bold text-emerald-800">
                              Paid: {formatINR(Number(unit.amount_received || 0))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 pt-2.5 border-t border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
                            <span>Click to Book Unit</span>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Payment Receipts Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase">
              Customer Payment Receipts ({selectedProject})
            </h3>
            <p className="text-xs text-slate-500">
              All installment &amp; booking receipts recorded against Flats, Shops &amp; Offices
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Register
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Unit No</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {projectReceipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No customer receipts recorded yet. Click &quot;+ Record Customer Receipt&quot; above to add one.
                  </td>
                </tr>
              ) : (
                projectReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-800">{r.receipt_no}</td>
                    <td className="py-3 px-4 text-slate-600">{r.receipt_date}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">{r.unit_number}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{r.customer_name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {r.payment_mode} {r.transaction_ref ? `(${r.transaction_ref})` : ''}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700">
                      {formatINR(Number(r.amount_received || 0))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unit Booking / Edit Modal */}
      {activeUnit && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase">
                  {activeUnit.project_name} • {activeUnit.floor_no}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Unit {activeUnit.unit_number} ({activeUnit.unit_type})
                </h3>
              </div>
              <button
                onClick={() => setActiveUnit(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBooking} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Booking Date
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                {activeUnit.status === 'Booked' && (
                  <button
                    type="button"
                    onClick={handleCancelBooking}
                    className="px-3.5 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg hover:bg-rose-100 cursor-pointer"
                  >
                    Cancel Booking
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingBooking}
                  className="ml-auto px-5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-lg shadow cursor-pointer"
                >
                  {savingBooking ? 'Saving...' : 'Confirm & Save Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Customer Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                Record Customer Payment Receipt
              </h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordReceipt} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Unit No *</label>
                <select
                  value={recUnitNo}
                  onChange={(e) => {
                    setRecUnitNo(e.target.value);
                    const found = projectUnits.find((u) => u.unit_number === e.target.value);
                    if (found?.customer_name) setRecCustomerName(found.customer_name);
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                >
                  {projectUnits.map((u) => (
                    <option key={u.id} value={u.unit_number}>
                      {u.unit_number} ({u.unit_type} - {u.floor_no})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={recCustomerName}
                  onChange={(e) => setRecCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode *</label>
                  <select
                    value={recPaymentMode}
                    onChange={(e) => setRecPaymentMode(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                  >
                    <option value="NEFT / RTGS">NEFT / RTGS</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI / Online">UPI / Online</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500000"
                    value={recAmount}
                    onChange={(e) => setRecAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UTR / Cheque No</label>
                  <input
                    type="text"
                    placeholder="Optional ref no"
                    value={recRefNo}
                    onChange={(e) => setRecRefNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Date</label>
                  <input
                    type="date"
                    value={recDate}
                    onChange={(e) => setRecDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow cursor-pointer"
                >
                  Save Customer Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Flat / Shop / Office Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                Add New Flat / Shop / Office
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUnit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Floor *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4th Floor"
                    value={newFloor}
                    onChange={(e) => setNewFloor(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 401 or G-04"
                    value={newUnitNo}
                    onChange={(e) => setNewUnitNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type *</label>
                  <select
                    value={newUnitType}
                    onChange={(e) => setNewUnitType(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                  >
                    <option value="Flat">Flat</option>
                    <option value="Shop">Shop</option>
                    <option value="Office">Office</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Area (Sq.Ft)</label>
                  <input
                    type="number"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-lg shadow cursor-pointer"
                >
                  + Save Unit to Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}