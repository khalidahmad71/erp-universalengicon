'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Building2,
  Home,
  Store,
  Briefcase,
  Plus,
  Phone,
  User,
  IndianRupee,
  X,
  Receipt,
  Printer,
  Layers,
  Search,
  ArrowUpRight,
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
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'RECEIPTS'>('INVENTORY');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
      balanceReceivable: Math.max(0, totalRevenue - totalCollected),
    };
  }, [projectUnits]);

  const floorGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = projectUnits.filter((u) => {
      const matchType = typeFilter === 'ALL' || u.unit_type === typeFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      const matchSearch =
        !q ||
        u.unit_number.toLowerCase().includes(q) ||
        (u.customer_name || '').toLowerCase().includes(q) ||
        u.floor_no.toLowerCase().includes(q);
      return matchType && matchStatus && matchSearch;
    });

    const groups: Record<string, RealEstateUnit[]> = {};
    filtered.forEach((u) => {
      if (!groups[u.floor_no]) groups[u.floor_no] = [];
      groups[u.floor_no].push(u);
    });
    return groups;
  }, [projectUnits, typeFilter, statusFilter, searchQuery]);

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
    if (!confirm(`Cancel booking for Unit ${activeUnit.unit_number} and mark Vacant?`)) return;

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
    <div className="min-h-screen bg-slate-50/70 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Corporate Command Header */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-blue-700" />
              Real Estate Sales &amp; CRM
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Property Inventory &amp; Customer Ledger
            </h1>
            <p className="text-xs text-slate-500">
              Manage floor-wise unit bookings, availability status, and installment payment receipts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative min-w-[230px]">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none transition-colors"
              >
                {projectsList.map((proj) => (
                  <option key={proj} value={proj}>
                    {proj}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setNewProject(selectedProject);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Unit
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
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              Record Receipt
            </button>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total Inventory</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{stats.total} Units</div>
            <div className="mt-3 flex items-center gap-3 text-xs font-semibold">
              <span className="text-emerald-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {stats.available} Vacant
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-rose-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {stats.booked} Booked
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Residential Flats</span>
              <Home className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              {stats.flatsBooked} <span className="text-sm font-medium text-slate-400">/ {stats.flatsTotal}</span>
            </div>
            <div className="mt-3 text-xs font-medium text-slate-500">
              {stats.flatsTotal - stats.flatsBooked} flats available for sale
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Commercial Shops</span>
              <Store className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              {stats.shopsBooked} <span className="text-sm font-medium text-slate-400">/ {stats.shopsTotal}</span>
            </div>
            <div className="mt-3 text-xs font-medium text-slate-500">
              {stats.shopsTotal - stats.shopsBooked} shops available for sale
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Corporate Offices</span>
              <Briefcase className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              {stats.officesBooked} <span className="text-sm font-medium text-slate-400">/ {stats.officesTotal}</span>
            </div>
            <div className="mt-3 text-xs font-medium text-slate-500">
              {stats.officesTotal - stats.officesBooked} offices available for sale
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Booked Value &amp; Paid</span>
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg font-extrabold text-slate-900 mt-2 truncate">
              {formatINR(stats.totalRevenue)}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-700">
                Paid: {formatINR(stats.totalCollected)}
              </span>
            </div>
          </div>
        </div>

        {/* Clean Segmented Tabs (Separates Inventory from Payment Receipts) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="inline-flex p-1 bg-slate-200/70 rounded-xl">
            <button
              onClick={() => setActiveTab('INVENTORY')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'INVENTORY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Floor-Wise Unit Matrix ({projectUnits.length})
            </button>
            <button
              onClick={() => setActiveTab('RECEIPTS')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'RECEIPTS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customer Payment Receipts ({projectReceipts.length})
            </button>
          </div>

          {activeTab === 'INVENTORY' && (
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search unit or client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="Flat">Flats Only</option>
                <option value="Shop">Shops Only</option>
                <option value="Office">Offices Only</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="Available">Vacant (Khali)</option>
                <option value="Booked">Booked Only</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: FLOOR-WISE INVENTORY MATRIX */}
        {activeTab === 'INVENTORY' && (
          <>
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-500">
                Loading project floor matrix...
              </div>
            ) : Object.keys(floorGroups).length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
                <p className="text-sm font-bold text-slate-800">No units match your filter</p>
                <p className="text-xs text-slate-500">
                  Clear search filters or click &quot;Add Unit&quot; to add new Flats, Shops, or Offices.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(floorGroups).map(([floorName, items]) => {
                  const floorBooked = items.filter((i) => i.status === 'Booked').length;
                  const floorKhali = items.filter((i) => i.status === 'Available').length;

                  return (
                    <div
                      key={floorName}
                      className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden"
                    >
                      {/* Clean Floor Header */}
                      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
                            {floorName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h2 className="text-sm font-extrabold text-slate-900">{floorName}</h2>
                            <p className="text-[11px] text-slate-500">
                              {items.length} Total Units on this floor
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            {floorKhali} Vacant
                          </span>
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {floorBooked} Booked
                          </span>
                        </div>
                      </div>

                      {/* Clean Architectural Unit Cards */}
                      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {items.map((unit) => {
                          const isBooked = unit.status === 'Booked';
                          const totalVal = Number(unit.total_price || 0);
                          const paidVal = Number(unit.amount_received || 0);
                          const paidPct = totalVal > 0 ? Math.min(100, Math.round((paidVal / totalVal) * 100)) : 0;

                          return (
                            <div
                              key={unit.id}
                              onClick={() => openUnitModal(unit)}
                              className="group relative bg-white border border-slate-200 hover:border-blue-600 rounded-xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between"
                            >
                              {/* Top Status Accent Bar */}
                              <div
                                className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
                                  isBooked ? 'bg-slate-800' : 'bg-emerald-500'
                                }`}
                              />

                              <div>
                                <div className="flex items-start justify-between pt-1">
                                  <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                      {unit.unit_type} • {unit.area_sqft} sq.ft
                                    </span>
                                    <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                                      {unit.unit_number}
                                    </h3>
                                  </div>

                                  <span
                                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md ${
                                      isBooked
                                        ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}
                                  >
                                    {isBooked ? 'Booked' : 'Vacant'}
                                  </span>
                                </div>

                                <div className="mt-2 text-sm font-bold text-slate-800">
                                  {formatINR(totalVal)}
                                </div>
                              </div>

                              {isBooked ? (
                                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      {unit.customer_name || 'Client'}
                                    </span>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                                  </div>

                                  {unit.customer_phone && (
                                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      {unit.customer_phone}
                                    </div>
                                  )}

                                  {/* Payment Progress Bar */}
                                  <div className="pt-1">
                                    <div className="flex justify-between text-[11px] font-semibold mb-1">
                                      <span className="text-emerald-700">Paid: {formatINR(paidVal)}</span>
                                      <span className="text-slate-400">{paidPct}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-emerald-600 rounded-full"
                                        style={{ width: `${paidPct}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700 group-hover:translate-x-0.5 transition-transform">
                                  <span>Book this unit</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
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
          </>
        )}

        {/* TAB 2: CUSTOMER PAYMENT RECEIPTS LEDGER */}
        {activeTab === 'RECEIPTS' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Customer Payment Receipts — {selectedProject}
                </h3>
                <p className="text-xs text-slate-500">
                  Official installment &amp; booking receipts register
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Register
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-5">Receipt No</th>
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5">Unit No</th>
                    <th className="py-3.5 px-5">Customer Name</th>
                    <th className="py-3.5 px-5">Payment Mode &amp; Ref</th>
                    <th className="py-3.5 px-5 text-right">Amount Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No payment receipts recorded for {selectedProject} yet. Click &quot;Record Receipt&quot; at the top right.
                      </td>
                    </tr>
                  ) : (
                    projectReceipts.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-blue-700">{r.receipt_no}</td>
                        <td className="py-3.5 px-5 text-slate-600">{r.receipt_date}</td>
                        <td className="py-3.5 px-5">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 font-bold text-slate-800">
                            {r.unit_number}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-bold text-slate-900">{r.customer_name}</td>
                        <td className="py-3.5 px-5 text-slate-600">
                          {r.payment_mode} {r.transaction_ref ? `• ${r.transaction_ref}` : ''}
                        </td>
                        <td className="py-3.5 px-5 text-right font-extrabold text-emerald-700">
                          {formatINR(Number(r.amount_received || 0))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Unit Booking / Edit Modal */}
      {activeUnit && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  {activeUnit.project_name} • {activeUnit.floor_no}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
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

            <form onSubmit={handleSaveBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter client full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter 10-digit mobile number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                {activeUnit.status === 'Booked' && (
                  <button
                    type="button"
                    onClick={handleCancelBooking}
                    className="px-3.5 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl hover:bg-rose-100 cursor-pointer"
                  >
                    Release Unit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingBooking}
                  className="ml-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  {savingBooking ? 'Saving...' : 'Save Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Customer Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                Record Payment Receipt
              </h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordReceipt} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Unit *</label>
                <select
                  value={recUnitNo}
                  onChange={(e) => {
                    setRecUnitNo(e.target.value);
                    const found = projectUnits.find((u) => u.unit_number === e.target.value);
                    if (found?.customer_name) setRecCustomerName(found.customer_name);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                >
                  {projectUnits.map((u) => (
                    <option key={u.id} value={u.unit_number}>
                      {u.unit_number} ({u.unit_type} • {u.floor_no})
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode *</label>
                  <select
                    value={recPaymentMode}
                    onChange={(e) => setRecPaymentMode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
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
                    placeholder="500000"
                    value={recAmount}
                    onChange={(e) => setRecAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UTR / Cheque No</label>
                  <input
                    type="text"
                    placeholder="Reference ID"
                    value={recRefNo}
                    onChange={(e) => setRecRefNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Date</label>
                  <input
                    type="date"
                    value={recDate}
                    onChange={(e) => setRecDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  Save Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Flat / Shop / Office Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                Add Property Unit
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUnit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 401"
                    value={newUnitNo}
                    onChange={(e) => setNewUnitNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type *</label>
                  <select
                    value={newUnitType}
                    onChange={(e) => setNewUnitType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  Save Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}