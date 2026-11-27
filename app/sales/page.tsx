'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
  Building2,
} from 'lucide-react';

type ShareOwner = 'BUILDER' | 'LANDOWNER';
type OwnershipMode = 'JDA_SHARE' | 'SELF_PURCHASE';

interface RealEstateUnit {
  id: string;
  project_id?: string | null;
  project_name: string;
  floor_no: string;
  unit_number: string;
  unit_type: 'Flat' | 'Shop' | 'Office' | string;
  share_owner?: ShareOwner | string | null;
  area_sqft: number;
  total_price: number;
  status: 'Available' | 'Booked' | 'Hold' | string;
  customer_name?: string | null;
  customer_phone?: string | null;
  booking_date?: string | null;
  amount_received?: number;
  balance_amount?: number;
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

interface DraftGeneratedUnit {
  key: string;
  floorNo: number;
  floorLabel: string;
  unitNumber: string;
  shareOwner: ShareOwner;
  unitType: 'Flat' | 'Shop' | 'Office';
  areaSqft: number;
  totalPrice: number;
}

function getOrdinalFloorLabel(floorNum: number): string {
  const mod100 = floorNum % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${floorNum}th Floor`;
  switch (floorNum % 10) {
    case 1:
      return `${floorNum}st Floor`;
    case 2:
      return `${floorNum}nd Floor`;
    case 3:
      return `${floorNum}rd Floor`;
    default:
      return `${floorNum}th Floor`;
  }
}

function parseFloorNumbers(input: string, maxFloors: number): number[] {
  const nums = input
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= maxFloors);
  return Array.from(new Set(nums)).sort((a, b) => a - b);
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
  const [shareFilter, setShareFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeUnit, setActiveUnit] = useState<RealEstateUnit | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingBooking, setSavingBooking] = useState(false);

  // Dynamic Project + Floor/Unit Setup States
  const [newProject, setNewProject] = useState('');
  const [ownershipMode, setOwnershipMode] = useState<OwnershipMode>('JDA_SHARE');
  const [totalFloorsInput, setTotalFloorsInput] = useState('10');
  const [unitsPerFloorInput, setUnitsPerFloorInput] = useState('4');
  const [builderFloorsInput, setBuilderFloorsInput] = useState('1, 3, 5, 7, 9');
  const [landownerFloorsInput, setLandownerFloorsInput] = useState('2, 4, 6, 8, 10');
  const [newUnitType, setNewUnitType] = useState<'Flat' | 'Shop' | 'Office'>('Flat');
  const [newArea, setNewArea] = useState('1200');
  const [newPrice, setNewPrice] = useState('5500000');
  const [draftUnits, setDraftUnits] = useState<DraftGeneratedUnit[]>([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateFloorsAndUnits = () => {
    const floors = Math.max(1, Math.min(60, Math.floor(Number(totalFloorsInput) || 1)));
    const perFloor = Math.max(1, Math.min(30, Math.floor(Number(unitsPerFloorInput) || 1)));
    const areaNum = Math.max(0, Number(newArea) || 0);
    const priceNum = Math.max(0, Number(newPrice) || 0);

    const builderSet = new Set<number>(
      ownershipMode === 'SELF_PURCHASE'
        ? Array.from({ length: floors }, (_, i) => i + 1)
        : parseFloorNumbers(builderFloorsInput, floors)
    );

    const landownerSet = new Set<number>(
      ownershipMode === 'SELF_PURCHASE'
        ? []
        : parseFloorNumbers(landownerFloorsInput, floors)
    );

    const generated: DraftGeneratedUnit[] = [];
    for (let f = 1; f <= floors; f++) {
      const shareOwner: ShareOwner =
        ownershipMode === 'SELF_PURCHASE'
          ? 'BUILDER'
          : landownerSet.has(f) && !builderSet.has(f)
          ? 'LANDOWNER'
          : 'BUILDER';

      const floorLabel = getOrdinalFloorLabel(f);
      for (let u = 1; u <= perFloor; u++) {
        const unitNumber = `${f}${String(u).padStart(2, '0')}`;
        generated.push({
          key: `${f}-${u}`,
          floorNo: f,
          floorLabel,
          unitNumber,
          shareOwner,
          unitType: newUnitType,
          areaSqft: areaNum,
          totalPrice: priceNum,
        });
      }
    }

    setDraftUnits(generated);
  };

  useEffect(() => {
    if (activeView === 'new' && draftUnits.length === 0) {
      handleGenerateFloorsAndUnits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  const handleOwnershipModeSwitch = (mode: OwnershipMode) => {
    setOwnershipMode(mode);
    const floors = Math.max(1, Math.min(60, Math.floor(Number(totalFloorsInput) || 10)));
    if (mode === 'SELF_PURCHASE') {
      setBuilderFloorsInput(Array.from({ length: floors }, (_, i) => i + 1).join(', '));
      setLandownerFloorsInput('');
    } else {
      const odd: number[] = [];
      const even: number[] = [];
      for (let f = 1; f <= floors; f++) {
        if (f % 2 === 1) odd.push(f);
        else even.push(f);
      }
      setBuilderFloorsInput(odd.join(', '));
      setLandownerFloorsInput(even.join(', '));
    }
  };

  const updateDraftUnit = (
    key: string,
    patch: Partial<Pick<DraftGeneratedUnit, 'shareOwner' | 'unitType' | 'areaSqft' | 'totalPrice' | 'unitNumber'>>
  ) => {
    setDraftUnits((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

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

    const builderUnits = projectUnits.filter((u) => (u.share_owner || 'BUILDER') === 'BUILDER').length;
    const landownerUnits = projectUnits.filter((u) => u.share_owner === 'LANDOWNER').length;

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
      builderUnits,
      landownerUnits,
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
      const normalizedShare = (u.share_owner || 'BUILDER').toUpperCase();
      const matchType = typeFilter === 'ALL' || u.unit_type === typeFilter;
      const matchShare = shareFilter === 'ALL' || normalizedShare === shareFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      const matchSearch =
        !q ||
        u.unit_number.toLowerCase().includes(q) ||
        (u.customer_name || '').toLowerCase().includes(q) ||
        u.floor_no.toLowerCase().includes(q);
      return matchType && matchShare && matchStatus && matchSearch;
    });

    const groups: Record<string, RealEstateUnit[]> = {};
    filtered.forEach((u) => {
      if (!groups[u.floor_no]) groups[u.floor_no] = [];
      groups[u.floor_no].push(u);
    });
    return groups;
  }, [projectUnits, typeFilter, shareFilter, statusFilter, searchQuery]);

  const openUnitModal = (unit: RealEstateUnit) => {
    setActiveUnit(unit);
    setCustomerName(unit.customer_name || '');
    setCustomerPhone(unit.customer_phone || '');
    setAmountReceived('');
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
      })
      .eq('id', activeUnit.id);

    if (error) {
      setSavingBooking(false);
      alert('Booking error: ' + error.message);
      return;
    }

    if (paidAmt > 0) {
      const { data: authData } = await supabase.auth.getUser();
      const { error: rpcError } = await supabase.rpc('post_customer_payment', {
        p_project_id: activeUnit.project_id ?? null,
        p_unit_id: activeUnit.id,
        p_customer_name: customerName.trim(),
        p_amount: paidAmt,
        p_payment_mode: 'Booking Advance',
        p_reference_no: null,
        p_payment_date: bookingDate,
        p_user_id: authData?.user?.id ?? null,
      });

      if (rpcError) {
        setSavingBooking(false);
        alert('Payment posting error: ' + rpcError.message);
        return;
      }
    }

    setSavingBooking(false);
    setActiveUnit(null);
    await fetchAllData();
  };

  const handleCancelBooking = async () => {
    if (!activeUnit) return;
    if (!confirm(`Cancel booking for Unit ${activeUnit.unit_number} and mark Vacant?`)) return;

    const { error } = await supabase
      .from('real_estate_units')
      .update({
        status: 'Available',
        customer_name: null,
        customer_phone: null,
        booking_date: null,
        amount_received: 0,
        balance_amount: Number(activeUnit.total_price || 0),
      })
      .eq('id', activeUnit.id);

    if (error) {
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
    }

    setActiveUnit(null);
    await fetchAllData();
  };

  const handleSaveGeneratedBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanProjectName = newProject.trim();
    if (!cleanProjectName) {
      alert('Please enter Project Name.');
      return;
    }
    if (draftUnits.length === 0) {
      alert('Please click "Open Floors & Units" first.');
      return;
    }

    setSavingNewUnit(true);

    // 1. Register project in projects master if not present
    try {
      await supabase.from('projects').insert([
        {
          name: cleanProjectName,
          site_name: cleanProjectName,
          status: 'ACTIVE',
        },
      ]);
    } catch {}

    // 2. Build full payload with share_owner + balance_amount
    const fullRows = draftUnits.map((u) => ({
      project_name: cleanProjectName,
      floor_no: u.floorLabel,
      unit_number: u.unitNumber.trim(),
      unit_type: u.unitType,
      share_owner: u.shareOwner,
      area_sqft: Number(u.areaSqft || 0),
      total_price: Number(u.totalPrice || 0),
      status: 'Available',
      amount_received: 0,
      balance_amount: Number(u.totalPrice || 0),
    }));

    let { error } = await supabase.from('real_estate_units').insert(fullRows);

    // Fallback if optional columns (balance_amount / share_owner) haven't been added to Supabase yet
    if (error && (error.message.includes('balance_amount') || error.message.includes('share_owner'))) {
      const baseRows = draftUnits.map((u) => ({
        project_name: cleanProjectName,
        floor_no: u.floorLabel,
        unit_number: u.unitNumber.trim(),
        unit_type: u.unitType,
        area_sqft: Number(u.areaSqft || 0),
        total_price: Number(u.totalPrice || 0),
        status: 'Available',
        amount_received: 0,
      }));
      const retry = await supabase.from('real_estate_units').insert(baseRows);
      error = retry.error;
    }

    setSavingNewUnit(false);
    if (error) {
      alert('Error saving project units: ' + error.message);
    } else {
      setSelectedProject(cleanProjectName);
      setDraftUnits([]);
      await fetchAllData();
      router.push('/sales?view=inventory');
    }
  };

  const handleRecordReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(recAmount || 0);
    if (amt <= 0) return;

    const matchedUnit = projectUnits.find((u) => u.unit_number === recUnitNo);
    if (!matchedUnit) {
      alert('Please select a valid unit for this project.');
      return;
    }

    setSavingReceipt(true);

    const { data: authData } = await supabase.auth.getUser();
    const { error } = await supabase.rpc('post_customer_payment', {
      p_project_id: matchedUnit.project_id ?? null,
      p_unit_id: matchedUnit.id,
      p_customer_name: (matchedUnit.customer_name || recCustomerName).trim(),
      p_amount: amt,
      p_payment_mode: recPaymentMode,
      p_reference_no: recRefNo.trim() || null,
      p_payment_date: recDate,
      p_user_id: authData?.user?.id ?? null,
    });

    setSavingReceipt(false);

    if (error) {
      alert('Receipt Error: ' + error.message);
      return;
    }

    setRecAmount('');
    setRecRefNo('');
    await fetchAllData();
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
              {activeView === 'new' && 'New Project Setup — Floors, Builder/Landowner Share & Units'}
              {activeView === 'receipts' && 'Customer Payment Receipts & Register'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {activeView !== 'new' && (
              <button
                type="button"
                onClick={() => router.push('/sales?view=new')}
                className="px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                + New Project / Floors
              </button>
            )}
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
                  <span>JDA / Share Split</span>
                  <Building2 className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-lg font-extrabold text-slate-900 mt-2">
                  Builder: {stats.builderUnits}
                </div>
                <div className="mt-2.5 text-xs font-semibold text-sky-700">
                  Landowner: {stats.landownerUnits} Units
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Flats (Residential)</span>
                  <Home className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mt-2">
                  {stats.flatsBooked}{' '}
                  <span className="text-sm font-medium text-slate-400">/ {stats.flatsTotal}</span>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  {stats.flatsTotal - stats.flatsBooked} Available
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Commercial (Shop/Office)</span>
                  <Store className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mt-2">
                  {stats.shopsBooked + stats.officesBooked}{' '}
                  <span className="text-sm font-medium text-slate-400">
                    / {stats.shopsTotal + stats.officesTotal}
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  Shops: {stats.shopsTotal} • Offices: {stats.officesTotal}
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
                  value={shareFilter}
                  onChange={(e) => setShareFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                >
                  <option value="ALL">All Shares (Builder &amp; Landowner)</option>
                  <option value="BUILDER">Builder Share Only</option>
                  <option value="LANDOWNER">Landowner Share Only</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                >
                  <option value="ALL">All Types (Flat/Shop/Office)</option>
                  <option value="Flat">Flats (Residential)</option>
                  <option value="Shop">Shops (Commercial)</option>
                  <option value="Office">Offices (Commercial)</option>
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
                  + Record New Project / Open Floors
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(floorGroups).map(([floorName, items]) => {
                  const floorBooked = items.filter((i) => i.status === 'Booked').length;
                  const floorKhali = items.filter((i) => i.status === 'Available').length;
                  const floorOwner = (items[0]?.share_owner || 'BUILDER').toUpperCase();

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
                            <div className="flex items-center gap-2">
                              <h2 className="text-sm font-extrabold text-slate-900">{floorName}</h2>
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                  floorOwner === 'LANDOWNER'
                                    ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                                }`}
                              >
                                {floorOwner} SHARE
                              </span>
                            </div>
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
                          const paidPct =
                            totalVal > 0 ? Math.min(100, Math.round((paidVal / totalVal) * 100)) : 0;
                          const unitShare = (unit.share_owner || 'BUILDER').toUpperCase();

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

