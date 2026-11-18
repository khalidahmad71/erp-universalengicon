'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Building2, Plus, MapPin, Trash2 } from 'lucide-react';

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jvorxidiigvdznnpgxrj.supabase.co"),
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key")
);

interface ProjectItem {
  id: number;
  name: string;
  location?: string;
  budget: number;
  status?: string;
}

export default function ProjectsMasterPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: 'Patna, Bihar',
    budget: 0,
    status: 'ACTIVE',
  });

  const loadProjects = async () => {
    setLoading(true);
    const { data } = await supabase.from('projects').select('*').order('id', { ascending: false });
    if (data) setProjects(data as ProjectItem[]);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('projects').insert([
      {
        name: formData.name.trim(),
        location: formData.location.trim(),
        budget: Number(formData.budget),
        status: formData.status,
      },
    ]);

    if (error && error.message.includes('location')) {
      await supabase.from('projects').insert([
        {
          name: formData.name.trim(),
          budget: Number(formData.budget),
          status: formData.status,
        },
      ]);
    } else if (error) {
      alert('Error adding project: ' + error.message);
      return;
    }

    setShowModal(false);
    setFormData({ name: '', location: 'Patna, Bihar', budget: 0, status: 'ACTIVE' });
    loadProjects();
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Are you sure you want to remove this project?')) return;
    await supabase.from('projects').delete().eq('id', id);
    loadProjects();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold tracking-wider text-blue-700 uppercase">
            Universal Engicon Pvt. Ltd. â€¢ Project Portfolio
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">All Sites &amp; Projects Master</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" /> Add New Project
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading projects...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {projects.map((proj) => (
            <div key={proj.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-bold text-slate-900">{proj.name}</h2>
                  {proj.location && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5" /> {proj.location}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  {proj.status || 'ACTIVE'}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="font-mono text-sm font-bold text-blue-700">
                  â‚¹ {Number(proj.budget || 0).toLocaleString('en-IN')}
                </span>
                <button
                  onClick={() => handleDeleteProject(proj.id)}
                  className="text-slate-400 hover:text-rose-600"
                  title="Delete Project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleAddProject} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Building2 className="h-5 w-5 text-blue-700" /> Add New Site / Project
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block font-semibold">Project Name *</label>
                <input
                  required
                  className="w-full rounded border p-2"
                  placeholder="e.g. Universal Engicon Tower - Patna"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Location</label>
                <input
                  className="w-full rounded border p-2"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Contract Budget (â‚¹) *</label>
                <input
                  type="number"
                  required
                  className="w-full rounded border p-2 font-mono font-bold"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Status</label>
                <select
                  className="w-full rounded border p-2"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PLANNING">PLANNING</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
                Save Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
