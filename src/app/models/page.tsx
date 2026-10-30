'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  Sliders,
  Cpu,
  Plus,
  Layers,
  Upload,
  Trash2,
  X,
} from 'lucide-react';
import { ScenarioShell } from '@/components/layout/ScenarioShell';
import { SYSTEM_MODELS } from '@/lib/system-catalog';

type ModelRecord = {
  id: string;
  name: string;
  description: string;
  type: string;
  modality: string;
  baseModelFamily: string;
  category: string;
  triggerToken?: string;
  oscuCost: number;
  tags?: string[];
  isCustom?: boolean;
};

export default function ModelsHubPage() {
  const [models, setModels] = useState<ModelRecord[]>(SYSTEM_MODELS);
  const [scopeTab, setScopeTab] = useState<'all' | 'public' | 'private' | 'composition' | 'deleted'>('all');
  const [modalityFilter, setModalityFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [newModelModalOpen, setNewModelModalOpen] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/models')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.allModels) setModels(d.allModels);
      })
      .catch(() => {});
  }, []);

  const filteredModels = models.filter((m) => {
    if (scopeTab === 'deleted') return false;
    if (scopeTab === 'public' && m.isCustom) return false;
    if (scopeTab === 'private' && !m.isCustom) return false;
    if (scopeTab === 'composition' && m.type !== 'composition') return false;
    if (modalityFilter !== 'all' && m.modality !== modalityFilter) return false;
    if (
      search.trim() &&
      !m.name.toLowerCase().includes(search.toLowerCase()) &&
      !m.description.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <ScenarioShell>
      <div className="mx-auto max-w-[1440px] space-y-6 p-6">
        {/* Top Action & Filter Bar (Replicating Screenshot 24 & 49: 49-app-new-model-modal.png) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 rounded-xl border border-[#25252e] bg-[#141418] p-1">
            {[
              { id: 'all', label: 'All Models' },
              { id: 'public', label: 'Public Platform' },
              { id: 'private', label: 'Private Trained' },
              { id: 'composition', label: 'Compositions' },
              { id: 'deleted', label: 'Recently Deleted' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setScopeTab(t.id as typeof scopeTab)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  scopeTab === t.id
                    ? 'bg-[#0099ff] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models..."
                className="w-full rounded-xl border border-[#26262f] bg-[#141418] py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-[#0099ff]"
              />
            </div>

            <button
              type="button"
              onClick={() => setNewModelModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#2c2c35] bg-[#18181f] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-[#0099ff]"
            >
              <Upload className="h-3.5 w-3.5 text-[#0099ff]" /> + Create / Upload
            </button>

            <Link
              href="/compose/new"
              className="flex items-center gap-1.5 rounded-xl border border-[#2c2c35] bg-[#18181f] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-[#0099ff]"
            >
              <Sliders className="h-3.5 w-3.5 text-[#0099ff]" /> Compose LoRAs
            </Link>

            <Link
              href="/models/trainings"
              className="flex items-center gap-1.5 rounded-xl bg-[#0099ff] px-4 py-2 text-xs font-bold text-white hover:bg-[#0080db]"
            >
              <Plus className="h-4 w-4" /> Train a Model
            </Link>
          </div>
        </div>

        {/* Modality Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Modalities' },
            { id: 'image', label: 'Image & LoRA' },
            { id: 'video', label: 'Video Cinema' },
            { id: '3d', label: '3D Mesh' },
            { id: 'audio', label: 'Audio & SFX' },
            { id: 'text', label: 'Text LLM' },
            { id: 'utility', label: 'Post-Processing' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setModalityFilter(pill.id)}
              className={`rounded-full border px-3.5 py-1 text-xs font-medium transition ${
                modalityFilter === pill.id
                  ? 'border-[#0099ff] bg-[#0099ff]/15 text-white'
                  : 'border-[#25252e] bg-[#141418] text-zinc-400 hover:text-white'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {scopeTab === 'deleted' ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#24242d] bg-[#121216] px-6 py-24 text-center">
            <Trash2 className="h-10 w-10 text-zinc-500" />
            <h3 className="mt-3 text-sm font-bold text-white">No recently deleted models</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Deleted items are kept for 30 days, then permanently removed.
            </p>
          </div>
        ) : (
        /* Models Grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              className="flex flex-col justify-between rounded-2xl border border-[#24242d] bg-[#141418] p-5 transition hover:border-[#0099ff]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-[#0099ff]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#0099ff]">
                    {model.type} · {model.modality}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-400">
                    {model.oscuCost} CU
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-bold text-white">{model.name}</h3>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Family: {model.baseModelFamily} · {model.category}
                </p>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-400">
                  {model.description}
                </p>

                {model.triggerToken && (
                  <div className="mt-2 inline-block rounded bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-amber-300">
                    Trigger: {model.triggerToken}
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#22222a] pt-3.5">
                <Link
                  href={`/create?mode=${
                    model.modality === 'utility' ? 'upscale' : model.modality
                  }&modelId=${model.id}`}
                  className="flex items-center gap-1.5 rounded-xl bg-[#0099ff] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#0080db]"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Use Model
                </Link>

                {model.type === 'lora' && (
                  <Link
                    href={`/compose/new?loraId=${model.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-zinc-300 hover:text-white"
                  >
                    <Layers className="h-3.5 w-3.5 text-[#0099ff]" /> Compose
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
        )}

        {/* New Model 3-Card Modal (Replicating Screenshot 49: 49-app-new-model-modal.png) */}
        {newModelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl rounded-2xl border border-[#2a2a34] bg-[#141418] p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#24242d] pb-4">
                <h2 className="text-base font-bold text-white">New Model</h2>
                <button
                  type="button"
                  onClick={() => setNewModelModalOpen(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {/* Card 1: Train your own model */}
                <div className="flex flex-col justify-between rounded-2xl border border-[#272732] bg-[#191920] p-5">
                  <div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#24242e] text-white">
                      <Layers className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-white">Train your own model</h3>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                      Upload images to train a custom LoRA model. Emulate styles, subjects, or themes. Custom models can be later merged to amplify the creative palette.
                    </p>
                  </div>
                  <Link
                    href="/models/trainings"
                    className="mt-6 block w-full rounded-xl bg-[#0099ff] py-2.5 text-center text-xs font-bold text-white hover:bg-[#0080db]"
                  >
                    Start Training
                  </Link>
                </div>

                {/* Card 2: Compose models */}
                <div className="flex flex-col justify-between rounded-2xl border border-[#272732] bg-[#191920] p-5">
                  <div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#24242e] text-white">
                      <Sliders className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-white">Compose models</h3>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                      Mix &amp; Match models (&ldquo;multi-LoRA&rdquo;), combining diverse artistic styles and subjects. Adjust the blend to craft a model that&apos;s uniquely yours – no training images required.
                    </p>
                  </div>
                  <Link
                    href="/compose/new"
                    className="mt-6 block w-full rounded-xl bg-[#0099ff] py-2.5 text-center text-xs font-bold text-white hover:bg-[#0080db]"
                  >
                    Start Composing
                  </Link>
                </div>

                {/* Card 3: Upload a model */}
                <div className="flex flex-col justify-between rounded-2xl border border-[#272732] bg-[#191920] p-5">
                  <div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#24242e] text-white">
                      <Upload className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-white">Upload a model</h3>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                      Import a pre-trained model from your computer or a web URL (HuggingFace, CivitAI). Scenario supports safetensors, zip, gzip and .gz files.
                    </p>
                    <input
                      type="text"
                      value={uploadUrl}
                      onChange={(e) => setUploadUrl(e.target.value)}
                      placeholder="https://huggingface.co/... (.safetensors)"
                      className="mt-3 w-full rounded-xl border border-[#2c2c38] bg-[#111116] px-3 py-2 text-xs text-white outline-none focus:border-[#0099ff]"
                    />
                    {uploadStatus && (
                      <p className="mt-2 text-[11px] font-medium text-emerald-400">{uploadStatus}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setUploadStatus(
                        `Queued model import (${uploadUrl || 'local .safetensors weights'})`
                      )
                    }
                    className="mt-6 w-full rounded-xl bg-[#0099ff] py-2.5 text-center text-xs font-bold text-white hover:bg-[#0080db]"
                  >
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScenarioShell>
  );
}
