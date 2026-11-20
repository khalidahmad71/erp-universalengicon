'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export interface PrintLineItem {
  description: string;
  unit?: string;
  quantity?: number | string;
  rate?: number | string;
  gstPercent?: number | string;
  amount: number;
}

interface OfficialPrintProps {
  docType: 'PURCHASE ORDER' | 'CONTRACTOR RA BILL' | 'CUSTOMER PAYMENT RECEIPT';
  docNumber: string;
  docDate: string;
  projectName: string;
  partyTitle: string;
  partyName: string;
  partyAddress?: string;
  partyGstOrPan?: string;
  partyPhone?: string;
  items: PrintLineItem[];
  subTotal: number;
  gstAmount: number;
  grandTotal: number;
  amountInWords?: string;
  termsOrRemarks?: string;
}

export default function OfficialPrintDocument({
  docType,
  docNumber,
  docDate,
  projectName,
  partyTitle,
  partyName,
  partyAddress,
  partyGstOrPan,
  partyPhone,
  items,
  subTotal,
  gstAmount,
  grandTotal,
  amountInWords,
  termsOrRemarks,
}: OfficialPrintProps) {
  const handlePrint = () => {
    window.print();
  };

  const qrPayload = encodeURIComponent(
    `UNIVERSAL ENGICON PVT LTD | ${docType} | No: ${docNumber} | Date: ${docDate} | Total: INR ${grandTotal}`
  );
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${qrPayload}`;

  const formatINR = (num: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(num || 0);

  return (
    <div className="w-full">
      <div className="no-print flex justify-end mb-4">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-800 text-white text-sm font-bold rounded-lg shadow-md hover:bg-slate-900 transition-all active:scale-95"
        >
          <Printer className="w-4 h-4" />
          Print Official PDF (A4)
        </button>
      </div>

      <div
        id="official-a4-print-area"
        className="bg-white text-slate-900 border border-slate-300 rounded-lg p-8 max-w-[210mm] mx-auto shadow-sm font-sans"
      >
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 bg-blue-900 text-white rounded-lg flex items-center justify-center font-black text-2xl tracking-tighter border-2 border-slate-900">
              UE
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                UNIVERSAL ENGICON PVT. LTD.
              </h1>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Civil Construction • Infrastructure • Real Estate Developers
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Corporate Office: Patna, Bihar | Email: info@universalengicon.com
              </p>
              <div className="flex gap-4 mt-1 text-xs font-bold text-slate-800">
                <span>GSTIN: 10AAACU1234F1Z5</span>
                <span>•</span>
                <span>PAN: AAACU1234F</span>
              </div>
            </div>
          </div>

          <div className="text-center border border-slate-300 p-1.5 rounded bg-slate-50">
            <img src={qrCodeUrl} alt="Document Verification QR" className="w-20 h-20 mx-auto" />
            <span className="block text-[9px] font-bold text-slate-600 uppercase mt-1">Scan to Verify</span>
          </div>
        </div>

        <div className="bg-slate-900 text-white text-center py-2 px-4 rounded font-extrabold tracking-widest text-sm uppercase mb-5">
          {docType}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
          <div className="border border-slate-300 rounded p-3.5 bg-slate-50/60">
            <p className="font-bold text-blue-900 uppercase border-b border-slate-200 pb-1 mb-2">
              {partyTitle}
            </p>
            <p className="font-extrabold text-sm text-slate-900">{partyName}</p>
            {partyAddress && <p className="text-slate-600 mt-1">{partyAddress}</p>}
            {partyGstOrPan && <p className="font-semibold text-slate-800 mt-1">GSTIN / PAN: {partyGstOrPan}</p>}
            {partyPhone && <p className="text-slate-600 mt-0.5">Contact: {partyPhone}</p>}
          </div>

          <div className="border border-slate-300 rounded p-3.5 bg-slate-50/60 space-y-1.5">
            <p className="font-bold text-blue-900 uppercase border-b border-slate-200 pb-1 mb-2">
              Document Reference
            </p>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Document No:</span>
              <span className="font-mono font-bold text-slate-900">{docNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Date:</span>
              <span className="font-bold text-slate-900">{docDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Project / Site:</span>
              <span className="font-bold text-slate-900">{projectName}</span>
            </div>
          </div>
        </div>

        <table className="w-full border-collapse border border-slate-300 text-xs mb-5">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-bold uppercase">
              <th className="border border-slate-300 py-2 px-2.5 text-center w-10">#</th>
              <th className="border border-slate-300 py-2 px-3 text-left">Description of Material / Work / Unit</th>
              <th className="border border-slate-300 py-2 px-2.5 text-center">Unit</th>
              <th className="border border-slate-300 py-2 px-2.5 text-right">Qty</th>
              <th className="border border-slate-300 py-2 px-2.5 text-right">Rate (₹)</th>
              <th className="border border-slate-300 py-2 px-3 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, idx) => (
              <tr key={idx}>
                <td className="border border-slate-300 py-2 px-2.5 text-center">{idx + 1}</td>
                <td className="border border-slate-300 py-2 px-3 font-medium">{row.description}</td>
                <td className="border border-slate-300 py-2 px-2.5 text-center">{row.unit || '-'}</td>
                <td className="border border-slate-300 py-2 px-2.5 text-right">{row.quantity ?? '-'}</td>
                <td className="border border-slate-300 py-2 px-2.5 text-right">{row.rate ?? '-'}</td>
                <td className="border border-slate-300 py-2 px-3 text-right font-semibold">
                  {formatINR(row.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-12 gap-4 mb-10 text-xs">
          <div className="col-span-7 border border-slate-300 rounded p-3 bg-slate-50/40">
            <p className="font-bold text-slate-800 uppercase mb-1">Terms, Conditions & Remarks:</p>
            <p className="text-slate-600 leading-relaxed">
              {termsOrRemarks ||
                '1. Subject to Patna Jurisdiction. 2. Mention Document No. on all future correspondence & tax invoices. 3. E. & O.E.'}
            </p>
            {amountInWords && (
              <p className="mt-3 font-bold text-slate-900 border-t border-slate-200 pt-2">
                Amount in Words: <span className="font-semibold italic">{amountInWords}</span>
              </p>
            )}
          </div>

          <div className="col-span-5 border border-slate-300 rounded p-3 space-y-2 bg-slate-50">
            <div className="flex justify-between">
              <span className="text-slate-600 font-semibold">Taxable Sub-Total:</span>
              <span className="font-bold">{formatINR(subTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-semibold">GST (CGST + SGST / IGST):</span>
              <span className="font-bold">{formatINR(gstAmount)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-slate-800 pt-2 text-sm font-black text-blue-900">
              <span>GRAND TOTAL:</span>
              <span>{formatINR(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 pt-10 mt-8 border-t border-slate-300 text-center text-xs">
          <div>
            <div className="h-12"></div>
            <div className="border-t border-slate-800 pt-1.5 font-bold text-slate-800">Prepared By</div>
            <p className="text-[10px] text-slate-500">Site Engineer / Executive</p>
          </div>

          <div>
            <div className="h-12"></div>
            <div className="border-t border-slate-800 pt-1.5 font-bold text-slate-800">Checked & Verified By</div>
            <p className="text-[10px] text-slate-500">Accounts / Project Manager</p>
          </div>

          <div>
            <div className="h-12 flex items-end justify-center">
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">
                For UNIVERSAL ENGICON PVT. LTD.
              </span>
            </div>
            <div className="border-t-2 border-slate-900 pt-1.5 font-black text-slate-900">
              Approved By (Managing Director)
            </div>
            <p className="text-[10px] text-slate-600 font-semibold">Mohammad Khalid Ahmad • Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}