'use client';

import React, { useEffect, useState } from 'react';
import { HardHat, PlusCircle, CheckCircle2, Calculator } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getClientErpRole } from '@/lib/erp-session';
import type { ErpRole } from '@/lib/rbac';

export default function MbBillsPage() {
  const [role, setRole] = useState<ErpRole | null>(null);
  const [raNumber, setRaNumber] = useState<string>('');
  const [contractorName, setContractorName] = useState<string>('');
  const [workOrderRef, setWorkOrderRef] = useState<string>('');
  const [grossAmount, setGrossAmount] = useState<string>('');
  const [retentionPct, setRetentionPct] = useState<string>('5');
  const [tdsPct, setTdsPct] = useState<string>('2');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateRaNo = () => {
    const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `MB-UEPL-${stamp}-${rand}`;
  };

  useEffect(() => {
    setRole(getClientErpRole());
    setRaNumber(generateRaNo());
  }, []);

  const gross = Number(grossAmount) || 0;
  const retAmt = Number(((gross * (Number(retentionPct) || 0)) / 100).toFixed(2));
  const tdsAmt = Number(((gross * (Number(tdsPct) || 0)) / 100).toFixed(2));
  const netPayable = Math.max(0, Number((gross - retAmt - tdsAmt).toFixed(2)));

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);

  const handleRaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    setErrorMsg(null);

    if (gross <= 0) {
      setErrorMsg('Please enter a valid gross bill amount greater than 0.');
      setSubmitting(false);
      return;
    }

    try {
      try {
        await supabase.from('erp_audit_logs').insert([
          {
            action: 'MB_RA_BILL_SUBMITTED',
            module: 'MB_CONTRACTOR_BILLING',
            performed_by: `Role: ${role ?? 'Unauthenticated'}`,
            role_used: role ?? 'SITE_ENGINEER',
            details: `${raNumber} | Contractor: ${contractorName || 'N/A'} | WO: ${workOrderRef || 'N/A'} | Gross: ₹${gross} | Retention: ₹${retAmt} | TDS: ₹${tdsAmt} | Net: ₹${netPayable} | ${remarks || 'MB verified'}`,
          },
        ]);
      } catch {
        // Non-blocking audit log insert
      }

      setStatusMsg(
        `Bill ${raNumber} recorded — Net Payable: ${formatINR(netPayable)} (Retention: ${formatINR(retAmt)}, TDS: ${formatINR(tdsAmt)}).`
      );
      setContractorName('');
      setWorkOrderRef('');
      setGrossAmount('');
      setRemarks('');
      setRaNumber(generateRaNo());
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not record bill.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
            <HardHat className="w-4 h-4" />
            Measurement Book & Sub-Contractor Billing
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            MB & Contractor RA Billing — UNIVERSAL ENGICON PVT. LTD.
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Active Role:{' '}
            <span className="font-semibold text-amber-300">
              {role ?? 'Not Authenticated'}
            </span>
          </p>
        </div>

        <form
          onSubmit={handleRaSubmit}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
            New Measurement Book / RA Bill Entry
          </h2>

          {statusMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/70 border border-emerald-700 text-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/70 border border-red-700 text-red-200 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                MB / RA Bill Number
              </label>
              <input
                type="text"
                required
                value={raNumber}
                onChange={(e) => setRaNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Contractor Name
              </label>
              <input
                type="text"
                required
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                placeholder="Sub-contractor / agency name"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Work Order / BOQ Ref
              </label>
              <input
                type="text"
                value={workOrderRef}
                onChange={(e) => setWorkOrderRef(e.target.value)}
                placeholder="WO-UEPL-..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Gross Bill Amount (₹)
              </label>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={grossAmount}
                onChange={(e) => setGrossAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Retention Deduction (%)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                value={retentionPct}
                onChange={(e) => setRetentionPct(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                TDS Deduction (%)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                value={tdsPct}
                onChange={(e) => setTdsPct(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
              Measurement Book (MB) / Site Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="MB page no., certified work milestone"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-slate-400 uppercase font-bold">Gross RA</div>
              <div className="text-base font-extrabold text-white mt-0.5">
                {formatINR(gross)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 uppercase font-bold">
                Retention ({retentionPct || 0}%)
              </div>
              <div className="text-base font-extrabold text-amber-300 mt-0.5">
                -{formatINR(retAmt)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 uppercase font-bold">
                TDS ({tdsPct || 0}%)
              </div>
              <div className="text-base font-extrabold text-amber-300 mt-0.5">
                -{formatINR(tdsAmt)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 uppercase font-bold flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                Net Payable
              </div>
              <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                {formatINR(netPayable)}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm shadow-lg transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            {submitting ? 'Submitting Bill...' : 'Submit MB / RA Bill'}
          </button>
        </form>
      </div>
    </div>
  );
}