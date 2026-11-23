'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Send, ClipboardList, CheckCircle2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MaterialRequestRow {
  id: number | string;
  mr_number: string;
  project_name: string;
  material_desc: string;
  quantity: number;
  requested_by?: string | null;
  status?: string | null;
  created_at?: string;
}

const SITE_OPTIONS = [
  'Godrej Zen Estate Phase-2',
  'Patna Civil & Infra Site',
  'Kolkata Commercial Hub',
  'Lucknow Infrastructure Project',
  'Noida Corporate Tower',
];

const MATERIAL_OPTIONS = [
  'Nuvoco Cement',
  'TMT Steel Rebar (Fe-550D)',
  'River Sand / Fine Aggregate',
  '20mm Coarse Aggregate',
  'Fly Ash Bricks / AAC Blocks',
  'Bitumen / Road Material',
];

export default function MaterialRequestsPage() {
  const [mrList, setMrList] = useState<MaterialRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedReferenceMrId, setSelectedReferenceMrId] = useState<string>('');
  const [mrNumber, setMrNumber] = useState<string>(
    `MR-UE-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [projectName, setProjectName] = useState<string>('');
  const [materialDesc, setMaterialDesc] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [requestedBy, setRequestedBy] = useState<string>('Site Engineer');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  const fetchMRs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('material_requests')
      .select('id, mr_number, project_name, material_desc, quantity, requested_by, status, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMrList(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMRs();
  }, []);

  const handleSelectExistingMR = (mrId: string) => {
    setSelectedReferenceMrId(mrId);
    setFeedbackMsg('');

    const matched = mrList.find((item) => String(item.id) === mrId);
    if (!matched) {
      return;
    }

    // MR select karte hi uska Project / Site automatically set ho jaaye
    setProjectName(matched.project_name || '');
    if (matched.material_desc) {
      setMaterialDesc(matched.material_desc);
    }
    if (matched.quantity !== undefined && matched.quantity !== null) {
      setQuantity(String(matched.quantity));
    }
    if (matched.requested_by) {
      setRequestedBy(matched.requested_by);
    }

    setFeedbackMsg(
      `Auto-selected Project "${matched.project_name}" from ${matched.mr_number}.`
    );
  };

  const handleCreateMR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !materialDesc.trim() || Number(quantity) <= 0) {
      alert('Please select or enter Project / Site Name, Material, and valid Quantity.');
      return;
    }

    setSubmitting(true);
    setFeedbackMsg('');

    const { error } = await supabase.from('material_requests').insert([
      {
        mr_number: mrNumber.trim(),
        project_name: projectName.trim(),
        material_desc: materialDesc.trim(),
        quantity: Number(quantity),
        requested_by: requestedBy.trim() || 'Site Engineer',
        status: 'Pending',
      },
    ]);

    setSubmitting(false);

    if (error) {
      alert('Error creating MR: ' + error.message);
      return;
    }

    setMrNumber(`MR-UE-${Math.floor(100000 + Math.random() * 900000)}`);
    setSelectedReferenceMrId('');
    setQuantity('');
    setFeedbackMsg('Material Request sent to Purchase Department.');
    await fetchMRs();
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Universal Engicon Pvt. Ltd. • Procurement Indent
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Material Requests (MR)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Site material demands to Purchase Department
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form: + Raise New Demand */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              + Raise New Demand
            </h2>

            {feedbackMsg && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateMR} className="space-y-4">
              {/* Existing MR Selector -> Auto-fills Project / Site */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Existing MR (Auto-Fills Project Site)
                </label>
                <select
                  value={selectedReferenceMrId}
                  onChange={(e) => handleSelectExistingMR(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-blue-50/50 border border-blue-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
                >
                  <option value="">
                    {loading
                      ? 'Loading MRs...'
                      : '-- Choose MR to Auto-Select Project --'}
                  </option>
                  {mrList.map((mr) => (
                    <option key={mr.id} value={String(mr.id)}>
                      {mr.mr_number} • {mr.project_name} ({mr.material_desc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  MR Number
                </label>
                <input
                  type="text"
                  required
                  value={mrNumber}
                  onChange={(e) => setMrNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project / Site Name (Auto-Selected from MR) *
                </label>
                <select
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
                >
                  <option value="">Select Site</option>
                  {projectName && !SITE_OPTIONS.includes(projectName) && (
                    <option value={projectName}>{projectName}</option>
                  )}
                  {SITE_OPTIONS.map((site) => (
                    <option key={site} value={site}>
                      {site}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Required Material *
                </label>
                <select
                  required
                  value={materialDesc}
                  onChange={(e) => setMaterialDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-700 focus:outline-none"
                >
                  <option value="">Select Material</option>
                  {materialDesc && !MATERIAL_OPTIONS.includes(materialDesc) && (
                    <option value={materialDesc}>{materialDesc}</option>
                  )}
                  {MATERIAL_OPTIONS.map((mat) => (
                    <option key={mat} value={mat}>
                      {mat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantity Needed *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Sending Request...' : 'Send Request to Purchase'}
              </button>
            </form>
          </div>

          {/* Right Table: Recent Material Requests from Sites */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-slate-600" />
                <h2 className="text-sm font-extrabold text-slate-900">
                  Recent Material Requests from Sites
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {mrList.length} MRs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-4">MR Number</th>
                    <th className="py-3.5 px-4">Project Site</th>
                    <th className="py-3.5 px-4">Material Needed</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-slate-500">
                        Loading material requests...
                      </td>
                    </tr>
                  ) : mrList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-slate-500">
                        No material requests raised yet.
                      </td>
                    </tr>
                  ) : (
                    mrList.map((mr) => (
                      <tr
                        key={mr.id}
                        onClick={() => handleSelectExistingMR(String(mr.id))}
                        className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {mr.mr_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{mr.project_name}</div>
                          <div className="text-[11px] text-slate-500">
                            Requested by: {mr.requested_by || 'Site Engineer'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{mr.material_desc}</div>
                          <div className="text-[11px] text-slate-500">Qty: {mr.quantity}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {mr.status || 'Pending'}
                          </span>
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
    </div>
  );
}