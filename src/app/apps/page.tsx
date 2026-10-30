'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Rocket, Play, Sparkles, GitBranch } from 'lucide-react';
import { ScenarioShell } from '@/components/layout/ScenarioShell';
import { useWorkspace } from '@/components/providers/SessionProviderWrapper';

type WorkflowApp = {
  id: string;
  name: string;
  description: string;
  category: string;
  isPublishedApp: boolean;
};

function WorkflowAppsContent() {
  const searchParams = useSearchParams();
  const { refreshWorkspace } = useWorkspace();

  const [apps, setApps] = useState<WorkflowApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<WorkflowApp | null>(null);
  const [promptInput, setPromptInput] = useState(
    'Isometric dark fantasy relic chest with glowing cyan runes'
  );
  const [running, setRunning] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<
    Array<{ id: string; title: string; dataUrl: string; toolBadge: string }>
  >([]);

  useEffect(() => {
    fetch('/api/v1/workflows')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          const all = [...(d.customWorkflows || []), ...(d.systemTemplates || [])];
          setApps(all);
          const requestedId = searchParams.get('workflowId');
          const found = all.find((a: WorkflowApp) => a.id === requestedId) || all[0];
          if (found) setSelectedApp(found);
        }
      })
      .catch(() => {});
  }, [searchParams]);

  async function handleRunApp(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedApp) return;
    setRunning(true);
    try {
      const res = await fetch(`/api/v1/workflows/${selectedApp.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: { prompt: promptInput },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const assets = (data.nodeOutputs || [])
          .filter((n: { asset?: unknown }) => Boolean(n.asset))
          .map((n: { asset: { id: string; title: string; dataUrl: string; toolBadge: string } }) => n.asset);
        setGeneratedAssets(assets);
        await refreshWorkspace();
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <ScenarioShell>
      <div className="mx-auto max-w-[1440px] space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white">Workflow Apps</h1>
            <p className="text-xs text-zinc-400">
              Run complex multi-node workflow graphs via simplified single-click team forms.
            </p>
          </div>
          <Link
            href="/workflows"
            className="flex items-center gap-1.5 rounded-xl border border-[#2c2c35] bg-[#18181f] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-[#0099ff]"
          >
            <GitBranch className="h-3.5 w-3.5 text-[#0099ff]" /> Manage Node Graphs
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* App Selector List */}
          <div className="space-y-3 lg:col-span-5">
            {apps.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => setSelectedApp(app)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedApp?.id === app.id
                    ? 'border-[#0099ff] bg-[#0099ff]/10'
                    : 'border-[#25252e] bg-[#141418] hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-[#0099ff]/20 px-2 py-0.5 text-[10px] font-bold text-[#0099ff]">
                    {app.category}
                  </span>
                  <Rocket className="h-4 w-4 text-amber-400" />
                </div>
                <h3 className="mt-2 text-sm font-bold text-white">{app.name}</h3>
                <p className="mt-1 text-xs text-zinc-400">{app.description}</p>
              </button>
            ))}
          </div>

          {/* Interactive App Runner Panel */}
          <div className="rounded-2xl border border-[#25252e] bg-[#141418] p-6 lg:col-span-7">
            {selectedApp ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-[#23232c] pb-4">
                  <div>
                    <span className="text-[11px] font-semibold text-[#0099ff]">
                      PUBLISHED WORKFLOW APP
                    </span>
                    <h2 className="text-base font-bold text-white">{selectedApp.name}</h2>
                  </div>
                  <Link
                    href={`/workflows/${selectedApp.id}`}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Inspect Graph →
                  </Link>
                </div>

                <form onSubmit={handleRunApp} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                      Input Subject Prompt
                    </label>
                    <textarea
                      rows={3}
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] p-3 text-xs text-white outline-none focus:border-[#0099ff]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={running}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0099ff] py-3 text-xs font-bold text-white hover:bg-[#0080db] disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" />
                    {running ? 'Running Multi-Node Pipeline...' : 'Execute Workflow App'}
                  </button>
                </form>

                {generatedAssets.length > 0 && (
                  <div className="space-y-3 border-t border-[#23232c] pt-4">
                    <h3 className="text-xs font-bold text-emerald-400">
                      Pipeline Output Artifacts ({generatedAssets.length})
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {generatedAssets.map((asset) => (
                        <div
                          key={asset.id}
                          className="overflow-hidden rounded-xl border border-[#2a2a33] bg-[#0e0e12]"
                        >
                          <img
                            src={asset.dataUrl}
                            alt={asset.title}
                            className="aspect-square w-full object-cover"
                          />
                          <div className="flex items-center justify-between p-2.5 text-xs">
                            <span className="font-semibold text-white">{asset.toolBadge}</span>
                            <a
                              href={asset.dataUrl}
                              download={`${asset.toolBadge}-${asset.id}.svg`}
                              className="text-[#0099ff] hover:underline"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </ScenarioShell>
  );
}

export default function WorkflowAppsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b0b0c]" />}>
      <WorkflowAppsContent />
    </Suspense>
  );
}
