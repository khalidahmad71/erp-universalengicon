'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MilestoneItem {
  id: string;
  milestone_name: string;
  responsible_engineer: string;
  target_completion_date: string;
  completion_percentage: number;
  milestone_status: string;
}

export default function MilestonesModule() {
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Progress update state
  const [editingMilestone, setEditingMilestone] = useState<MilestoneItem | null>(null);
  const [progressInput, setProgressInput] = useState<number>(0);
  const [savingProgress, setSavingProgress] = useState<boolean>(false);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .order('target_completion_date', { ascending: true });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setMilestones((data as MilestoneItem[]) || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const openProgressEditor = (m: MilestoneItem) => {
    setEditingMilestone(m);
    setProgressInput(Number(m.completion_percentage ?? 0));
  };

  const handleSaveMilestoneProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;

    const clampedProgress = Math.max(0, Math.min(100, Number(progressInput)));
    const nextStatus =
      clampedProgress === 100
        ? 'Completed'
        : clampedProgress > 0
        ? 'In Progress'
        : 'Pending';

    setSavingProgress(true);
    setErrorMsg(null);

    const { error } = await supabase
      .from('milestones')
      .update({
        completion_percentage: clampedProgress,
        milestone_status: nextStatus,
      })
      .eq('id', editingMilestone.id);

    setSavingProgress(false);

    if (error) {
      setErrorMsg(`Update failed: ${error.message}`);
      return;
    }

    setEditingMilestone(null);
    await fetchMilestones();
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-5">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Project Milestones</h1>
          <p className="text-xs text-slate-500">
            Track construction progress and update completion percentages
          </p>
        </div>
        <button
          type="button"
          onClick={fetchMilestones}
          className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs font-medium rounded border border-red-200 bg-red-50 text-red-700">
          {errorMsg}
        </div>
      )}

      {editingMilestone && (
        <form
          onSubmit={handleSaveMilestoneProgress}
          className="bg-white p-4 rounded-lg border border-blue-200 shadow-2xs flex flex-wrap items-end gap-4"
        >
          <div className="flex-1 min-w-[220px]">
            <p className="text-xs text-slate-500">Updating Milestone</p>
            <p className="text-sm font-bold text-slate-900">
              {editingMilestone.milestone_name}
            </p>
          </div>

          <div className="w-36">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Completion (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={progressInput}
              onChange={(e) => setProgressInput(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-600"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={savingProgress}
              className="px-4 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors"
            >
              {savingProgress ? 'Saving...' : 'Save Progress'}
            </button>
            <button
              type="button"
              onClick={() => setEditingMilestone(null)}
              className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto shadow-2xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
              <th className="py-3 px-4">Milestone</th>
              <th className="py-3 px-4 text-center">Target Date</th>
              <th className="py-3 px-4 text-center">Progress</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-6 px-4 text-center text-xs text-slate-500">
                  Loading milestones...
                </td>
              </tr>
            ) : milestones.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 px-4 text-center text-xs text-slate-500">
                  No milestones found.
                </td>
              </tr>
            ) : (
              milestones.map((m) => (
                <tr key={m.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">
                      {m.milestone_name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Engineer: {m.responsible_engineer}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs font-semibold text-slate-700">
                    {m.target_completion_date}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full"
                          style={{ width: `${m.completion_percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {m.completion_percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        m.completion_percentage === 100
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {m.milestone_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openProgressEditor(m)}
                      className="px-3 py-1 text-xs font-semibold rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 transition-colors"
                    >
                      Update %
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}