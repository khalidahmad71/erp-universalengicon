'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Home, ArrowLeft, Plus, Building2, CheckCircle2, 
  Sparkles, FileText, UserCheck, IndianRupee 
} from 'lucide-react';

interface Project {
  id: number;
  name: string;
}

interface REUnit {
  id: number;
  project_id: number;
  tower_name: string;
  floor_no: number;
  unit_number: string;
  unit_type: string;
  area_sqft: number;
  base_rate_sqft: number;
  total_agreement_value: number;
  status: 'AVAILABLE' | 'BLOCKED' | 'SOLD';
  customer_name?: string;
  customer_phone?: string;
  booking_amount_paid: number;
  total_demanded_amount: number;
}

interface CLPTrigger {
  id: number;
  milestone_name: string;
  wbs_zone: string;
  dpr_reference: string;
  is_billed_to_customers: boolean;
  triggered_at: string;
}

interface DemandLetter {
  id: number;
  demand_letter_no: string;
  unit_number: string;
  customer_name: string;
  milestone_name: string;
  demand_percent: number;
  base_demand_amount: number;
  gst_amount: number;
  total_payable: number;
  payment_status: string;
  due_date: string;
}

export default function EnterpriseRealEstateCRM() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'MATRIX' | 'DEMANDS'>('MATRIX');

  const [units, setUnits] = useState<REUnit[]>([]);
  const [clpTriggers, setClpTriggers] = useState<CLPTrigger[]>([]);
  const [demands, setDemands] = useState<DemandLetter[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Unit Form States
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [towerName, setTowerName] = useState('Tower A');
  const [floorNo, setFloorNo] = useState('5');
  const [unitNo, setUnitNo] = useState('');
  const [unitType, setUnitType] = useState('3BHK FLAT');
  const [areaSqft, setAreaSqft] = useState('2400');
  const [rateSqft, setRateSqft] = useState('5500');
  const [savingUnit, setSavingUnit] = useState(false);

  // Unit Booking Modal States
  const [bookingUnit, setBookingUnit] = useState<REUnit | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [bookingAdvance, setBookingAdvance] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [generatingDemands, setGeneratingDemands] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadRealEstateData(selectedProjectId);
    }
  }, [selectedProjectId]);

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('id, name').order('id');
    if (data && data.length > 0) {
      setProjects(data);
      setSelectedProjectId(data[0].id);
    } else {
      setLoading(false);
    }
  }

  async function loadRealEstateData(projectId: number) {
    setLoading(true);
    const [unitRes, trigRes, demRes] = await Promise.all([
      supabase.from('enterprise_re_units').select('*').eq('project_id', projectId).order('floor_no', { ascending: false }).order('unit_number'),
      supabase.from('enterprise_clp_triggers').select('*').eq('project_id', projectId).eq('is_billed_to_customers', false).order('id', { ascending: false }),
      supabase.from('enterprise_re_demands').select('*').eq('project_id', projectId).order('id', { ascending: false })
    ]);

    if (unitRes.data) setUnits(unitRes.data);
    if (trigRes.data) setClpTriggers(trigRes.data);
    if (demRes.data) setDemands(demRes.data);
    setLoading(false);
  }

  async function handleAddInventoryUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !unitNo || !areaSqft || !rateSqft) return;

    setSavingUnit(true);
    const { error } = await supabase.from('enterprise_re_units').insert({
      project_id: selectedProjectId,
      tower_name: towerName,
      floor_no: Number(floorNo),
      unit_number: unitNo.toUpperCase(),
      unit_type: unitType,
      area_sqft: Number(areaSqft),
      base_rate_sqft: Number(rateSqft),
      status: 'AVAILABLE'
    });

    if (!error) {
      setUnitNo('');
      setShowAddUnit(false);
      await loadRealEstateData(selectedProjectId);
    } else {
      alert('Unit Error: ' + error.message);
    }
    setSavingUnit(false);
  }

  async function handleConfirmBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !bookingUnit || !custName) return;

    setBookingLoading(true);
    const advanceAmt = Number(bookingAdvance) || 0;

    const { error } = await supabase
      .from('enterprise_re_units')
      .update({
        status: 'SOLD',
        customer_name: custName,
        customer_phone: custPhone,
        booking_amount_paid: advanceAmt,
        total_demanded_amount: advanceAmt,
        booked_at: new Date().toISOString()
      })
      .eq('id', bookingUnit.id);

    if (!error) {
      await supabase.from('enterprise_audit_logs').insert({
        module_name: 'REAL_ESTATE_SALES',
        action_type: 'UNIT_BOOKED',
        document_number: bookingUnit.unit_number,
        new_values: { customer: custName, value: bookingUnit.total_agreement_value, advance: advanceAmt }
      });

      setBookingUnit(null);
      setCustName('');
      setCustPhone('');
      setBookingAdvance('');
      await loadRealEstateData(selectedProjectId);
    } else {
      alert('Booking Error: ' + error.message);
    }
    setBookingLoading(false);
  }

  // Auto-Generate CLP Demand Letters for all SOLD units from Site DPR Milestone
  async function handleBatchGenerateCLPDemands(trigger: CLPTrigger) {
    if (!selectedProjectId) return;
    const soldUnits = units.filter((u) => u.status === 'SOLD');

    if (soldUnits.length === 0) {
      alert('Is project mein abhi koi SOLD unit nahi hai jisko demand bheji ja sake.');
      return;
    }

    setGeneratingDemands(true);
    const demandPct = 10; // Standard 10% Construction-Linked Milestone Slab
    const newDemands = soldUnits.map((u, idx) => {
      const baseAmt = (Number(u.total_agreement_value) * demandPct) / 100;
      const gstRate = u.unit_type.includes('FLAT') ? 0.05 : 0.12; // 5% Residential, 12% Commercial
      const gstAmt = baseAmt * gstRate;
      const totalPayable = baseAmt + gstAmt;

      return {
        demand_letter_no: `UEPL/DEM/26-27/${String(demands.length + idx + 701).padStart(4, '0')}`,
        project_id: selectedProjectId,
        unit_id: u.id,
        unit_number: u.unit_number,
        customer_name: u.customer_name || 'Valued Buyer',
        milestone_name: `${trigger.milestone_name} (${trigger.wbs_zone})`,
        demand_percent: demandPct,
        base_demand_amount: baseAmt,
        gst_amount: gstAmt,
        total_payable: totalPayable,
        payment_status: 'UNPAID'
      };
    });

    const { error } = await supabase.from('enterprise_re_demands').insert(newDemands);

    if (!error) {
      // Mark DPR trigger as billed
      await supabase
        .from('enterprise_clp_triggers')
        .update({ is_billed_to_customers: true })
        .eq('id', trigger.id);

      // Update demanded total on each unit
      for (const u of soldUnits) {
        const baseAmt = (Number(u.total_agreement_value) * demandPct) / 100;
        const gstRate = u.unit_type.includes('FLAT') ? 0.05 : 0.12;
        await supabase
          .from('enterprise_re_units')
          .update({ total_demanded_amount: Number(u.total_demanded_amount || 0) + baseAmt * (1 + gstRate) })
          .eq('id', u.id);
      }

      await loadRealEstateData(selectedProjectId);
      setActiveTab('DEMANDS');
    } else {
      alert('Demand Generation Error: ' + error.message);
    }
    setGeneratingDemands(false);
  }

  async function markDemandPaid(demand: DemandLetter) {
    const { error } = await supabase
      .from('enterprise_re_demands')
      .update({ payment_status: 'PAID' })
      .eq('id', demand.id);

    if (!error && selectedProjectId) {
      await loadRealEstateData(selectedProjectId);
    }
  }

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const soldCount = units.filter((u) => u.status === 'SOLD').length;
  const totalSalesValue = units.filter((u) => u.status === 'SOLD').reduce((s, u) => s + Number(u.total_agreement_value || 0), 0);
  const totalCollected = units.reduce((s, u) => s + Number(u.booking_amount_paid || 0), 0) +
    demands.filter((d) => d.payment_status === 'PAID').reduce((s, d) => s + Number(d.total_payable || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to MD Command Center
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Home className="w-6 h-6 text-rose-600" /> Real Estate Unit Matrix, CRM & CLP Billing
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Project:</label>
          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Live DPR -> CLP Milestone Trigger Alert Banner */}
      {clpTriggers.length > 0 && (
        <div className="bg-rose-900 text-white p-4 rounded-xl shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Site DPR Milestone Achieved ({clpTriggers[0].dpr_reference})
              </span>
              <div className="font-bold text-base">
                {clpTriggers[0].milestone_name} — {clpTriggers[0].wbs_zone}
              </div>
              <p className="text-xs text-rose-200">
                Site team ne yeh stage complete mark kar diya hai. Sabhi {soldCount} booked customers ke CLP Demand Letters generate karein.
              </p>
            </div>
          </div>
          <button
            disabled={generatingDemands}
            onClick={() => handleBatchGenerateCLPDemands(clpTriggers[0])}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg shrink-0"
          >
            {generatingDemands ? 'Generating...' : `Generate ${soldCount} Customer Demand Letters (10% CLP)`}
          </button>
        </div>
      )}

      {/* Sales & Collection KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Inventory Occupancy</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">{soldCount} / {units.length} Units Sold</div>
          <span className="text-xs text-emerald-600 font-medium">{units.length - soldCount} Units Available for Booking</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Booked Sales Value</span>
          <div className="mt-2 text-2xl font-bold text-rose-700">{formatINR(totalSalesValue)}</div>
          <span className="text-xs text-slate-500">Flats + Commercial Shops + Offices</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <span className="text-xs font-semibold text-emerald-800 uppercase">Total Customer Collections</span>
          <div className="mt-2 text-2xl font-bold text-emerald-700">{formatINR(totalCollected)}</div>
          <span className="text-xs text-emerald-700 font-medium">Booking Advances + Realized CLP Demands</span>
        </div>
      </div>

      {/* Tabs & Add Unit Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('MATRIX')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
              activeTab === 'MATRIX' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-rose-400" /> 1. Interactive Inventory Matrix ({units.length})
          </button>
          <button
            onClick={() => setActiveTab('DEMANDS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
              activeTab === 'DEMANDS' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" /> 2. Customer CLP Demand Letters ({demands.length})
          </button>
        </div>

        <button
          onClick={() => setShowAddUnit(!showAddUnit)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg"
        >
          <Plus className="w-4 h-4" /> Add Flat / Shop / Office
        </button>
      </div>

      {/* Add Inventory Unit Form */}
      {showAddUnit && (
        <form onSubmit={handleAddInventoryUnit} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="font-bold text-sm text-slate-800">Add New Saleable Inventory Unit</div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tower / Block</label>
              <input type="text" value={towerName} onChange={(e) => setTowerName(e.target.value)} className="w-full border border-slate-300 rounded-md px-2.5 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Floor No.</label>
              <input type="number" value={floorNo} onChange={(e) => setFloorNo(e.target.value)} className="w-full border border-slate-300 rounded-md px-2.5 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Unit No.*</label>
              <input type="text" required placeholder="e.g., A-501" value={unitNo} onChange={(e) => setUnitNo(e.target.value)} className="w-full border border-slate-300 rounded-md px-2.5 py-2 text-sm uppercase font-bold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select value={unitType} onChange={(e) => setUnitType(e.target.value)} className="w-full border border-slate-300 rounded-md px-2.5 py-2 text-sm">
                <option value="3BHK FLAT">3BHK Flat (2400 Sqft)</option>
                <option value="2BHK FLAT">2BHK Flat</option>
                <option value="COMMERCIAL SHOP">Commercial Shop</option>
                <option value="OFFICE SPACE">Office Space</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Super Area (Sqft)*</label>
              <input type="number" required value={areaSqft} onChange={(e) => setAreaSqft(e.target.value)} className="w-full border border-slate-300 rounded-md px-2.5 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Rate / Sqft (₹)*</label>
              <input type="number" required value={rateSqft} onChange={(e) => setRateSqft(e.target.value)} className="w-full border border-slate-300 rounded-md px-2.5 py-2 text-sm font-semibold" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={savingUnit} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg">
              {savingUnit ? 'Adding...' : 'Save Unit to Matrix'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 1: INTERACTIVE UNIT MATRIX */}
      {activeTab === 'MATRIX' && (
        <div className="space-y-6">
          {/* Booking Modal Drawer */}
          {bookingUnit && (
            <form onSubmit={handleConfirmBooking} className="bg-amber-50 border-2 border-amber-400 p-5 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-700" />
                  Book Unit {bookingUnit.unit_number} ({bookingUnit.unit_type} • {bookingUnit.area_sqft} Sqft — {formatINR(bookingUnit.total_agreement_value)})
                </span>
                <button type="button" onClick={() => setBookingUnit(null)} className="text-xs font-bold text-slate-600 hover:underline">
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Applicant / Buyer Full Name*</label>
                  <input type="text" required placeholder="Customer Name" value={custName} onChange={(e) => setCustName(e.target.value)} className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                  <input type="text" placeholder="+91 98XXXXXXXX" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Booking Token / Advance Received (₹)*</label>
                  <input type="number" required placeholder="e.g., 500000" value={bookingAdvance} onChange={(e) => setBookingAdvance(e.target.value)} className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm font-bold" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={bookingLoading} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg">
                  {bookingLoading ? 'Confirming...' : 'Confirm Allotment & Lock Unit'}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading Real Estate Unit Matrix...</div>
          ) : units.length === 0 ? (
            <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-sm text-slate-500">
              Is project mein abhi koi Flat/Shop add nahi hai. Upar <strong>"Add Flat / Shop / Office"</strong> button se inventory banayein.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {units.map((u) => (
                <div
                  key={u.id}
                  onClick={() => u.status === 'AVAILABLE' && setBookingUnit(u)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    u.status === 'AVAILABLE'
                      ? 'bg-white border-emerald-200 hover:border-emerald-500 cursor-pointer shadow-sm'
                      : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">{u.tower_name} • Floor {u.floor_no}</span>
                      <div className="text-lg font-bold text-slate-900">{u.unit_number}</div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>

                  <div className="mt-2 text-xs font-semibold text-slate-600">
                    {u.unit_type} • {u.area_sqft} Sqft
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {formatINR(u.total_agreement_value)}
                  </div>

                  {u.status === 'SOLD' ? (
                    <div className="mt-3 pt-2.5 border-t border-rose-200 text-xs">
                      <div className="font-bold text-slate-800 truncate">{u.customer_name}</div>
                      <div className="text-emerald-700 font-semibold mt-0.5">
                        Paid: {formatINR(u.booking_amount_paid)}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-bold text-emerald-700">
                      Click to Book Unit →
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CUSTOMER CLP DEMAND LETTERS */}
      {activeTab === 'DEMANDS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-3 bg-slate-900 text-white text-sm font-semibold">
            Construction-Linked Plan (CLP) Customer Demand Ledger
          </div>
          <div className="overflow-x-auto">
            {demands.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Abhi tak koi CLP Demand Letter generate nahi hua hai. Jab Site DPR mein milestone achieve hoga, demand letters yahan dikhenge.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                    <th className="py-3 px-4">Demand No.</th>
                    <th className="py-3 px-4">Unit & Buyer</th>
                    <th className="py-3 px-4">Construction Milestone</th>
                    <th className="py-3 px-4">Base + GST</th>
                    <th className="py-3 px-4">Total Payable</th>
                    <th className="py-3 px-4 text-right">Collection Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {demands.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{d.demand_letter_no}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-rose-700">{d.unit_number}</div>
                        <div className="text-xs font-medium text-slate-700">{d.customer_name}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-700">{d.milestone_name} ({d.demand_percent}%)</td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {formatINR(d.base_demand_amount)} + {formatINR(d.gst_amount)} GST
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{formatINR(d.total_payable)}</td>
                      <td className="py-3 px-4 text-right">
                        {d.payment_status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                            <CheckCircle2 className="w-3.5 h-3.5" /> REALIZED
                          </span>
                        ) : (
                          <button
                            onClick={() => markDemandPaid(d)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-semibold rounded"
                          >
                            <IndianRupee className="w-3 h-3" /> Record Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}