'use client';

import React, { useEffect, useState } from 'react';
import {
  Building,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Landmark,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getClientErpRole } from '@/lib/erp-session';
import type { ErpRole } from '@/lib/rbac';

interface BankAccountItem {
  id: string;
  bankName: string;
  accountNo: string;
  branch: string;
  accountType: 'Current' | 'OD / CC' | 'Escrow';
  openingBalance: number;
}

interface BankTxnRow {
  id: string | number;
  voucher_no?: string;
  entry_type?: string;
  account_head?: string;
  party_name?: string;
  total_amount?: number;
  base_amount?: number;
  description?: string;
  created_at?: string;
}

const DEFAULT_BANK_ACCOUNTS: BankAccountItem[] = [
  {
    id: 'hdfc-main',
    bankName: 'HDFC Bank Ltd.',
    accountNo: 'XXXX-XXXX-4821',
    branch: 'Patna Main / Fraser Road',
    accountType: 'Current',
    openingBalance: 1250000,
  },
  {
    id: 'icici-cc',
    bankName: 'ICICI Bank Ltd.',
    accountNo: 'XXXX-XXXX-9104',
    branch: 'Commercial / Infra OD',
    accountType: 'OD / CC',
    openingBalance: 2500000,
  },
  {
    id: 'sbi-escrow',
    bankName: 'State Bank of India',
    accountNo: 'XXXX-XXXX-3379',
    branch: 'RERA / Project Escrow',
    accountType: 'Escrow',
    openingBalance: 850000,
  },
];

