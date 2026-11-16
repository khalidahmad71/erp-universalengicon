'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
let supabase: any = null;
try { if (supabaseUrl && supabaseKey) { supabase = createClient(supabaseUrl, supabaseKey); } } catch (e) {}

const initialStaffPayroll = [
  { id: 1, employee_name: 'Er. Rakesh Ranjan', designation: 'Senior Site Engineer', department: 'Construction', monthly_salary: 65000, advance_taken: 10000, net_payable: 55000, payment_status: 'Disbursed' },
  { id: 2, employee_name: 'Amit Kumar', designation: 'Billing & Quantity Surveyor', department: 'Accounts', monthly_salary: 45000, advance_taken: 5000, net_payable: 40000, payment_status: 'Disbursed' },
  { id: 3, employee_name: 'Suresh Prasad', designation: 'Store In-Charge', department: 'Warehouse', monthly_salary: 30000, advance_taken: 0, net_payable: 30000, payment_status: 'Pending Disbursement' },
  { id: 4, employee_name: 'Manish Sharma', designation: 'Junior Site Supervisor', department: 'Construction', monthly_salary: 28000, advance_taken: 4000, net_payable: 24000, payment_status: 'Pending Disbursement' }
];

export default function HRPayrollModule() {
  const [payrollList, setPayrollList] = useState(initialStaffPayroll);
  const [empName, setEmpName] = useState('Rahul Verma');
  const [designation, setDesignation] = useState('Safety Officer');
  const [department, setDepartment] = useState('Safety & QC');
  const [salary, setSalary] = useState<number>(35000);
  const [advance, setAdvance] = useState<number>(5000);
  const [status, setStatus] = useState('Pending Disbursement');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const netPayableAmt = salary - advance;

  const handleAddPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const newRecord = {
      id: payrollList.length + 1,
      employee_name: empName,
      designation: designation,
      department: department,
      monthly_salary: salary,
      advance_taken: advance,
      net_payable: netPayableAmt,
      payment_status: status
    };

    try {
      if (supabase) {
        await supabase.from('corporate_hr_payroll').insert([newRecord]);
      }
      setPayrollList([newRecord, ...payrollList]);
      setSuccessMsg('Employee payroll record added successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const totalPayrollOutflow = payrollList.reduce((acc, p) => acc + p.net_payable, 0);

  return (
    <div className="p-8 pb-20">
      
      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center bg-slate-900 text-white px-6 py-4 rounded-xl shadow-md">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">Universal Engicon ERP</span>
          <h2 className="text-xl font-bold">HR, Staff Payroll & Salary Disbursement</h2>
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

      {/* Summary Stat Card */}
      <div className="max-w-6xl mx-auto bg-teal-900 text-white p-6 rounded-2xl shadow-lg mb-8 flex justify-between items-center">
        <div>
          <span className="text-xs uppercase tracking-widest text-teal-300 font-bold">Monthly HR Outflow</span>
          <h3 className="text-2xl font-black mt-1">Total Net Salary Payable</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-teal-300 uppercase font-bold">Disbursement Sum</p>
          <p className="text-2xl font-black text-emerald-300">₹ {totalPayrollOutflow.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Form & Table Container */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Register Payroll Form */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 h-fit">
          <h3 className="text-lg font-black text-slate-900 mb-4 pb-2 border-b">Add Staff Payroll Record</h3>
          <form onSubmit={handleAddPayroll} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Employee Full Name</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={empName} onChange={(e) => setEmpName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Designation</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={designation} onChange={(e) => setDesignation(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Department</label>
              <select className="w-full p-3 border rounded-lg font-bold bg-white" value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="Construction">Construction</option>
                <option value="Accounts">Accounts</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Safety & QC">Safety & QC</option>
                <option value="Management">Management</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Monthly Salary (₹)</label>
                <input type="number" className="w-full p-3 border rounded-lg font-bold text-blue-900" value={salary} onChange={(e) => setSalary(Number(e.target.value))} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Advance Taken (₹)</label>
                <input type="number" className="w-full p-3 border rounded-lg font-bold text-rose-700" value={advance} onChange={(e) => setAdvance(Number(e.target.value))} required />
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border text-xs font-bold flex justify-between">
              <span>Net Payable Salary:</span>
              <span className="text-emerald-700">₹ {netPayableAmt.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Payment Status</label>
              <select className="w-full p-3 border rounded-lg font-bold bg-white" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Pending Disbursement">Pending Disbursement</option>
                <option value="Disbursed">Disbursed</option>
              </select>
            </div>
            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow transition uppercase tracking-wider text-sm">
              {isSaving ? 'Saving...' : '+ Save Payroll Record'}
            </button>
          </form>
        </div>

        {/* Payroll Master Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 font-bold text-sm uppercase tracking-wider">
            Universal Engicon — Staff Salary & Disbursement Register
          </div>
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-100 text-slate-700 border-b">
              <tr>
                <th className="py-3 px-4">Employee Details</th>
                <th className="py-3 px-4 text-right">Gross (₹)</th>
                <th className="py-3 px-4 text-right text-rose-700">Adv (₹)</th>
                <th className="py-3 px-4 text-right text-emerald-700">Net Pay (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {payrollList.map((p) => (
                <tr key={p.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{p.employee_name}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{p.designation} ({p.department})</span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-700">₹ {p.monthly_salary.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right font-semibold text-rose-700">₹ {p.advance_taken.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right font-black text-emerald-700">₹ {p.net_payable.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.payment_status === 'Disbursed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {p.payment_status}
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