                                  <div className="flex flex-col items-end gap-1">
                                    <span
                                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md ${
                                        isBooked
                                          ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      }`}
                                    >
                                      {isBooked ? 'Booked' : 'Available'}
                                    </span>
                                    <span
                                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                        unitShare === 'LANDOWNER'
                                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                                      }`}
                                    >
                                      {unitShare}
                                    </span>
                                  </div>
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
          <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Add New Project &amp; Open Floors / Units (JDA or Self Purchase)
                </h2>
                <p className="text-xs text-slate-500">
                  Building ke floors (5, 10, 15+), Builder vs Landowner share floors, aur Residential/Commercial units open karke data feed karein.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveGeneratedBuilding} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Project / Building Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sahar Apartment / Godrej Zen Estate Phase-2"
                    value={newProject}
                    onChange={(e) => setNewProject(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Land / Development Model *
                  </label>
                  <select
                    value={ownershipMode}
                    onChange={(e) => handleOwnershipModeSwitch(e.target.value as OwnershipMode)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
                  >
                    <option value="JDA_SHARE">JDA (Builder + Landowner Share)</option>
                    <option value="SELF_PURCHASE">Self Purchase (100% Builder)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Total Floors (5 / 10 / 15+) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={totalFloorsInput}
                    onChange={(e) => setTotalFloorsInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Units Per Floor *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={unitsPerFloorInput}
                    onChange={(e) => setUnitsPerFloorInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Builder Share Floors
                  </label>
                  <input
                    type="text"
                    disabled={ownershipMode === 'SELF_PURCHASE'}
                    placeholder="e.g. 1, 3, 5, 7, 9"
                    value={builderFloorsInput}
                    onChange={(e) => setBuilderFloorsInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Landowner Share Floors
                  </label>
                  <input
                    type="text"
                    disabled={ownershipMode === 'SELF_PURCHASE'}
                    placeholder="e.g. 2, 4, 6, 8, 10"
                    value={landownerFloorsInput}
                    onChange={(e) => setLandownerFloorsInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Default Property Type
                  </label>
                  <select
                    value={newUnitType}
                    onChange={(e) => setNewUnitType(e.target.value as 'Flat' | 'Shop' | 'Office')}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                  >
                    <option value="Flat">Flat (Residential)</option>
                    <option value="Shop">Shop (Commercial)</option>
                    <option value="Office">Office (Commercial)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Default Area (Sq.Ft)
                  </label>
                  <input
                    type="number"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Default Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleGenerateFloorsAndUnits}
                    className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                  >
                    Open Floors &amp; Units ({Number(totalFloorsInput || 0) * Number(unitsPerFloorInput || 0)})
                  </button>
                </div>
              </div>

              {draftUnits.length > 0 && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-900">
                      Opened Units Matrix ({draftUnits.length} Units) — Feed / Edit Per Unit Before Saving
                    </span>
                    <span className="text-[11px] font-bold text-slate-600">
                      Builder: {draftUnits.filter((d) => d.shareOwner === 'BUILDER').length} • Landowner:{' '}
                      {draftUnits.filter((d) => d.shareOwner === 'LANDOWNER').length}
                    </span>
                  </div>

                  <div className="max-h-96 overflow-y-auto overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100 text-slate-600 uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Floor</th>
                          <th className="py-2.5 px-3">Unit No</th>
                          <th className="py-2.5 px-3">Share Owner</th>
                          <th className="py-2.5 px-3">Type (Res/Comm)</th>
                          <th className="py-2.5 px-3">Area (Sq.Ft)</th>
                          <th className="py-2.5 px-3">Price (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {draftUnits.map((u) => (
                          <tr key={u.key} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-700">{u.floorLabel}</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={u.unitNumber}
                                onChange={(e) => updateDraftUnit(u.key, { unitNumber: e.target.value })}
                                className="w-24 px-2 py-1 border border-slate-300 rounded font-bold text-slate-900"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={u.shareOwner}
                                onChange={(e) =>
                                  updateDraftUnit(u.key, { shareOwner: e.target.value as ShareOwner })
                                }
                                className={`px-2 py-1 border rounded font-bold ${
                                  u.shareOwner === 'LANDOWNER'
                                    ? 'bg-sky-50 border-sky-300 text-sky-800'
                                    : 'bg-amber-50 border-amber-300 text-amber-900'
                                }`}
                              >
                                <option value="BUILDER">BUILDER</option>
                                <option value="LANDOWNER">LANDOWNER</option>
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={u.unitType}
                                onChange={(e) =>
                                  updateDraftUnit(u.key, {
                                    unitType: e.target.value as 'Flat' | 'Shop' | 'Office',
                                  })
                                }
                                className="px-2 py-1 border border-slate-300 rounded font-semibold text-slate-800"
                              >
                                <option value="Flat">Flat (Residential)</option>
                                <option value="Shop">Shop (Commercial)</option>
                                <option value="Office">Office (Commercial)</option>
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                value={u.areaSqft}
                                onChange={(e) =>
                                  updateDraftUnit(u.key, { areaSqft: Number(e.target.value || 0) })
                                }
                                className="w-24 px-2 py-1 border border-slate-300 rounded text-slate-800"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                value={u.totalPrice}
                                onChange={(e) =>
                                  updateDraftUnit(u.key, { totalPrice: Number(e.target.value || 0) })
                                }
                                className="w-32 px-2 py-1 border border-slate-300 rounded font-bold text-slate-900"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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
                  {savingNewUnit
                    ? 'Saving Building & Units...'
                    : `Save All ${draftUnits.length} Units & Open Inventory`}
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
                        {u.unit_number} ({u.unit_type} • {(u.share_owner || 'BUILDER')})
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
                  {activeUnit.project_name} • {activeUnit.floor_no} • {(activeUnit.share_owner || 'BUILDER')} SHARE
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