export default function BankModulePage() {
  const [role, setRole] = useState<ErpRole | null>(null);
  const [accounts] = useState<BankAccountItem[]>(DEFAULT_BANK_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(DEFAULT_BANK_ACCOUNTS[0].id);
  const [txns, setTxns] = useState<BankTxnRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [voucherNo, setVoucherNo] = useState<string>('');
  const [txnMode, setTxnMode] = useState<'PAYMENT' | 'RECEIPT'>('PAYMENT');
  const [payInstrument, setPayInstrument] = useState<'NEFT / RTGS' | 'UPI' | 'Cheque'>('NEFT / RTGS');
  const [utrOrChequeNo, setUtrOrChequeNo] = useState<string>('');
  const [partyName, setPartyName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const generateBankVoucherNo = () => {
    const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `BNK-UEPL-${stamp}-${rand}`;
  };

  const loadBankTxns = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('finance_ledger')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setErrorMsg(error.message);
        setTxns([]);
      } else if (Array.isArray(data)) {
        setTxns(data as BankTxnRow[]);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load bank transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRole(getClientErpRole());
    setVoucherNo(generateBankVoucherNo());
    loadBankTxns();
  }, []);

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);

  const handleBankEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    setErrorMsg(null);

    const amtNum = Number(amount);
    if (!Number.isFinite(amtNum) || amtNum <= 0) {
      setErrorMsg('Please enter a valid bank transaction amount greater than 0.');
      setSubmitting(false);
      return;
    }

    const activeAcc = accounts.find((a) => a.id === selectedAccountId) ?? accounts[0];
    const ledgerType = txnMode === 'RECEIPT' ? 'CREDIT' : 'DEBIT';
    const refText = utrOrChequeNo.trim() ? `${payInstrument}: ${utrOrChequeNo.trim()}` : payInstrument;
    const fullNote = `${activeAcc.bankName} (${activeAcc.accountNo}) | ${refText} | ${remarks.trim() || 'Bank entry'}`;

    try {
      const { error } = await supabase.from('finance_ledger').insert([
        {
          voucher_no: voucherNo,
          entry_type: ledgerType,
          account_head: `Bank (${activeAcc.bankName})`,
          party_name: partyName.trim() || activeAcc.bankName,
          base_amount: amtNum,
          gst_amount: 0,
          total_amount: amtNum,
          description: fullNote,
        },
      ]);

      if (error) {
        setErrorMsg(`Ledger entry failed: ${error.message}`);
        setSubmitting(false);
        return;
      }

      try {
        await supabase.from('erp_audit_logs').insert([
          {
            action: `BANK_${txnMode}_RECORDED`,
            module: 'BANK_TREASURY',
            performed_by: `Role: ${role ?? 'Unauthenticated'}`,
            role_used: role ?? 'ACCOUNTANT',
            details: `${voucherNo} | ${txnMode} | ${formatINR(amtNum)} | ${fullNote}`,
          },
        ]);
      } catch {
        // Non-blocking audit log insert
      }

      setStatusMsg(`${txnMode} voucher ${voucherNo} (${formatINR(amtNum)}) recorded on ${activeAcc.bankName}.`);
      setPartyName('');
      setUtrOrChequeNo('');
      setAmount('');
      setRemarks('');
      setVoucherNo(generateBankVoucherNo());
      await loadBankTxns();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not save bank entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalOpeningBalance = accounts.reduce((sum, a) => sum + a.openingBalance, 0);
  const totalCredits = txns
    .filter((t) => (t.entry_type ?? '').toUpperCase() === 'CREDIT')
    .reduce((sum, t) => sum + Number(t.total_amount ?? t.base_amount ?? 0), 0);
  const totalDebits = txns
    .filter((t) => (t.entry_type ?? '').toUpperCase() === 'DEBIT')
    .reduce((sum, t) => sum + Number(t.total_amount ?? t.base_amount ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
              <Building className="w-4 h-4" />
              Treasury, NEFT / RTGS / Cheque & Bank Reconciliation
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
              Bank & Treasury Module — UNIVERSAL ENGICON PVT. LTD.
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Active Role:{' '}
              <span className="font-semibold text-amber-300">
                {role ?? 'Not Authenticated'}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={loadBankTxns}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold uppercase tracking-wider transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Entries
          </button>
        </div>

        {/* Bank Accounts Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-amber-400">
              <span>Total Opening Pool</span>
              <Landmark className="w-4 h-4" />
            </div>
            <div className="text-xl font-extrabold text-white mt-2">
              {formatINR(totalOpeningBalance)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {accounts.length} configured corporate accounts
            </div>
          </div>

          {accounts.map((acc) => (
            <div
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={`cursor-pointer rounded-xl p-5 border transition-all shadow-lg ${
                selectedAccountId === acc.id
                  ? 'bg-slate-900 border-amber-400 ring-1 ring-amber-400/50'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>{acc.bankName}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px] uppercase">
                  {acc.accountType}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1">{acc.accountNo}</div>
              <div className="text-lg font-extrabold text-white mt-2">
                {formatINR(acc.openingBalance)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{acc.branch}</div>
            </div>
          ))}
        </div>

        {/* Bank Payment / Receipt Form */}
        <form
          onSubmit={handleBankEntry}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
              Record Bank Payment / Receipt Voucher
            </h2>
            <div className="text-xs text-slate-400">
              Ledger Credits: <span className="text-emerald-400 font-bold">{formatINR(totalCredits)}</span> • Ledger Debits:{' '}
              <span className="text-red-400 font-bold">{formatINR(totalDebits)}</span>
            </div>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Voucher No.
              </label>
              <input
                type="text"
                required
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Bank Account
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bankName} ({acc.accountNo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Transaction Type
              </label>
              <select
                value={txnMode}
                onChange={(e) => setTxnMode(e.target.value as 'PAYMENT' | 'RECEIPT')}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="PAYMENT">Bank Payment (Outflow / Debit)</option>
                <option value="RECEIPT">Bank Receipt (Inflow / Credit)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Mode
              </label>
              <select
                value={payInstrument}
                onChange={(e) =>
                  setPayInstrument(e.target.value as 'NEFT / RTGS' | 'UPI' | 'Cheque')
                }
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="NEFT / RTGS">NEFT / RTGS</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Beneficiary / Payer Name
              </label>
              <input
                type="text"
                required
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder="Vendor, contractor, or client"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                UTR / Cheque / Ref No.
              </label>
              <input
                type="text"
                value={utrOrChequeNo}
                onChange={(e) => setUtrOrChequeNo(e.target.value)}
                placeholder="UTR or 6-digit cheque no."
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Amount (₹)
              </label>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Remarks / Bill Ref
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="PO / RA bill / receipt ref"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm shadow-lg transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            {submitting ? 'Saving Bank Entry...' : `Record Bank ${txnMode}`}
          </button>
        </form>

        {/* Recent Ledger / Bank Entries */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
              Recent Ledger & Bank Vouchers ({txns.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <th className="py-3 px-4">Voucher</th>
                  <th className="py-3 px-4">Flow</th>
                  <th className="py-3 px-4">Party / Head</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {txns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      {loading ? 'Loading bank entries...' : 'No ledger entries available yet.'}
                    </td>
                  </tr>
                ) : (
                  txns.map((row) => {
                    const isCredit = (row.entry_type ?? '').toUpperCase() === 'CREDIT';
                    return (
                      <tr key={String(row.id)} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-white">
                          {row.voucher_no ?? `#${row.id}`}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
                              isCredit
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-red-500/15 text-red-300'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                            {row.entry_type ?? 'ENTRY'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{row.party_name ?? '-'}</div>
                          <div className="text-slate-400">{row.account_head ?? ''}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{row.description ?? '-'}</td>
                        <td className="py-3 px-4 text-right font-bold text-white">
                          {formatINR(Number(row.total_amount ?? row.base_amount ?? 0))}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}