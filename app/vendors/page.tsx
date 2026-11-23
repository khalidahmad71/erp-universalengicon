'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Building2,
  PlusCircle,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface VendorRow {
  id: string;
  vendor_code: string;
  vendor_name: string;
  category: string;
  gstin?: string | null;
  pan?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  bank_account?: string | null;
  ifsc_code?: string | null;
  status: string;
  created_at?: string;
}

export default function VendorMasterPage() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [vendorCode, setVendorCode] = useState(
    `VND-UE-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [vendorName, setVendorName] = useState('');
  const [category, setCategory] = useState('Material Supplier');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*');

      if (!error && Array.isArray(data)) {
        setVendors(
          data.map((row: any, idx: number) => ({
            id: String(row?.id ?? idx),
            vendor_code: String(row?.vendor_code || `VND-${idx + 1}`),
            vendor_name: String(
              row?.vendor_name || row?.name || row?.firm_name || 'Unnamed Vendor'
            ),
            category: String(row?.category || 'Material Supplier'),
            gstin: row?.gstin ? String(row.gstin) : '',
            pan: row?.pan ? String(row.pan) : '',
            contact_person: row?.contact_person ? String(row.contact_person) : '',
            phone: row?.phone ? String(row.phone) : '',
            email: row?.email ? String(row.email) : '',
            address: row?.address ? String(row.address) : '',
            bank_account: row?.bank_account ? String(row.bank_account) : '',
            ifsc_code: row?.ifsc_code ? String(row.ifsc_code) : '',
            status: String(row?.status || 'Active'),
            created_at: row?.created_at,
          }))
        );
      }
    } catch (err) {
      console.error('Error loading vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      alert('Please enter Vendor Name.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('vendors').insert([
      {
        vendor_code: vendorCode.trim().toUpperCase(),
        vendor_name: vendorName.trim(),
        category,
        gstin: gstin.trim().toUpperCase() || null,
        pan: pan.trim().toUpperCase() || null,
        contact_person: contactPerson.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        bank_account: bankAccount.trim() || null,
        ifsc_code: ifscCode.trim().toUpperCase() || null,
        status: 'Active',
      },
    ]);
    setSaving(false);

    if (error) {
      alert('Vendor Save Error: ' + error.message);
      return;
    }

    setVendorCode(`VND-UE-${Math.floor(1000 + Math.random() * 9000)}`);
    setVendorName('');
    setGstin('');
    setPan('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setBankAccount('');
    setIfscCode('');
    await fetchVendors();
  };

  const handleToggleStatus = async (vendor: VendorRow) => {
    const nextStatus = vendor.status === 'Active' ? 'Inactive' : 'Active';
    const { error } = await supabase
      .from('vendors')
      .update({ status: nextStatus })
      .eq('id', vendor.id);

    if (!error) {
      await fetchVendors();
    }
  };

  const filteredVendors = vendors.filter((v) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      String(v.vendor_name || '').toLowerCase().indexOf(q) !== -1 ||
      String(v.vendor_code || '').toLowerCase().indexOf(q) !== -1 ||
      String(v.gstin || '').toLowerCase().indexOf(q) !== -1 ||
      String(v.category || '').toLowerCase().indexOf(q) !== -1
    );
  });

  return (
    <div className="min-h-screen bg-slate-50/70 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Universal Engicon Pvt. Ltd. • Procurement Directory
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Vendor Master
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Registered Suppliers, Sub-Contractors, GSTIN, PAN &amp; Bank Details
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, code, GSTIN..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>
        </div>

        {/* Add Vendor Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <PlusCircle className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-extrabold text-slate-900">
              Register New Vendor / Sub-Contractor
            </h2>
          </div>

          <form onSubmit={handleAddVendor} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vendor Code *
              </label>
              <input
                type="text"
                required
                value={vendorCode}
                onChange={(e) => setVendorCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vendor / Firm Name *
              </label>
              <input
                type="text"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. UltraTech Cement / Sharma Civil Works"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="Material Supplier">Material Supplier</option>
                <option value="Sub-Contractor">Sub-Contractor</option>
                <option value="Plant & Machinery Rental">Plant &amp; Machinery Rental</option>
                <option value="Service / Transport">Service / Transport</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GSTIN
              </label>
              <input
                type="text"
                maxLength={15}
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="10AABCU9603R1ZM"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PAN
              </label>
              <input
                type="text"
                maxLength={10}
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="AABCU9603R"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone / Mobile
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98XXXXXXXX"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="accounts@vendor.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bank Account No
              </label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Account Number"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                maxLength={11}
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="HDFC0001234"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Address / City
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Patna / Kolkata / Lucknow"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            <div className="lg:col-span-4 flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                {saving ? 'Saving Vendor...' : 'Save Vendor to Master'}
              </button>
            </div>
          </form>
        </div>

        {/* Vendor Directory Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">
              Registered Vendors ({filteredVendors.length})
            </h3>
            {loading && <span className="text-xs text-slate-500">Loading...</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Code &amp; Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">GSTIN / PAN</th>
                  <th className="py-3.5 px-4">Contact &amp; Bank</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No vendors found.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-blue-700">{v.vendor_code}</div>
                        <div className="font-bold text-slate-900">{v.vendor_name}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{v.category}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div>GST: {v.gstin || '-'}</div>
                        <div className="text-slate-500">PAN: {v.pan || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[11px]">
                        <div className="font-semibold text-slate-800">
                          {v.contact_person || '-'} {v.phone ? `• ${v.phone}` : ''}
                        </div>
                        <div className="text-slate-500 font-mono">
                          {v.bank_account ? `A/C: ${v.bank_account}` : ''} {v.ifsc_code ? `(${v.ifsc_code})` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            v.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {v.status === 'Active' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(v)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] cursor-pointer"
                        >
                          {v.status === 'Active' ? 'Mark Inactive' : 'Activate'}
                        </button>
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