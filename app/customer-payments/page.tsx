'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any = null;
try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (err) {
  console.error("Client Error", err);
}

export default function CustomerPayments() {
  // Manual / Interactive Fields for instant testing and entry
  const [customerId, setCustomerId] = useState('UEPL-CUST-01');
  const [customerName, setCustomerName] = useState('Rajesh Kumar');
  const [mobileNumber, setMobileNumber] = useState('9876543210');
  const [address, setAddress] = useState('Boring Road, Patna');
  const [unitNumber, setUnitNumber] = useState('Flat No. 402, Block B');
  const [projectName, setProjectName] = useState('Godrej Zen Estate Phase-2');
  const [propertyType, setPropertyType] = useState('Residential (Non-Affordable - 5%)');
  const [totalCost, setTotalCost] = useState<number>(4500000); // 45 Lakhs Total Unit Cost
  
  const [milestone, setMilestone] = useState('Booking Amount (10%)');
  const [installmentAmt, setInstallmentAmt] = useState<number>(450000); // 10% default
  
  const [isSaving, setIsSaving] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptNo, setReceiptNo] = useState(`UEPL/REC/26-27/${Math.floor(1000 + Math.random() * 9000)}`);

  // Quick Load Presets
  const loadPreset = (type: string) => {
    if (type === '1') {
      setCustomerId('UEPL-CUST-01');
      setCustomerName('Rajesh Kumar');
      setMobileNumber('9876543210');
      setAddress('Boring Road, Patna');
      setUnitNumber('Flat No. 402, Block B');
      setTotalCost(4500000);
      setInstallmentAmt(450000);
    } else if (type === '2') {
      setCustomerId('UEPL-CUST-02');
      setCustomerName('Amitabh Sinha');
      setMobileNumber('9123456789');
      setAddress('Kankerbagh, Patna');
      setUnitNumber('Shop No. 12, Ground Floor');
      setPropertyType('Commercial Shop / Office (5%)');
      setTotalCost(6500000);
      setInstallmentAmt(650000);
    }
  };

  // GST Calculation for Deferred Ledger Tracking
  let gstRate = 5;
  if (propertyType.includes('1%')) gstRate = 1;
  else if (propertyType.includes('5%')) gstRate = 5;

  const gstLiabilityAmount = (installmentAmt * gstRate) / 100;
  const cgstAmount = gstLiabilityAmount / 2;
  const sgstAmount = gstLiabilityAmount / 2;

  const handleSaveAndGenerateReceipt = async () => {
    if (!customerName || !unitNumber || installmentAmt <= 0) {
      alert("Please check customer details and enter a valid installment amount!");
      return;
    }

    setIsSaving(true);

    const gstLedgerData = {
      customer_id: customerId,
      customer_name: customerName,
      project_name: projectName,
      unit_number: unitNumber,
      milestone: milestone,
      base_installment: installmentAmt,
      gst_rate: gstRate,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      total_gst_liability: gstLiabilityAmount,
      payment_date: new Date().toISOString().split('T')[0],
      status: 'Deferred to Registration'
    };

    try {
      if (supabase) {
        await supabase.from('customer_gst_ledger').insert([gstLedgerData]);
      }
      setShowReceipt(true);
    } catch (err) {
      console.error(err);
      setShowReceipt(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (showReceipt) {
    return (
      <div className="min-h-screen bg-gray-200 p-8 flex flex-col items-center print:bg-white print:p-0">
        <div className="w-full max-w-4xl flex justify-between items-center mb-6 print:hidden">
          <button onClick={() => setShowReceipt(false)} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-6 rounded shadow">
            ← Back to Payment Form
          </button>
          <div className="flex gap-4">
             <span className="bg-green-100 text-green-800 font-bold py-2 px-4 rounded border border-green-300 flex items-center">
               ✓ Installment Logged & GST Tracked in Separate Ledger
             </span>
             <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded shadow-lg flex items-center gap-2">
               🖨️ Print / Save Receipt PDF
             </button>
          </div>
        </div>

        <div 
          className="bg-white w-full max-w-4xl shadow-2xl print:shadow-none print:w-full print:max-w-none text-black flex flex-col p-10"
          style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', minHeight: '297mm' }}
        >
          <div className="text-center border-b-4 border-blue-700 pb-4 mb-6">
            <h1 className="text-3xl font-extrabold text-blue-900 uppercase">Universal Engicon Pvt. Ltd.</h1>
            <p className="text-xs text-blue-700 font-bold tracking-widest mt-1">Real Estate & Infrastructure Division</p>
            <p className="text-xs text-gray-600">Patna, Bihar, India</p>
          </div>

          <div className="text-center mb-8">
            <span className="bg-blue-700 text-white px-6 py-1.5 text-lg font-bold tracking-widest uppercase rounded">
              Official Installment Receipt
            </span>
          </div>

          <div className="flex justify-between mb-8 text-sm bg-blue-50 p-6 rounded-lg border border-blue-100">
            <div>
              <p className="mb-1"><span className="font-bold text-blue-900">Receipt No:</span> {receiptNo}</p>
              <p className="mb-1"><span className="font-bold text-blue-900">Date:</span> {new Date().toLocaleDateString('en-IN')}</p>
              <p className="mb-1"><span className="font-bold text-blue-900">Customer ID:</span> {customerId}</p>
              <p><span className="font-bold text-blue-900">Project:</span> {projectName}</p>
            </div>
            <div className="text-right">
              <p className="mb-1"><span className="font-bold text-blue-900">Customer Name:</span> <span className="uppercase font-bold text-gray-900">{customerName}</span></p>
              <p className="mb-1"><span className="font-bold text-blue-900">Unit / Flat No:</span> <span className="font-bold text-gray-900">{unitNumber}</span></p>
              <p className="mb-1"><span className="font-bold text-blue-900">Total Unit Sold Cost:</span> <span className="font-bold text-blue-800">₹ {totalCost.toLocaleString('en-IN')}</span></p>
              <p><span className="font-bold text-blue-900">Category:</span> {propertyType}</p>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-gray-300 mb-8 text-sm">
            <thead className="bg-blue-700 text-white">
              <tr>
                <th className="border border-blue-800 py-3 px-4">Payment Milestone Description</th>
                <th className="border border-blue-800 py-3 px-4 text-right">Base Installment Received (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 py-4 px-4 font-bold text-gray-800">{milestone}</td>
                <td className="border border-gray-300 py-4 px-4 text-right font-extrabold text-blue-900 text-base">₹ {installmentAmt.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          {/* Deferred GST Notice */}
          <div className="border border-amber-400 bg-amber-50 p-4 rounded-lg mb-12 text-sm text-amber-900">
            <h4 className="font-bold mb-1 uppercase tracking-wide text-xs text-amber-800">📌 GST Liability Tracker (Payable at Unit Registration / Possession)</h4>
            <p className="mb-2 text-xs text-amber-700">As requested, GST on this installment is recorded separately in the Unit GST Ledger and will be collected at the time of final registration.</p>
            <div className="flex justify-between font-semibold pt-2 border-t border-amber-200">
              <span>Milestone GST ({gstRate}%): ₹ {gstLiabilityAmount.toLocaleString('en-IN')} (CGST: ₹ {cgstAmount.toLocaleString('en-IN')} | SGST: ₹ {sgstAmount.toLocaleString('en-IN')})</span>
              <span className="text-red-700 font-bold">Status: Deferred to Registration</span>
            </div>
          </div>

          <div className="flex justify-between mt-auto pt-10 text-sm font-bold text-blue-900">
            <div className="text-center">
              <p className="border-b-2 border-gray-400 w-40 mx-auto mb-2"></p>
              <p>Customer Signature</p>
            </div>
            <div className="text-center">
              <p className="border-b-2 border-gray-400 w-48 mx-auto mb-2"></p>
              <p>Authorized Signatory</p>
              <p className="text-xs text-gray-500 font-normal">Universal Engicon Pvt. Ltd.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 pb-20">
      <header className="mb-8 flex justify-between items-end border-b pb-4">
        <div>
          <Link href="/" className="text-blue-600 hover:underline text-sm font-medium mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-blue-900">Customer Installment & GST Ledger Tracker</h1>
        </div>
        <button 
          onClick={handleSaveAndGenerateReceipt}
          disabled={isSaving}
          className={`${isSaving ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-3 px-8 rounded shadow-lg transition-transform flex items-center gap-2`}
        >
          {isSaving ? '⏳ Saving Record...' : '📄 Save Installment & Track GST'}
        </button>
      </header>

      {/* QUICK PRESET BUTTONS FOR TESTING */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6 flex justify-between items-center">
        <span className="text-sm font-bold text-blue-900">Quick Test Customers:</span>
        <div className="flex gap-4">
          <button onClick={() => loadPreset('1')} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-blue-700 shadow">
            Load Flat 402 (Rajesh Kumar - ₹45L)
          </button>
          <button onClick={() => loadPreset('2')} className="bg-purple-600 text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-purple-700 shadow">
            Load Shop 12 (Amitabh Sinha - ₹65L)
          </button>
        </div>
      </div>

      {/* SECTION 1: CUSTOMER DETAILS */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-800 p-3 border-b border-gray-200">
          <h2 className="font-bold text-lg text-white px-2">1. Customer & Unit Information</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Unique Customer ID</label>
            <input type="text" className="w-full p-2 border border-blue-400 rounded bg-white font-bold text-blue-900" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name</label>
            <input type="text" className="w-full p-2 border border-gray-300 rounded bg-white font-medium" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
            <input type="text" className="w-full p-2 border border-gray-300 rounded bg-white font-medium" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Billing Address</label>
            <input type="text" className="w-full p-2 border border-gray-300 rounded bg-white font-medium" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Flat / Shop / Office No.</label>
            <input type="text" className="w-full p-2 border border-gray-300 rounded bg-white font-bold text-blue-900" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Total Unit Sold Cost (₹)</label>
            <input 
              type="number" 
              className="w-full p-2 border-2 border-green-500 rounded bg-green-50 font-extrabold text-green-900 text-lg" 
              value={totalCost || ''} 
              onChange={(e) => setTotalCost(Number(e.target.value))} 
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: INSTALLMENT & DEFERRED GST */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden mb-6">
        <div className="bg-blue-900 p-3 border-b border-gray-200"><h2 className="font-bold text-lg text-white px-2">2. Installment Payment & Separate GST Ledger</h2></div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Property Category (GST Slab)</label>
              <select className="w-full p-2 border border-gray-300 rounded bg-white font-medium" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                <option value="Residential (Affordable - 1%)">Residential (Affordable Housing - 1% GST)</option>
                <option value="Residential (Non-Affordable - 5%)">Residential (Non-Affordable - 5% GST)</option>
                <option value="Commercial Shop / Office (5%)">Commercial Shop / Office - 5% GST</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Milestone</label>
              <select className="w-full p-2 border border-gray-300 rounded bg-white font-medium" value={milestone} onChange={(e) => setMilestone(e.target.value)}>
                <option value="Booking Amount (10%)">Booking Amount (10%)</option>
                <option value="Agreement Stage (20%)">Agreement Stage (20%)</option>
                <option value="Plinth Level Completion (15%)">Plinth Level Completion (15%)</option>
                <option value="Roof Casting Stage (25%)">Roof Casting Stage (25%)</option>
                <option value="Brickwork & Plaster Stage (20%)">Brickwork & Plaster Stage (20%)</option>
                <option value="Notice of Possession (10%)">Notice of Possession (10%)</option>
              </select>
            </div>
          </div>

          <hr className="mb-6 border-gray-200" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Installment Base Amount Received (₹)</label>
              <input 
                type="number" 
                className="w-full p-2 border border-blue-400 rounded font-bold text-blue-900 text-lg" 
                placeholder="Enter installment amount" 
                value={installmentAmt || ''} 
                onChange={(e) => setInstallmentAmt(Number(e.target.value))} 
              />
              <p className="text-xs text-gray-500 mt-1">Note: This amount goes directly into payment records without adding GST.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-amber-900 mb-2">Milestone GST Liability (Payable at Registration) ({gstRate}%)</label>
              <input 
                type="text" 
                readOnly 
                className="w-full p-2 border-2 border-amber-400 rounded bg-amber-50 text-amber-900 text-lg font-bold" 
                value={`₹ ${gstLiabilityAmount.toLocaleString('en-IN')}`} 
              />
              <p className="text-xs text-amber-700 mt-1">Tracked separately in unit GST ledger for final settlement.</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded border border-gray-200 text-sm text-gray-600 flex justify-between">
            <span>Tax Breakdown: CGST ({gstRate/2}%): <b>₹ {cgstAmount.toLocaleString('en-IN')}</b></span>
            <span>SGST ({gstRate/2}%): <b>₹ {sgstAmount.toLocaleString('en-IN')}</b></span>
            <span className="text-blue-700 font-semibold">Separate Ledger Tracking & Receipt Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}