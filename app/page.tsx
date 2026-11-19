'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import {
  Building2,
  ShoppingCart,
  FileSpreadsheet,
  ClipboardCheck,
  Landmark,
  Package,
  ArrowRight,
  HardHat,
  Receipt,
  TrendingUp,
  Plus,
  MapPin,
} from 'lucide-react';

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jvorxidiigvdznnpgxrj.supabase.co"),
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key")
);

interface ProjectSummary {
  id: number;
  name: string;
  location?: string;
  budget: number;
  status?: string;
}

export default function MainDashboard() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [stats, setStats] = useState({
    projectsCount: 0,
    totalBudget: 0,
    poCount: 0,
    pendingBills: 0,
  });

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    location: 'Patna, Bihar',
    budget: 0,
    status: 'ACTIVE',
  });

  async function loadDashboard() {
    const [projRes, poRes, billRes] = await Promise.all([
      supabase.from('projects').select('*').order('id', { ascending: false }),
      supabase.from('purchase_orders').select('id'),
      supabase.from('vendor_bills').select('id').neq('matching_status', 'MATCHED'),
    ]);

    const projectList = (projRes.data as ProjectSummary[]) || [];
    const totalVal = projectList.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

    setProjects(projectList);
    setStats({
      projectsCount: projectList.length,
      totalBudget: totalVal,
      poCount: poRes.data?.length || 0,
      pendingBills: billRes.data?.length || 0,
    });
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProject(true);

    const payload: Record<string, unknown> = {
      name: projectForm.name.trim(),
      budget: Number(projectForm.budget),
      status: projectForm.status,
    };

    if (projectForm.location.trim()) {
      payload.location = projectForm.location.trim();
    }

    const { error } = await supabase.from('projects').insert([payload]);

    if (error && error.message.includes('location')) {
      const retry = await supabase.from('projects').insert([
        {
          name: projectForm.name.trim(),
          budget: Number(projectForm.budget),
          status: projectForm.status,
        },
      ]);
      if (retry.error) {
        alert('Error creating project: ' + retry.error.message);
        setSavingProject(false);
        return;
      }
    } else if (error) {
      alert('Error creating project: ' + error.message);
      setSavingProject(false);
      return;
    }

    setSavingProject(false);
    setShowProjectModal(false);
    setProjectForm({
      name: '',
      location: 'Patna, Bihar',
      budget: 0,
      status: 'ACTIVE',
    });
    loadDashboard();
  };

  const modules = [
    {
      name: 'Enterprise Finance & 3-Way Audit',
      href: '/finance',
      desc: 'PO = GRN = Vendor Bill Matching, GST Ledger & Live P&L',
      icon: Landmark,
    },
    {
      name: 'Purchase Orders (PO)',
      href: '/po',
      desc: 'Material procurement, vendor rates & GST orders',
      icon: ShoppingCart,
    },
    {
      name: 'Bill of Quantities (BOQ)',
      href: '/boq',
      desc: 'Project cost estimation & rate analysis',
      icon: FileSpreadsheet,
    },
    {
      name: 'Daily Progress Report (DPR)',
      href: '/dpr',
      desc: 'Site execution & daily work logs',
      icon: ClipboardCheck,
    },
    {
      name: 'Store Inventory & GRN',
      href: '/inventory',
      desc: 'Site stock receipts & material issues',
      icon: Package,
    },
    {
      name: 'Contractor Bills & MB',
      href: '/contractor-bills',
      desc: 'Measurement Book, Retention & 194C TDS',
      icon: Receipt,
    },
    {
      name: 'Labor Muster Roll',
      href: '/labor',
      desc: 'Site workforce attendance & wage sheets',
      icon: HardHat,
    },
    {
      name: 'Real Estate Sales & Milestones',
      href: '/milestones',
      desc: 'Unit booking & customer payment schedules',
      icon: Building2,
    },
    {
      name: 'Analytics & MIS Reports',
      href: '/analytics',
      desc: 'Executive cashflow & project performance insights',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      {/* Top Action Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold tracking-wider text-blue-700 uppercase">
            Universal Engicon Pvt. Ltd. â€¢ MD Command Center
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">Executive ERP Dashboard</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowProjectModal(true)}
            style={{ backgroundColor: '#1d4ed8', color: '#ffffff', padding: '10px 18px', borderRadius: '8px', fontWeight: 700 }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" /> + Add New Project
          </button>

          <Link
            href="/finance"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
          >
            Live P&amp;L &amp; 3-Way Audit <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Active Projects</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.projectsCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Contract Value</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">
            ₹ {stats.totalBudget.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Purchase Orders</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.poCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">3-Way Audit Holds</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">{stats.pendingBills}</p>
        </div>
      </div>

      {/* Active Sites & Projects */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wider text-slate-600 uppercase">
            Active Sites &amp; Projects ({projects.length})
          </h2>
          <button
            type="button"
            onClick={() => setShowProjectModal(true)}
            className="text-xs font-bold text-blue-700 underline"
          >
            + Add New Project / Site
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No projects added yet. Click <strong>+ Add New Project</strong> above to create your first site.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {projects.map((proj) => (
              <div key={proj.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900">{proj.name}</h3>
                    {proj.location && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" /> {proj.location}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    {proj.status || 'ACTIVE'}
                  </span>
                </div>
                <p className="mt-3 border-t border-slate-100 pt-2 font-mono text-sm font-semibold text-blue-700">
                  Budget: ₹ {Number(proj.budget || 0).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enterprise Modules */}
      <h2 className="mb-4 text-sm font-bold tracking-wider text-slate-600 uppercase">
        Enterprise Modules
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-600 hover:shadow-md"
            >
              <div>
                <div className="mb-3 inline-flex rounded-lg bg-blue-50 p-2.5 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-700">{mod.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{mod.desc}</p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-700">
                Open Module <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Modal: Add New Project */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreateProject} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <Building2 className="h-5 w-5 text-blue-700" /> Add New Project / Site
            </h2>

            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block font-semibold">Project / Site Name *</label>
                <input
                  required
                  className="w-full rounded border p-2"
                  placeholder="e.g. Universal Heights - Bailey Road, Patna"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">Site Location / City</label>
                <input
                  className="w-full rounded border p-2"
                  placeholder="e.g. Patna, Bihar"
                  value={projectForm.location}
                  onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-blue-800">
                  Sanctioned Contract / Project Budget (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  className="w-full rounded border-2 border-blue-600 p-2 font-mono font-bold"
                  placeholder="25000000"
                  value={projectForm.budget}
                  onChange={(e) => setProjectForm({ ...projectForm, budget: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">Project Status</label>
                <select
                  className="w-full rounded border p-2"
                  value={projectForm.status}
                  onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                >
                  <option value="ACTIVE">ACTIVE (Ongoing Execution)</option>
                  <option value="PLANNING">PLANNING / MOBILIZATION</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                className="rounded border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProject}
                className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
              >
                {savingProject ? 'Saving...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
