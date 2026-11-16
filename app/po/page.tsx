'use client';

import React, { useState, useEffect } from 'react';
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

const standardGeneralTerms = [
  "Material must be strictly as per approved quality & specifications.",
  "Test Certificates (TC) must be provided along with the material delivery.",
  "Loading & Unloading will be in vendor's scope.",
  "F.O.R Site Delivery (Freight and Transit Insurance included).",
  "Defective or sub-standard materials will be rejected and returned at vendor's cost.",
  "All legal disputes are subject to Patna jurisdiction only.",
  "Vehicle unloading time will be strictly between 9 AM to 6 PM.",
  "Proper E-Way bill and Original Tax Invoice must accompany the vehicle."
];

export default function PurchaseOrder() {
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');

  const [materialList, setMaterialList] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [qty, setQty] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [poItems, setPoItems] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  const [poNumber, setPoNumber] = useState(`UEPL/PO/26-27/${Math.floor(1000 + Math.random() * 9000)}`);

  const [paymentTerm, setPaymentTerm] = useState('15 Days after material delivery & bill submission.');
  const [deliveryTerm, setDeliveryTerm] = useState('Within 7 days from the date of this PO.');
  const [selectedGeneralTerms, setSelectedGeneralTerms] = useState<string[]>([
    standardGeneralTerms[0],
    standardGeneralTerms[5]
  ]);

  useEffect(() => {
    async function fetchMaterials() {
      try {
        if (!supabaseKey || !supabase) {
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.from('materials').select('*');
        if (!error && data) {
          const materialsWithGST = data.map(mat => {
            let gstRate = 18;
            const itemName = mat.name ? mat.name.toLowerCase() : '';
            if (itemName.includes('cement')) gstRate = 28;
            else if (itemName.includes('sand') || itemName.includes('aggregate')) gstRate = 5;
            else if (itemName.includes('brick')) gstRate = 12;
            return { ...mat, gst: gstRate };
          });
          setMaterialList(materialsWithGST);
          if (materialsWithGST.length > 0) setSelectedMaterial(materialsWithGST[0]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMaterials();
  }, []);

  const baseAmount = qty * rate;
  const gstAmount = selectedMaterial ? (baseAmount * selectedMaterial.gst) / 100 : 0;
  const cgstAmount = gstAmount / 2;
  const sgstAmount = gstAmount / 2;
  const totalAmount = baseAmount + gstAmount;

  const handleAddItem = () => {
    if (qty <= 0 || rate <= 0 || !selectedMaterial) return;
    const newItem = {
      id: Date.now(),
      name: selectedMaterial.name,
      unit: selectedMaterial.unit,
      gst: selectedMaterial.gst,
      qty,
      rate,
      baseAmount,
      cgstAmount,
      sgstAmount,
      totalAmount
    };
    setPoItems([...poItems, newItem]);
    setQty(0);
    setRate(0);
  };

  const handleDeleteItem = (id: number) => {
    setPoItems(poItems.filter(item => item.id !== id));
  };

  const handleTermToggle = (term: string) => {
    if (selectedGeneralTerms.includes(term)) {
      setSelectedGeneralTerms(selectedGeneralTerms.filter(t => t !== term));
    } else {
      setSelectedGeneralTerms([...selectedGeneralTerms, term]);
    }
  };

  const grandBase = poItems.reduce((acc, item) => acc + item.baseAmount, 0);
  const grandCGST = poItems.reduce((acc, item) => acc + item.cgstAmount, 0);
  const grandSGST = poItems.reduce((acc, item) => acc + item.sgstAmount, 0);
  const grandTotal = poItems.reduce((acc, item) => acc + item.totalAmount, 0);

  const handleSaveAndPreview = async () => {
    if (poItems.length === 0) {
      alert("Please add at least one material to the PO list!");
      return;
    }
    if (!vendorName) {
      alert("Please enter the Vendor Name!");
      return;
    }

    setIsSaving(true);
    
    const poData = {
      po_number: poNumber,
      vendor_name: vendorName,
      vendor_contact: vendorContact,
      vendor_address: vendorAddress,
      payment_term: paymentTerm,
      delivery_term: deliveryTerm,
      general_terms: selectedGeneralTerms,
      items: poItems, 
      grand_base: grandBase,
      grand_cgst: grandCGST,
      grand_sgst: grandSGST,
      grand_total: grandTotal
    };

    try {
      const { error } = await supabase.from('purchase_orders').insert([poData]);
      if (error) {
        alert("Database Save Error: " + error.message);
      } else {
        setShowPreview(true);
      }
    } catch (err) {
      console.error(err);
      alert("Application Crash Error!");
    } finally {
      setIsSaving(false);
    }
  };

  // ----------------- NEW MODERN PDF PRINT PREVIEW -----------------
  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-200 p-8 flex flex-col items-center print:bg-white print:p-0">
        
        {/* Action Bar (Not printed) */}
        <div className="w-full max-w-4xl flex justify-between items-center mb-6 print:hidden">
          <button onClick={() => setShowPreview(false)} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-6 rounded shadow">
            ← Back to Edit
          </button>
          <div className="flex gap-4">
             <span className="bg-green-100 text-green-800 font-bold py-2 px-4 rounded border border-green-300 flex items-center">
               ✓ Saved to Database
             </span>
             <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded shadow-lg flex items-center gap-2">
               🖨️ Print / Save as PDF
             </button>
          </div>
        </div>

        {/* PRINTABLE A4 PAGE */}
        <div 
          className="bg-white w-full max-w-4xl shadow-2xl print:shadow-none print:w-full print:max-w-none text-black flex flex-col"
          style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', minHeight: '297mm' }}
        >
          
          {/* HEADER BAND (Light Blue Background) */}
          <div className="bg-[#f4f7fe] p-10 flex justify-between items-center print:bg-[#f4f7fe]">
            <h1 className="text-[2.75rem] leading-none text-[#3b82f6] tracking-tight">Purchase Order</h1>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Issued by</p>
              <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">Universal Engicon Pvt. Ltd.</h2>
              <p className="text-xs text-gray-600 mt-1">Civil Construction, Infrastructure & Real Estate</p>
              <p className="text-xs text-gray-600">Patna, Bihar, India</p>
            </div>
          </div>

          {/* INFO BLOCKS SECTION */}
          <div className="p-10 flex justify-between gap-8 border-b border-gray-100">
            {/* Vendor Details */}
            <div className="w-5/12">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 border-l-2 border-[#3b82f6] pl-2">Order To</h3>
              <p className="font-bold text-gray-900 text-lg mb-1">{vendorName}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{vendorAddress}</p>
              <p className="text-sm text-gray-600 mt-2"><span className="font-semibold text-gray-800">Phone:</span> {vendorContact}</p>
            </div>

            {/* PO Document Details */}
            <div className="w-3/12">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 border-l-2 border-[#3b82f6] pl-2">Order Details</h3>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-gray-700">PO #</span> 
                <span className="font-medium text-gray-900">{poNumber}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-gray-700">Date</span> 
                <span className="font-medium text-gray-900">{new Date().toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="w-3/12">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 border-l-2 border-[#3b82f6] pl-2">Payment Record</h3>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-gray-700">Paid Amount</span> 
                <span className="font-medium text-gray-900">₹0</span>
              </div>
              <div className="flex justify-between items-end mt-4">
                <span className="font-semibold text-gray-700 text-sm pb-1">Due Amount</span> 
                <span className="text-2xl font-bold text-[#3b82f6] leading-none">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="px-10 py-6 flex-grow">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-[#2563eb] text-white print:bg-[#2563eb]">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-tl">S.No</th>
                  <th className="py-3 px-4 font-medium">Material Description</th>
                  <th className="py-3 px-4 font-medium text-center">UOM</th>
                  <th className="py-3 px-4 font-medium text-center">Qty</th>
                  <th className="py-3 px-4 text-right font-medium">Rate (₹)</th>
                  <th className="py-3 px-4 text-right font-medium rounded-tr">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {poItems.length === 0 ? (
                  <tr><td colSpan={6} className="border-b border-gray-200 py-6 text-center italic text-gray-500">No items added</td></tr>
                ) : (
                  poItems.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="py-4 px-4 text-gray-600 font-medium">{index + 1}</td>
                      <td className="py-4 px-4 font-bold text-gray-800">
                        {item.name} 
                        <span className="block text-xs text-gray-500 font-normal mt-1">GST: {item.gst}%</span>
                      </td>
                      <td className="py-4 px-4 text-center text-gray-600">{item.unit}</td>
                      <td className="py-4 px-4 text-center text-gray-600">{item.qty}</td>
                      <td className="py-4 px-4 text-right text-gray-600">{item.rate.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-4 text-right font-semibold text-gray-800">{item.baseAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* TOTALS SECTION */}
            <div className="flex justify-end mt-8">
              <div className="w-1/3">
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-2 text-gray-600 font-medium">Sub Total</td>
                      <td className="py-2 text-right font-bold text-gray-900">₹{grandBase.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-600 font-medium">CGST</td>
                      <td className="py-2 text-right text-gray-900">₹{grandCGST.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-600 font-medium">SGST</td>
                      <td className="py-2 text-right text-gray-900 mb-2">₹{grandSGST.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="border-t border-gray-200 pt-3 mt-2"></td>
                    </tr>
                    <tr>
                      <td className="py-1 font-bold text-gray-900 text-base">Total Due</td>
                      <td className="py-1 text-right font-extrabold text-[#3b82f6] text-xl">₹{grandTotal.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* FOOTER BAND (Terms & Signatures - Light Blue Background) */}
          <div className="bg-[#f4f7fe] p-10 mt-auto flex justify-between gap-12 print:bg-[#f4f7fe]">
            
            {/* Terms and Conditions */}
            <div className="w-2/3">
              <h4 className="font-bold text-gray-900 mb-3 text-sm">Terms and Conditions</h4>
              <p className="text-xs text-gray-700 mb-1"><span className="font-semibold text-gray-900">Payment:</span> {paymentTerm}</p>
              <p className="text-xs text-gray-700 mb-3"><span className="font-semibold text-gray-900">Delivery:</span> {deliveryTerm}</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-xs text-gray-600 font-medium">
                {selectedGeneralTerms.map((term, idx) => (
                  <li key={idx}>{term}</li>
                ))}
              </ol>
            </div>

            {/* Signature Area */}
            <div className="w-1/3 flex flex-col justify-end items-end pb-2">
              <div className="text-center w-full max-w-[200px]">
                <p className="border-b border-gray-400 w-full mb-2"></p>
                <p className="text-xs font-bold text-gray-900">Authorized Signatory</p>
                <p className="text-[10px] text-gray-500 mt-1">Universal Engicon Pvt. Ltd.</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // ----------------- FORM VIEW (Unchanged) -----------------
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 pb-20">
      <header className="mb-8 flex justify-between items-end border-b pb-4">
        <div>
          <Link href="/" className="text-blue-600 hover:underline text-sm font-medium mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-blue-900">Generate Purchase Order</h1>
        </div>
        <button 
          onClick={handleSaveAndPreview} 
          disabled={isSaving}
          className={`${isSaving ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-3 px-8 rounded shadow-lg transition-transform flex items-center gap-2`}
        >
          {isSaving ? '⏳ Saving to Database...' : '📄 Save & Preview PO'}
        </button>
      </header>

      {/* SECTION 1: VENDOR */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-800 p-3 border-b border-gray-200"><h2 className="font-bold text-lg text-white px-2">1. Vendor Information</h2></div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">Vendor Name</label><input type="text" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-200" value={vendorName} onChange={(e) => setVendorName(e.target.value)} /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label><input type="text" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-200" value={vendorContact} onChange={(e) => setVendorContact(e.target.value)} /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">Billing Address</label><input type="text" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-200" value={vendorAddress} onChange={(e) => setVendorAddress(e.target.value)} /></div>
        </div>
      </div>

      {/* SECTION 2: ITEM ENTRY */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden mb-6">
        <div className="bg-blue-900 p-3 border-b border-gray-200"><h2 className="font-bold text-lg text-white px-2">2. Add Materials</h2></div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Material</label>
              <select className="w-full p-2 border border-gray-300 rounded font-medium bg-white" value={selectedMaterial?.name || ''} onChange={(e) => setSelectedMaterial(materialList.find(m => m.name === e.target.value))}>
                {materialList.map((mat, idx) => <option key={idx} value={mat.name}>{mat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Unit (UOM)</label>
              <input type="text" readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600 cursor-not-allowed font-medium" value={selectedMaterial?.unit || ''} placeholder="Auto-fill" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Applicable GST (%)</label>
              <input type="text" readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600 cursor-not-allowed font-medium" value={selectedMaterial ? `${selectedMaterial.gst}%` : ''} placeholder="Auto-fill" />
            </div>
          </div>
          <hr className="mb-6 border-gray-200" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label><input type="number" className="w-full p-2 border border-blue-400 rounded font-bold text-blue-900" value={qty || ''} onChange={(e) => setQty(Number(e.target.value))} /></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Base Rate (₹)</label><input type="number" className="w-full p-2 border border-blue-400 rounded font-bold text-blue-900" value={rate || ''} onChange={(e) => setRate(Number(e.target.value))} /></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Base Amount (₹)</label><input type="text" readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-800 cursor-not-allowed font-bold" value={baseAmount > 0 ? baseAmount.toLocaleString('en-IN') : '0'} /></div>
          </div>
          <hr className="mb-6 border-gray-200" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">CGST Amount (₹)</label><input type="text" readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600 cursor-not-allowed" value={cgstAmount > 0 ? cgstAmount.toLocaleString('en-IN') : '0'} /></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">SGST Amount (₹)</label><input type="text" readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600 cursor-not-allowed" value={sgstAmount > 0 ? sgstAmount.toLocaleString('en-IN') : '0'} /></div>
            <div><label className="block text-sm font-bold text-blue-900 mb-2">Final Total Amount (₹)</label><input type="text" readOnly className="w-full p-2 border-2 border-green-500 rounded bg-green-50 text-green-800 cursor-not-allowed text-xl font-extrabold" value={totalAmount > 0 ? totalAmount.toLocaleString('en-IN') : '0'} /></div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAddItem} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow">
              + Add Item to PO List
            </button>
          </div>
        </div>
        {poItems.length > 0 && (
          <div className="bg-green-50 p-4 border-t border-green-200">
            <h3 className="font-bold text-green-800 mb-3">Items Added ({poItems.length})</h3>
            <table className="w-full text-sm text-left">
              <thead><tr className="border-b border-green-200"><th className="pb-2">Item</th><th className="pb-2">Qty</th><th className="pb-2">Rate</th><th className="pb-2">Total</th><th className="pb-2">Action</th></tr></thead>
              <tbody>
                {poItems.map((item) => (
                  <tr key={item.id} className="border-b border-green-100">
                    <td className="py-2 font-medium">{item.name}</td><td>{item.qty} {item.unit}</td><td>₹{item.rate}</td><td className="font-bold">₹{item.totalAmount}</td>
                    <td><button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700 font-bold">✕ Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: TERMS */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="bg-gray-700 p-3 border-b border-gray-200"><h2 className="font-bold text-lg text-white px-2">3. Terms & Conditions</h2></div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Terms</label>
              <select className="w-full p-2 border border-gray-300 rounded text-sm" value={paymentTerm} onChange={(e) => setPaymentTerm(e.target.value)}>
                <option>15 Days after material delivery & bill submission.</option>
                <option>30 Days after material delivery & bill submission.</option>
                <option>100% Advance Payment before dispatch.</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Terms</label>
              <select className="w-full p-2 border border-gray-300 rounded text-sm" value={deliveryTerm} onChange={(e) => setDeliveryTerm(e.target.value)}>
                <option>Within 7 days from the date of this PO.</option>
                <option>Immediate / Ready Stock.</option>
                <option>As per site clearance & requirement.</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">General Terms (Tick applicable ones)</label>
            <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg space-y-3 h-48 overflow-y-auto">
              {standardGeneralTerms.map((term, idx) => (
                <label key={idx} className="flex items-start space-x-3 cursor-pointer group">
                  <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded cursor-pointer" checked={selectedGeneralTerms.includes(term)} onChange={() => handleTermToggle(term)}/>
                  <span className="text-sm text-gray-700">{term}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}