'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  FileSpreadsheet,
  CheckCircle2,
  Printer,
  Calculator,
  Layers,
  ClipboardCheck,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ProjectOption {
  id: string;
  name: string;
}

interface BoqOrDprSource {
  id: string;
  sourceType: 'DPR' | 'BOQ';
  projectName: string;
  itemCode: string;
  workDescription: string;
  unit: string;
  executedQty: number;
  rate: number;
  dateOrTag: string;
}

interface ContractorRaBill {
  id: string;
  ra_bill_no: string;
  project_name: string;
  contractor_name: string;
  boq_item_code?: string | null;
  work_description: string;
  unit: string;
  previous_qty: number;
  current_qty: number;
  cumulative_qty: number;
  boq_rate: number;
  gross_amount: number;
  retention_percent: number;
  retention_amount: number;
  tds_percent: number;
  tds_amount: number;
  gst_percent: number;
  gst_amount: number;
  net_payable: number;
  bill_date: string;
  status: string;
}

const DEFAULT_PROJECTS = [
  'Godrej Zen Estate Phase-2',
  'Patna Civil & Infra Site',
  'Kolkata Commercial Hub',
  'Lucknow Infrastructure Project',
  'Noida Corporate Tower',
];

function getCookieValue(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : '';
}

export default function ContractorRaBillsPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [sources, setSources] = useState<BoqOrDprSource[]>([]);
  const [bills, setBills] = useState<ContractorRaBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const [currentUser, setCurrentUser] = useState<string>('MD / Billing Engineer');

  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [raBillNo, setRaBillNo] = useState<string>(
    `RA-UE-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [billDate, setBillDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [projectName, setProjectName] = useState<string>('Godrej Zen Estate Phase-2');
  const [contractorName, setContractorName] = useState<string>('');
  const [contractorPan, setContractorPan] = useState<string>('');
  const [boqItemCode, setBoqItemCode] = useState<string>('');
  const [workDescription, setWorkDescription] = useState<string>('');
  const [unit, setUnit] = useState<string>('Cum');
  const [previousQty, setPreviousQty] = useState<string>('0');
  const [currentQty, setCurrentQty] = useState<string>('');
  const [boqRate, setBoqRate] = useState<string>('');
  const [retentionPercent, setRetentionPercent] = useState<string>('5');
  const [tdsPercent, setTdsPercent] = useState<string>('2');
  const [gstPercent, setGstPercent] = useState<string>('18');

  const fetchAllData = async () => {
    setLoading(true);

    const [projRes, dprRes, boqRes, boqItemsRes, billsRes] = await Promise.all([
      supabase.from('projects').select('id, name, project_name'),
      supabase.from('dpr').select('*').order('created_at', { ascending: false }),
      supabase.from('boq').select('*').order('created_at', { ascending: false }),
      supabase.from('boq_items').select('*').order('created_at', { ascending: false }),
      supabase
        .from('contractor_ra_bills')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    const projList: ProjectOption[] = [];
    if (!projRes.error && projRes.data) {
      projRes.data.forEach((p: any) => {
        const label = p.name || p.project_name;
        if (label) projList.push({ id: String(p.id), name: label });
      });
    }
    DEFAULT_PROJECTS.forEach((dp) => {
      if (!projList.some((p) => p.name.toLowerCase() === dp.toLowerCase())) {
        projList.push({ id: '', name: dp });
      }
    });
    setProjects(projList);

    const combinedSources: BoqOrDprSource[] = [];

    if (!dprRes.error && dprRes.data) {
      dprRes.data.forEach((row: any) => {
        const desc =
          row.work_description ||
          row.activity_name ||
          row.description ||
          row.task_name ||
          'DPR Executed Activity';
        const qty = Number(
          row.achieved_qty ?? row.executed_qty ?? row.quantity ?? row.qty ?? 0
        );
        combinedSources.push({
          id: `DPR-${row.id}`,
          sourceType: 'DPR',
          projectName: row.project_name || row.site_name || 'Godrej Zen Estate Phase-2',
          itemCode: row.boq_code || row.item_code || `DPR-${row.id}`,
          workDescription: desc,
          unit: row.unit || 'Cum',
          executedQty: qty,
          rate: Number(row.rate ?? row.boq_rate ?? 0),
          dateOrTag: row.report_date || row.dpr_date || 'DPR Entry',
        });
      });
    }

    const rawBoqRows = [
      ...(!boqItemsRes.error && boqItemsRes.data ? boqItemsRes.data : []),
      ...(!boqRes.error && boqRes.data ? boqRes.data : []),
    ];

    rawBoqRows.forEach((row: any) => {
      const desc =
        row.item_description ||
        row.description ||
        row.work_name ||
        row.item_name ||
        'BOQ Schedule Item';
      combinedSources.push({
        id: `BOQ-${row.id}`,
        sourceType: 'BOQ',
        projectName: row.project_name || row.site_name || 'Godrej Zen Estate Phase-2',
        itemCode: row.item_code || row.boq_code || `BOQ-${row.id}`,
        workDescription: desc,
        unit: row.unit || 'Cum',
        executedQty: Number(row.quantity ?? row.est_qty ?? 0),
        rate: Number(row.rate ?? row.unit_rate ?? 0),
        dateOrTag: 'BOQ Master',
      });
    });

    setSources(combinedSources);

    if (!billsRes.error && billsRes.data) {
      setBills(billsRes.data);
    }

    setLoading(false);
  };

  useEffect(() => {
    const role = getCookieValue('ue_role');
    const email = getCookieValue('ue_session');
    if (role || email) {
      setCurrentUser(`${role || 'Staff'}${email ? ` (${email})` : ''}`);
    }
    fetchAllData();
  }, []);

  const handleSelectSource = (srcId: string) => {
    setSelectedSourceId(srcId);
    const chosen = sources.find((s) => s.id === srcId);
    if (!chosen) return;

    if (chosen.projectName) setProjectName(chosen.projectName);
    setBoqItemCode(chosen.itemCode);
    setWorkDescription(chosen.workDescription);
    setUnit(chosen.unit || 'Cum');
    if (chosen.executedQty > 0) setCurrentQty(String(chosen.executedQty));
    if (chosen.rate > 0) setBoqRate(String(chosen.rate));

    // Calculate previous billed quantity for same project + work description
    const priorBilled = bills
      .filter(
        (b) =>
          b.project_name.toLowerCase() === chosen.projectName.toLowerCase() &&
          b.work_description.toLowerCase() === chosen.workDescription.toLowerCase()
      )
      .reduce((acc, b) => acc + Number(b.current_qty || 0), 0);

    setPreviousQty(String(priorBilled));
  };

  const prevQtyNum = Number(previousQty || 0);
  const currQtyNum = Number(currentQty || 0);
  const cumQtyNum = prevQtyNum + currQtyNum;
  const rateNum = Number(boqRate || 0);
  const retPct = Number(retentionPercent || 0);
  const tdsPct = Number(tdsPercent || 0);
  const gstPct = Number(gstPercent || 0);

  const grossAmount = Math.round(currQtyNum * rateNum * 100) / 100;
  const retentionAmount = Math.round(((grossAmount * retPct) / 100) * 100) / 100;
  const tdsAmount = Math.round(((grossAmount * tdsPct) / 100) * 100) / 100;
  const gstAmount = Math.round(((grossAmount * gstPct) / 100) * 100) / 100;
  const netPayable =
    Math.round((grossAmount + gstAmount - retentionAmount - tdsAmount) * 100) / 100;

  const handlePostRaBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !contractorName.trim() || !workDescription.trim() || currQtyNum <= 0 || rateNum <= 0) {
      alert('Please fill Project, Sub-Contractor Name, Work Description, Current Qty, and BOQ Rate.');
      return;
    }

    setPosting(true);
    const matchedProj = projects.find(
      (p) => p.name.toLowerCase() === projectName.trim().toLowerCase()
    );
    const projectUuid = matchedProj && matchedProj.id ? matchedProj.id : null;

    const { error } = await supabase.rpc('post_contractor_ra_bill', {
      p_ra_bill_no: raBillNo.trim(),
      p_project_id: projectUuid,
      p_project_name: projectName.trim(),
      p_contractor_name: contractorName.trim(),
      p_contractor_pan: contractorPan.trim().toUpperCase() || null,
      p_boq_item_code: boqItemCode.trim() || null,
      p_work_description: workDescription.trim(),
      p_unit: unit.trim() || 'Cum',
      p_previous_qty: prevQtyNum,
      p_current_qty: currQtyNum,
      p_boq_rate: rateNum,
      p_retention_percent: retPct,
      p_tds_percent: tdsPct,
      p_gst_percent: gstPct,
      p_bill_date: billDate,
      p_created_by: currentUser,
    });

    setPosting(false);

    if (error) {
      alert('RA Bill Posting Error: ' + error.message);
      return;
    }

    setRaBillNo(`RA-UE-${Math.floor(100000 + Math.random() * 900000)}`);
    setSelectedSourceId('');
    setContractorName('');
    setContractorPan('');
    setBoqItemCode('');
    setWorkDescription('');
    setPreviousQty('0');
    setCurrentQty('');
    setBoqRate('');
    await fetchAllData();
  };

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);

  return (
    <div className="min-h-screen bg-slate-50/70 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Universal Engicon Pvt. Ltd. • Site Execution &amp; Billing
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Measurement Book &amp; Contractor RA Bills
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              DPR &amp; BOQ Linked Measurement → Retention, TDS (194C) &amp; GST → Atomic Double-Entry Ledger
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print MB &amp; RA Register
          </button>
        </div>

        {/* RA Bill Preparation & Statutory Calculation Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Calculator className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-extrabold text-slate-900">
              Prepare &amp; Post Sub-Contractor RA Bill
            </h2>
          </div>

          <form onSubmit={handlePostRaBill} className="space-y-5">
            {/* Row 1: Link from DPR or BOQ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Auto-Load from DPR Execution or BOQ Schedule (Optional)
                </label>
                <select
                  value={selectedSourceId}
                  onChange={(e) => handleSelectSource(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-blue-50/50 border border-blue-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
                >
                  <option value="">
                    {loading
                      ? 'Loading DPR & BOQ items...'
                      : '-- Select DPR Work Output or BOQ Item to Auto-Fill --'}
                  </option>
                  {sources.map((src) => (
                    <option key={src.id} value={src.id}>
                      [{src.sourceType}] {src.projectName} — {src.workDescription} ({src.executedQty} {src.unit} @ ₹{src.rate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project / Site Name *
                </label>
                <select
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                >
                  {projects.map((p, idx) => (
                    <option key={`${p.name}-${idx}`} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: RA Bill No, Date, Contractor, PAN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  RA Bill Number *
                </label>
                <input
                  type="text"
                  required
                  value={raBillNo}
                  onChange={(e) => setRaBillNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bill Date *
                </label>
                <input
                  type="date"
                  required
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sub-Contractor Name *
                </label>
                <input
                  type="text"
                  required
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  placeholder="e.g. Sharma Civil Works"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contractor PAN (for TDS)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={contractorPan}
                  onChange={(e) => setContractorPan(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase"
                />
              </div>
            </div>

            {/* Row 3: BOQ Code, Work Description, Unit */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  BOQ Item Code
                </label>
                <input
                  type="text"
                  value={boqItemCode}
                  onChange={(e) => setBoqItemCode(e.target.value)}
                  placeholder="BOQ-RCC-01"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  BOQ / DPR Work Description *
                </label>
                <input
                  type="text"
                  required
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="e.g. M25 Grade RCC Column & Slab Concreting"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unit *
                </label>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Cum / Sqm / MT"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Row 4: Measurement Quantities & Deductions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Prev. Billed Qty
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={previousQty}
                  onChange={(e) => setPreviousQty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Current Bill Qty *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={currentQty}
                  onChange={(e) => setCurrentQty(e.target.value)}
                  placeholder="120"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Cumulative Qty
                </label>
                <input
                  type="text"
                  readOnly
                  value={cumQtyNum.toFixed(2)}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-blue-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  BOQ Rate (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={boqRate}
                  onChange={(e) => setBoqRate(e.target.value)}
                  placeholder="1450"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Retention (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={retentionPercent}
                  onChange={(e) => setRetentionPercent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  TDS 194C (%)
                </label>
                <select
                  value={tdsPercent}
                  onChange={(e) => setTdsPercent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                >
                  <option value="0">0% (Exempt)</option>
                  <option value="1">1% (Individual/HUF)</option>
                  <option value="2">2% (Company/Firm)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  GST (%)
                </label>
                <select
                  value={gstPercent}
                  onChange={(e) => setGstPercent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                >
                  <option value="0">0%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                </select>
              </div>
            </div>

            {/* Live Financial Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Gross Work Value</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatINR(grossAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">+ GST ({gstPct}%)</span>
                  <span className="font-bold text-blue-700 text-sm">
                    +{formatINR(gstAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">- Retention ({retPct}%)</span>
                  <span className="font-bold text-amber-700 text-sm">
                    -{formatINR(retentionAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">- TDS ({tdsPct}%)</span>
                  <span className="font-bold text-rose-700 text-sm">
                    -{formatINR(tdsAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 font-bold block">Net Payable</span>
                  <span className="font-extrabold text-emerald-700 text-base">
                    {formatINR(netPayable)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={posting}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow cursor-pointer shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                {posting ? 'Posting to Ledger...' : 'Approve & Post to Finance Ledger'}
              </button>
            </div>
          </form>
        </div>

        {/* Posted Contractor RA Bills Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Posted Sub-Contractor RA Bills (Synced with Finance Ledger)
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500">{bills.length} Bills</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">RA Bill &amp; Date</th>
                  <th className="py-3.5 px-4">Project &amp; Contractor</th>
                  <th className="py-3.5 px-4">Work &amp; Qty</th>
                  <th className="py-3.5 px-4 text-right">Gross + GST</th>
                  <th className="py-3.5 px-4 text-right">Retention &amp; TDS</th>
                  <th className="py-3.5 px-4 text-right">Net Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No contractor RA bills posted yet.
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-blue-700">{bill.ra_bill_no}</div>
                        <div className="text-[11px] text-slate-500">{bill.bill_date}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{bill.project_name}</div>
                        <div className="text-[11px] text-slate-600">{bill.contractor_name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{bill.work_description}</div>
                        <div className="text-[11px] text-slate-500">
                          Curr: {bill.current_qty} {bill.unit} (Cum: {bill.cumulative_qty}) @ ₹{bill.boq_rate}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-800">
                          {formatINR(Number(bill.gross_amount || 0))}
                        </div>
                        <div className="text-[11px] text-blue-700">
                          +GST: {formatINR(Number(bill.gst_amount || 0))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-[11px]">
                        <div className="text-amber-700 font-semibold">
                          Ret: -{formatINR(Number(bill.retention_amount || 0))}
                        </div>
                        <div className="text-rose-700 font-semibold">
                          TDS: -{formatINR(Number(bill.tds_amount || 0))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">
                        {formatINR(Number(bill.net_payable || 0))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}