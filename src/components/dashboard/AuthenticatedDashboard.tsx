'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ArrowUp,
  Image as ImageIcon,
  Video,
  Box,
  Volume2,
  Wand2,
  Scissors,
  PenTool,
  Layers,
  Globe,
  Cpu,
  Grid,
  ChevronRight,
  Play,
  Sparkles,
} from 'lucide-react';
import { ScenarioShell } from '@/components/layout/ScenarioShell';
import { SYSTEM_MODELS } from '@/lib/system-catalog';

type WorkflowSummary = {
  id: string;
  name: string;
  description: string;
  category: string;
  oscuEstimate: number;
};

type AssetSummary = {
  id: string;
  title: string;
  prompt: string;
  modality: string;
  toolBadge: string;
  modelName: string;
  dataUrl: string;
};

const WORKFLOW_CATEGORIES = [
  'All',
  'Get Started',
  'Characters',
  'Environments',
  'Props',
  'Post-Processing',
  'Video & Animation',
  'Game Art',
  '3D & Worldbuilding',
];

export function AuthenticatedDashboard() {
  const router = useRouter();
  const [heroPrompt, setHeroPrompt] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('model_gemini-3-1');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [activeWfCategory, setActiveWfCategory] = useState('All');
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [recentAssets, setRecentAssets] = useState<AssetSummary[]>([]);

  useEffect(() => {
    fetch('/api/v1/workflows')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.workflows) setWorkflows(d.workflows);
      })
      .catch(() => {});

    fetch('/api/v1/assets')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.assets) setRecentAssets(d.assets.slice(0, 8));
      })
      .catch(() => {});
  }, []);

  function handleHeroSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = heroPrompt.trim() || 'Isometric dark fantasy paladin concept art';
    router.push(
      `/create?mode=image&modelId=${encodeURIComponent(
        selectedModelId
      )}&aspectRatio=${encodeURIComponent(aspectRatio)}&prompt=${encodeURIComponent(q)}`
    );
  }

  const filteredWorkflows = workflows.filter((w) => {
    if (activeWfCategory === 'All' || activeWfCategory === 'Get Started') return true;
    return w.category.toLowerCase().includes(activeWfCategory.toLowerCase().split(' ')[0]);
  });

  return (
    <ScenarioShell>
      <div className="mx-auto max-w-[1360px] px-4 py-8 sm:px-8">
        {/* 1. Hero Prompt Section (Replicating Screenshot 07: "What do you want to make?") */}
        <section className="mx-auto max-w-3xl pt-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            What do you want to make?
          </h1>

          <form
            onSubmit={handleHeroSubmit}
            className="mt-5 rounded-2xl border border-[#2a2a33] bg-[#151519] p-3.5 shadow-2xl transition focus-within:border-[#0099ff]/70"
          >
            <textarea
              rows={2}
              value={heroPrompt}
              onChange={(e) => setHeroPrompt(e.target.value)}
              placeholder="Create anything..."
              className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#23232b] pt-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/create?mode=image"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[#2e2e38] bg-[#1e1e24] text-zinc-300 hover:border-zinc-500 hover:text-white"
                  title="Attach Reference Asset"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Link>

                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="rounded-full border border-[#2e2e38] bg-[#1e1e24] px-3 py-1 text-xs font-medium text-zinc-200 outline-none hover:border-zinc-500"
                >
                  {SYSTEM_MODELS.slice(0, 8).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="rounded-full border border-[#2e2e38] bg-[#1e1e24] px-2.5 py-1 text-xs font-medium text-zinc-300 outline-none hover:border-zinc-500"
                >
                  <option value="1:1">1:1</option>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="4:3">4:3</option>
                </select>
              </div>

              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-black transition hover:bg-white"
                title="Generate in Studio"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Quick Action Pills below Hero Prompt */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
            {[
              { label: 'Create an image', href: '/create?mode=image', icon: ImageIcon },
              { label: 'Generate a video', href: '/create?mode=video', icon: Video },
              { label: 'Train a model', href: '/models/trainings', icon: Cpu },
              { label: 'Explore all tools', href: '/apps', icon: Grid },
            ].map((pill) => (
              <Link
                key={pill.label}
                href={pill.href}
                className="flex items-center gap-1.5 rounded-full border border-[#272730] bg-[#141418] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                <pill.icon className="h-3.5 w-3.5 text-zinc-400" />
                {pill.label}
              </Link>
            ))}
          </div>
        </section>

        {/* 2. Featured Spotlight Banner (Replicating Screenshot 07: "Previs to Picture") */}
        <section className="mt-9">
          <div className="relative overflow-hidden rounded-2xl border border-[#282832] bg-gradient-to-r from-[#121826] via-[#17253b] to-[#0f172a] p-6 sm:p-8">
            <div className="relative z-10 max-w-xl">
              <span className="inline-block rounded-md bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
                Production Pipeline Spotlight
              </span>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Previs to Picture
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-300 sm:text-sm">
                Explore how top game studios and filmmakers use Scenario to shape early visual concepts into production-ready 2D, 3D, and video assets.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link
                  href="/workflows"
                  className="rounded-lg bg-[#0099ff] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[#0080db]"
                >
                  Overview
                </Link>
                <Link
                  href="/create?mode=image"
                  className="rounded-lg border border-white/20 bg-black/30 px-4 py-2 text-xs font-semibold text-white hover:bg-black/50"
                >
                  Create your own
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Tools Horizontal Dock (Replicating Screenshot 08) */}
        <section className="mt-10">
          <h2 className="mb-3.5 text-sm font-bold text-white">Tools</h2>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-9">
            {[
              { label: 'Images', href: '/create?mode=image', icon: ImageIcon, color: 'text-sky-400' },
              { label: 'Video', href: '/create?mode=video', icon: Video, color: 'text-indigo-400' },
              { label: '3D', href: '/create?mode=3d', icon: Box, color: 'text-teal-400' },
              { label: 'Audio', href: '/create?mode=audio', icon: Volume2, color: 'text-amber-400' },
              { label: 'Enhance', href: '/create?mode=upscale', icon: Wand2, color: 'text-blue-400' },
              { label: 'Remove Background', href: '/create?mode=remove-bg', icon: Scissors, color: 'text-pink-400' },
              { label: 'Canvas', href: '/canvas/new', icon: PenTool, color: 'text-emerald-400' },
              { label: 'Textures', href: '/create?mode=texture', icon: Layers, color: 'text-orange-400' },
              { label: 'Skyboxes', href: '/create?mode=skybox', icon: Globe, color: 'text-cyan-400' },
            ].map((tool) => (
              <Link
                key={tool.label}
                href={tool.href}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#24242d] bg-[#141418] p-3.5 text-center transition hover:border-[#0099ff]/60 hover:bg-[#191920]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900">
                  <tool.icon className={`h-4 w-4 ${tool.color}`} />
                </div>
                <span className="text-[11px] font-medium text-zinc-200">{tool.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. Workflows Section (Replicating Screenshot 08) */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Workflows</h2>
            <Link
              href="/workflows"
              className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white"
            >
              See all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {WORKFLOW_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveWfCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  activeWfCategory === cat
                    ? 'bg-white text-black'
                    : 'border border-[#25252e] bg-[#141418] text-zinc-300 hover:border-zinc-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWorkflows.map((wf) => (
              <div
                key={wf.id}
                className="group flex flex-col justify-between rounded-2xl border border-[#25252e] bg-[#141418] p-4 transition hover:border-[#0099ff]/60"
              >
                <div>
                  <div className="mb-3 flex h-36 items-center justify-between overflow-hidden rounded-xl border border-[#24242d] bg-gradient-to-br from-[#121929] via-[#1a1333] to-[#0d1f22] p-4">
                    <div className="space-y-1">
                      <span className="inline-block rounded bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-[#0099ff]">
                        {wf.category}
                      </span>
                      <p className="text-xs font-semibold text-zinc-200">Before → After DAG</p>
                      <p className="text-[11px] text-zinc-400">~{wf.oscuEstimate} CU per run</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0099ff] text-white shadow-lg">
                      <Play className="h-4 w-4 fill-current" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white">{wf.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{wf.description}</p>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-[#22222a] pt-3">
                  <Link
                    href={`/workflows/${wf.id}`}
                    className="flex-1 rounded-lg bg-[#1e1e26] py-1.5 text-center text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white"
                  >
                    Open Graph Editor
                  </Link>
                  <Link
                    href={`/apps?workflowId=${wf.id}`}
                    className="flex-1 rounded-lg bg-[#0099ff] py-1.5 text-center text-xs font-semibold text-white hover:bg-[#0080db]"
                  >
                    Run as App
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Recent Project Assets or Starter Models */}
        <section className="mt-10 pb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              {recentAssets.length > 0 ? 'Recent Workspace Assets' : 'Featured Production Models'}
            </h2>
            <Link
              href={recentAssets.length > 0 ? '/assets' : '/models'}
              className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white"
            >
              See all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentAssets.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              {recentAssets.map((asset) => (
                <Link
                  key={asset.id}
                  href="/assets"
                  className="group relative overflow-hidden rounded-xl border border-[#25252e] bg-[#141418]"
                >
                  <img
                    src={asset.dataUrl}
                    alt={asset.title}
                    className="aspect-square w-full object-cover transition group-hover:scale-105"
                  />
                  <span className="absolute bottom-2 left-2 rounded bg-black/75 px-2 py-0.5 text-[10px] font-medium text-zinc-200">
                    {asset.toolBadge}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {SYSTEM_MODELS.slice(0, 4).map((m) => (
                <Link
                  key={m.id}
                  href={`/create?mode=${m.modality}&modelId=${m.id}`}
                  className="rounded-xl border border-[#25252e] bg-[#141418] p-4 transition hover:border-[#0099ff]"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-[#0099ff]/15 px-2 py-0.5 text-[10px] font-semibold text-[#0099ff]">
                      {m.baseModelFamily}
                    </span>
                    <span className="text-[11px] text-zinc-400">{m.oscuCost} CU</span>
                  </div>
                  <h3 className="mt-2.5 text-sm font-bold text-white">{m.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{m.description}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#0099ff]">
                    <Sparkles className="h-3.5 w-3.5" /> Launch in Studio
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </ScenarioShell>
  );
}
