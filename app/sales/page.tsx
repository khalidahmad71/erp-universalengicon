@'
'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  Home,
  Store,
  Briefcase,
  Phone,
  User,
  IndianRupee,
  X,
  Printer,
  Layers,
  Search,
  ArrowUpRight,
  PlusCircle,
  CheckCircle2,
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

function RealEstateSalesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeView = searchParams.get('view') || 'inventory';

  const [units, setUnits] = useState<RealEstateUnit[]>([]);
  const [receipts, setReceipts] = useState<CustomerReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProject, setSelectedProject] = useState<string>('Godrej Zen Estate Phase-2');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeUnit, setActiveUnit] = useState<RealEstateUnit | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingBooking, setSavingBooking] = useState(false);

  const [newProject, setNewProject] = useState('Godrej Zen Estate Phase-2');
  const [newFloor, setNewFloor] = useState('4th Floor');
  const [newUnitNo, setNewUnitNo] = useState('');
  const [newUnitType, setNewUnitType] = useState<'Flat' | 'Shop' | 'Office'>('Flat');
  const [newArea, setNewArea] = useState('1500');
  const [newPrice, setNewPrice] = useState('9800000');
  const [savingNewUnit, setSavingNewUnit] = useState(false);

  const [recUnitNo, setRecUnitNo] = useState('');
  const [recCustomerName, setRecCustomerName] = useState('');
  const [recPaymentMode, setRecPaymentMode] = useState('NEFT / RTGS');
  const [recRefNo, setRecRefNo] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recDate, setRecDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingReceipt, setSavingReceipt] = useState(false);

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
      if (unitsRes.data.length > 0 && !recUnitNo) {
        const firstUnit = unitsRes.data[0];
        setRecUnitNo(firstUnit.unit_number);
        setRecCustomerName(firstUnit.customer_name || '');
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

  const handleAddNewProjectOrUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNewUnit(true);

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

    setSavingNewUnit(false);
    if (error) {
      alert('Error saving project unit: ' + error.message);
    } else {
      setNewUnitNo('');
      setSelectedProject(newProject.trim());
      await fetchAllData();
      router.push('/sales?view=inventory');
    }
  };

  const handleRecordReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(recAmount || 0);
    if (amt <= 0) return;
    setSavingReceipt(true);

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
      setSavingReceipt(false);
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

    setSavingReceipt(false);
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Universal Engicon Pvt. Ltd. • Real Estate Division
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {activeView === 'inventory' && 'Project Available & Booked Inventory'}
              {activeView === 'new' && 'Record New Project & Property Units'}
              {activeView === 'receipts' && 'Customer Payment Receipts & Register'}
            </h1>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-xs font-bold text-slate-500 uppercase hidden sm:block">
              Active Project:
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none min-w-[230px]"
            >
              {projectsList.map((proj) => (
                <option key={proj} value={proj}>
                  {proj}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeView === 'inventory' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Total Inventory</span>
                  <Layers className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mt-2">{stats.total} Units</div>
                <div className="mt-3 flex items-center gap-3 text-xs font-semibold">
                  <span className="text-emerald-700">● {stats.available} Available</span>
                  <span className="text-slate-700">● {stats.booked} Booked</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Flats</span>
                  <Home className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mt-2">
                  {stats.flatsBooked} <span className="text-sm font-medium text-slate-400">/ {stats.flatsTotal}</span>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  {stats.flatsTotal - stats.flatsBooked} Available
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Shops</span>
                  <Store className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mt-2">
                  {stats.shopsBooked} <span className="text-sm font-medium text-slate-400">/ {stats.shopsTotal}</span>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  {stats.shopsTotal - stats.shopsBooked} Available
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Offices</span>
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mt-2">
                  {stats.officesBooked} <span className="text-sm font-medium text-slate-400">/ {stats.officesTotal}</span>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  {stats.officesTotal - stats.officesBooked} Available
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Booked Value</span>
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg font-extrabold text-slate-900 mt-2 truncate">
                  {formatINR(stats.totalRevenue)}
                </div>
                <div className="mt-2.5 text-xs font-semibold text-emerald-700">
                  Received: {formatINR(stats.totalCollected)}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search unit number, floor or client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                >
                  <option value="ALL">All Types (Flat/Shop/Office)</option>
                  <option value="Flat">Flats Only</option>
                  <option value="Shop">Shops Only</option>
                  <option value="Office">Offices Only</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                >
                  <option value="ALL">All Status</option>
                  <option value="Available">Available Only</option>
                  <option value="Booked">Booked Only</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-500">
                Loading project floor inventory...
              </div>
            ) : Object.keys(floorGroups).length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                <p className="text-sm font-bold text-slate-800">No units found in this view</p>
                <button
                  onClick={() => router.push('/sales?view=new')}
                  className="px-4 py-2 bg-blue-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  + Record New Project / Unit
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(floorGroups).map(([floorName, items]) => {
                  const floorBooked = items.filter((i) => i.status === 'Booked').length;
                  const floorKhali = items.filter((i) => i.status === 'Available').length;

                  return (
                    <div
                      key={floorName}
                      className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden"
                    >
                      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
                            {floorName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h2 className="text-sm font-extrabold text-slate-900">{floorName}</h2>
                            <p className="text-[11px] text-slate-500">{items.length} Units</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold">
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {floorKhali} Available
                          </span>
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {floorBooked} Booked
                          </span>
                        </div>
                      </div>

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
                                    <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-700">
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
                                    {isBooked ? 'Booked' : 'Available'}
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
                                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  </div>

                                  {unit.customer_phone && (
                                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      {unit.customer_phone}
                                    </div>
                                  )}

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
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
                                  <span>Click to Book</span>
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

        {activeView === 'new' && (
          <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Add New Project or Property Unit
                </h2>
                <p className="text-xs text-slate-500">
                  Create a new project name or add Flats, Shops, and Offices to an existing floor.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddNewProjectOrUnit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Project Name (Enter new project name or keep existing) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Godrej Zen Estate Phase-2"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Floor Name / Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ground Floor, 1st Floor, 5th Floor"
                    value={newFloor}
                    onChange={(e) => setNewFloor(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Unit Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 501, G-04, OFF-102"
                    value={newUnitNo}
                    onChange={(e) => setNewUnitNo(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Property Type *
                  </label>
                  <select
                    value={newUnitType}
                    onChange={(e) => setNewUnitType(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
                  >
                    <option value="Flat">Flat (Residential)</option>
                    <option value="Shop">Shop (Commercial)</option>
                    <option value="Office">Office (Corporate)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Super Built-up Area (Sq.Ft)
                  </label>
                  <input
                    type="number"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Total Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/sales?view=inventory')}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNewUnit}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {savingNewUnit ? 'Saving...' : 'Save & View in Inventory'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeView === 'receipts' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Issue New Customer Payment Receipt
                  </h2>
                  <p className="text-xs text-slate-500">
                    Recording a receipt automatically updates the unit&apos;s paid balance.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Total Collected: {formatINR(stats.totalCollected)}
                </span>
              </div>

              <form onSubmit={handleRecordReceipt} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Unit No *</label>
                  <select
                    value={recUnitNo}
                    onChange={(e) => {
                      setRecUnitNo(e.target.value);
                      const found = projectUnits.find((u) => u.unit_number === e.target.value);
                      if (found?.customer_name) setRecCustomerName(found.customer_name);
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  >
                    {projectUnits.map((u) => (
                      <option key={u.id} value={u.unit_number}>
                        {u.unit_number} ({u.unit_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Client Name"
                    value={recCustomerName}
                    onChange={(e) => setRecCustomerName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Mode</label>
                  <select
                    value={recPaymentMode}
                    onChange={(e) => setRecPaymentMode(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    <option value="NEFT / RTGS">NEFT / RTGS</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI / Online">UPI / Online</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">UTR / Cheque No</label>
                  <input
                    type="text"
                    placeholder="Optional Ref"
                    value={recRefNo}
                    onChange={(e) => setRecRefNo(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="500000"
                    value={recAmount}
                    onChange={(e) => setRecAmount(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={savingReceipt}
                    className="w-full px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                  >
                    {savingReceipt ? 'Saving...' : '+ Generate Receipt'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Recorded Payment Receipts ({selectedProject})
                </h3>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Register
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3.5 px-5">Receipt No</th>
                      <th className="py-3.5 px-5">Date</th>
                      <th className="py-3.5 px-5">Unit No</th>
                      <th className="py-3.5 px-5">Customer Name</th>
                      <th className="py-3.5 px-5">Mode &amp; Ref</th>
                      <th className="py-3.5 px-5 text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projectReceipts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          No receipts recorded for {selectedProject} yet. Use the form above to generate one.
                        </td>
                      </tr>
                    ) : (
                      projectReceipts.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80">
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
          </div>
        )}
      </div>

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
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
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
    </div>
  );
}

export default function RealEstateSalesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading Real Estate Module...</div>}>
      <RealEstateSalesContent />
    </Suspense>
  );
}
'@ | Set-Content -Path "app\sales\page.tsx" -Encoding UTF8