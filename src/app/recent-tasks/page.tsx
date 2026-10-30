'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  Loader2,
  Sparkles,
  Cpu,
  Download,
  ExternalLink,
} from 'lucide-react';
import { ScenarioShell } from '@/components/layout/ScenarioShell';

type TaskRecord = {
  id: string;
  category: 'Generation' | 'Training' | 'Enhancement' | 'Export';
  title: string;
  modelName: string;
  status: 'active' | 'completed';
  progress: number;
  oscuCost: number;
  createdAt: string;
  href: string;
};

export default function RecentTasksPage() {
  const [activeOnly, setActiveOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);

  async function fetchTasks() {
    setLoading(true);
    try {
      const [assetsRes, trainingsRes] = await Promise.all([
        fetch('/api/v1/assets').then((r) => (r.ok ? r.json() : { assets: [] })),
        fetch('/api/v1/trainings').then((r) => (r.ok ? r.json() : { jobs: [] })),
      ]);

      const assetTasks: TaskRecord[] = (assetsRes.assets || []).slice(0, 12).map(
        (a: {
          id: string;
          title: string;
          modelName: string;
          modality: string;
          createdAt: string;
        }) => ({
          id: `task_asset_${a.id}`,
          category:
            a.modality === 'upscale' || a.modality === 'remove-bg'
              ? 'Enhancement'
              : 'Generation',
          title: a.title || 'Generated Asset',
          modelName: a.modelName || 'FLUX.1 Dev',
          status: 'completed',
          progress: 100,
          oscuCost: 10,
          createdAt: new Date(a.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          href: '/assets',
        })
      );

      const trainingTasks: TaskRecord[] = (trainingsRes.jobs || []).map(
        (j: {
          id: string;
          name: string;
          baseModelFamily: string;
          status: string;
          currentEpoch: number;
          totalEpochs: number;
          oscuCost: number;
          createdAt: string;
        }) => ({
          id: `task_train_${j.id}`,
          category: 'Training',
          title: `LoRA Training: ${j.name}`,
          modelName: j.baseModelFamily || 'Flux 2',
          status: j.status === 'running' ? 'active' : 'completed',
          progress: Math.round(((j.currentEpoch || 12) / (j.totalEpochs || 12)) * 100),
          oscuCost: j.oscuCost || 120,
          createdAt: new Date(j.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          href: '/models/trainings',
        })
      );

      setTasks([...trainingTasks, ...assetTasks]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  const visibleTasks = tasks.filter((t) => (!activeOnly ? true : t.status === 'active'));

  return (
    <ScenarioShell>
      <div className="mx-auto max-w-[1160px] space-y-6 px-6 py-8">
        {/* Header (Replicating Screenshot 52: 52-app-recent-tasks-monitor.png) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-white">Recent Tasks</h1>

          <div className="flex items-center gap-2.5">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#26262f] bg-[#141418] px-3.5 py-1.5 text-xs font-medium text-zinc-200">
              <span>Active</span>
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="accent-[#0099ff]"
              />
            </label>

            <button
              type="button"
              onClick={fetchTasks}
              className="flex items-center gap-1.5 rounded-xl border border-[#26262f] bg-[#141418] px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-500 hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tasks Queue */}
        {visibleTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#22222a] bg-[#111115] px-6 py-24 text-center">
            <FolderOpen className="h-10 w-10 text-zinc-500" />
            <h2 className="mt-3 text-sm font-bold text-white">No recent tasks</h2>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-zinc-400">
              Your generations, edits, enhancements, model trainings, model uploads and downloads, and bulk asset downloads will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleTasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#24242d] bg-[#141418] p-4 transition hover:border-[#343442]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c1c24] text-[#0099ff]">
                    {task.category === 'Training' ? (
                      <Cpu className="h-5 w-5" />
                    ) : task.category === 'Export' ? (
                      <Download className="h-5 w-5" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#22222c] px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-300">
                        {task.category}
                      </span>
                      <span className="text-xs font-bold text-white">{task.title}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-zinc-400">
                      Model: {task.modelName} · {task.oscuCost} CU · {task.createdAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-36">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-zinc-300">
                        {task.status === 'active' ? 'In Progress' : 'Completed'}
                      </span>
                      <span className="font-mono text-zinc-400">{task.progress}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full ${
                          task.status === 'active' ? 'bg-[#0099ff]' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>

                  {task.status === 'active' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#0099ff]" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  )}

                  <Link
                    href={task.href}
                    className="flex items-center gap-1 rounded-lg border border-[#2c2c35] bg-[#1a1a22] px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScenarioShell>
  );
}
