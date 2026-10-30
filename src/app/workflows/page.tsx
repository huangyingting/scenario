'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  GitBranch,
  Play,
  Rocket,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ScenarioShell } from '@/components/layout/ScenarioShell';

type WorkflowItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  isPublishedApp: boolean;
  appSlug?: string | null;
  nodesJson: string;
  edgesJson: string;
  updatedAt?: string;
  isSystemTemplate?: boolean;
};

export default function WorkflowsHubPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'all' | 'custom' | 'runs'>('all');
  const [search, setSearch] = useState('');
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [runs, setRuns] = useState<
    Array<{
      id: string;
      status: string;
      totalOscuCost: number;
      createdAt: string;
      workflow?: { name: string };
    }>
  >([]);
  const [creating, setCreating] = useState(false);

  async function loadWorkflows() {
    const res = await fetch('/api/v1/workflows');
    if (res.ok) {
      const data = await res.json();
      setWorkflows([...(data.customWorkflows || []), ...(data.systemTemplates || [])]);
      setRuns(data.recentRuns || []);
    }
  }

  useEffect(() => {
    loadWorkflows();
  }, []);

  async function handleCreateBlankWorkflow() {
    setCreating(true);
    try {
      const res = await fetch('/api/v1/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Untitled Workflow Graph',
          description: 'Custom multi-modal DAG pipeline',
          category: 'Custom',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/workflows/${data.workflow.id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  const filtered = workflows.filter((w) => {
    if (tab === 'custom' && w.isSystemTemplate) return false;
    if (
      search.trim() &&
      !w.name.toLowerCase().includes(search.toLowerCase()) &&
      !w.description.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <ScenarioShell>
      <div className="mx-auto max-w-[1440px] space-y-6 p-6">
        {/* Header Bar (Replicating Screenshot 21: 21-app-workflows-hub.png) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-[#25252e] bg-[#141418] p-1">
            {[
              { id: 'all', label: 'Workflows' },
              { id: 'custom', label: 'My Workspace Graphs' },
              { id: 'runs', label: `Runs (${runs.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as typeof tab)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  tab === t.id
                    ? 'bg-[#0099ff] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workflows..."
                className="w-full rounded-xl border border-[#26262f] bg-[#141418] py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-[#0099ff]"
              />
            </div>

            <Link
              href="/apps"
              className="flex items-center gap-1.5 rounded-xl border border-[#2c2c35] bg-[#18181f] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-500"
            >
              <Rocket className="h-3.5 w-3.5 text-amber-400" /> Workflow Apps
            </Link>

            <button
              type="button"
              disabled={creating}
              onClick={handleCreateBlankWorkflow}
              className="flex items-center gap-1.5 rounded-xl bg-[#0099ff] px-4 py-2 text-xs font-bold text-white hover:bg-[#0080db]"
            >
              <Plus className="h-4 w-4" />
              {creating ? 'Creating...' : 'Create a Workflow'}
            </button>
          </div>
        </div>

        {tab === 'runs' ? (
          <div className="rounded-2xl border border-[#24242d] bg-[#141418] p-5">
            <h2 className="mb-4 text-sm font-bold text-white">Recent Workflow Execution Runs</h2>
            {runs.length === 0 ? (
              <p className="text-xs text-zinc-400">
                No workflow runs recorded yet. Open a workflow graph and click Run Workflow.
              </p>
            ) : (
              <div className="space-y-2.5">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between rounded-xl border border-[#25252e] bg-[#191920] px-4 py-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                        {run.status}
                      </span>
                      <span className="font-semibold text-white">
                        {run.workflow?.name || 'Workflow Graph'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-zinc-400">
                      <span>{run.totalOscuCost} CU</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(run.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((wf) => {
              let nodeCount = 4;
              try {
                nodeCount = JSON.parse(wf.nodesJson || '[]').length;
              } catch {
                // ignore
              }
              return (
                <div
                  key={wf.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#24242d] bg-[#141418] p-5 transition hover:border-[#0099ff]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-[#0099ff]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#0099ff]">
                        {wf.category}
                      </span>
                      <span className="text-[11px] text-zinc-400">{nodeCount} Nodes</span>
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-white">{wf.name}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                      {wf.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#22222a] pt-4">
                    <Link
                      href={`/workflows/${wf.id}`}
                      className="flex items-center gap-1.5 rounded-xl bg-[#0099ff] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0080db]"
                    >
                      <GitBranch className="h-3.5 w-3.5" /> Open Node Editor
                    </Link>

                    {wf.isPublishedApp && (
                      <Link
                        href={`/apps?workflowId=${wf.id}`}
                        className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline"
                      >
                        <Play className="h-3.5 w-3.5" /> Launch App
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ScenarioShell>
  );
}
