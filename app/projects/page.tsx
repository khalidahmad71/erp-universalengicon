'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, PlusCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProjectRow {
  id: string | number;
  project_name?: string | null;
  name?: string | null;
  site_name?: string | null;
  location?: string | null;
  client_name?: string | null;
  status?: string | null;
  created_at?: string | null;
}

const PROJECTS_LOCAL_KEY = 'ue_projects_master_v1';

function readLocalProjects(): ProjectRow[] {
  try {
    const raw = localStorage.getItem(PROJECTS_LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ProjectRow[]) : [];
  } catch {
    return [];
  }
}

function saveLocalProjects(rows: ProjectRow[]) {
  try {
    localStorage.setItem(PROJECTS_LOCAL_KEY, JSON.stringify(rows));
  } catch {}
}

export default function ProjectsMasterPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [projectName, setProjectName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');

  const loadProjects = async () => {
    setLoading(true);
    setErrorMsg(null);
    const local = readLocalProjects();
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const rows = data as ProjectRow[];
        setProjects(rows.length > 0 ? rows : local);
        if (rows.length > 0) saveLocalProjects(rows);
      } else {
        setProjects(local);
      }
    } catch {
      setProjects(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    setErrorMsg(null);

    const cleanName = projectName.trim();
    if (!cleanName) {
      setErrorMsg('Please enter Project / Site Name.');
      setSubmitting(false);
      return;
    }

    const newProj: ProjectRow = {
      id: Date.now(),
      project_name: cleanName,
      name: cleanName,
      site_name: cleanName,
      location: location.trim() || '-',
      client_name: clientName.trim() || 'Universal Engicon Pvt. Ltd.',
      status,
      created_at: new Date().toISOString(),
    };

    try {
      let inserted = false;

      const { error: err1 } = await supabase.from('projects').insert([
        {
          name: cleanName,
          site_name: location.trim() || cleanName,
          status,
        },
      ]);

      if (!err1) {
        inserted = true;
      } else {
        const { error: err2 } = await supabase.from('projects').insert([
          {
            project_name: cleanName,
            location: location.trim() || null,
            client_name: clientName.trim() || null,
            status,
          },
        ]);
        if (!err2) inserted = true;
      }

      const updatedLocal = [newProj, ...readLocalProjects()];
      saveLocalProjects(updatedLocal);

      if (inserted) {
        await loadProjects();
      } else {
        setProjects(updatedLocal);
      }

      setStatusMsg(`Project "${cleanName}" added successfully!`);
      setProjectName('');
      setLocation('');
      setClientName('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
              <Building2 className="w-4 h-4" />
              Project &amp; Site Master
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
              Projects &amp; Sites — UNIVERSAL ENGICON PVT. LTD.
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Yahan se add kiye gaye sabhi Projects MR, PO, DPR, Store aur Site Payments mein dikhenge.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/mr"
              className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold uppercase"
            >
              Go to MR Module
            </Link>
            <button
              type="button"
              onClick={loadProjects}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold uppercase"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <form
          onSubmit={handleAddProject}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
            + Add New Project / Site
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Project / Site Name *
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Godrej Zen Estate Phase-2"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                City / Site Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Patna / Kolkata / Lucknow"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Client / Developer
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client or Internal Real Estate"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PLANNING">PLANNING</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm shadow-lg transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            {submitting ? 'Saving Project...' : 'Save New Project'}
          </button>
        </form>

        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
              Active Projects ({projects.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <th className="py-3 px-4">Project / Site Name</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      {loading
                        ? 'Loading projects...'
                        : 'No projects yet. Add your first project using the form above.'}
                    </td>
                  </tr>
                ) : (
                  projects.map((p) => {
                    const title = p.project_name || p.name || p.site_name || `#${p.id}`;
                    return (
                      <tr key={String(p.id)} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-amber-300">{title}</td>
                        <td className="py-3 px-4 text-slate-300">{p.location || p.site_name || '-'}</td>
                        <td className="py-3 px-4 text-slate-300">{p.client_name || '-'}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                            {p.status || 'ACTIVE'}
                          </span>
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