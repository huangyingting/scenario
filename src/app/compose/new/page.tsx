'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Sparkles,
  Save,
  Trash2,
  Sliders,
} from 'lucide-react';
import { ScenarioShell } from '@/components/layout/ScenarioShell';
import { SYSTEM_MODELS } from '@/lib/system-catalog';

type LoraSlot = {
  modelId: string;
  name: string;
  weight: number;
};

export default function ModelComposeStudioPage() {
  const router = useRouter();
  const baseModels = SYSTEM_MODELS.filter((m) => m.type === 'base' && m.modality === 'image');
  const availableLoras = SYSTEM_MODELS.filter((m) => m.type === 'lora');

  const [compositionName, setCompositionName] = useState('Dark Fantasy Isometric Blend');
  const [baseModelId, setBaseModelId] = useState(baseModels[0]?.id || 'model_flux-1-dev');
  const [loras, setLoras] = useState<LoraSlot[]>([
    {
      modelId: availableLoras[0]?.id || 'model_lora-isometric-rpg',
      name: availableLoras[0]?.name || 'Isometric RPG Dungeon Tile LoRA',
      weight: 0.75,
    },
    {
      modelId: availableLoras[1]?.id || 'model_lora-stylized-cel',
      name: availableLoras[1]?.name || 'Stylized Anime Cel-Shader LoRA',
      weight: 0.45,
    },
  ]);

  const [testPrompt, setTestPrompt] = useState(
    'Isometric obsidian altar glowing with arcane blue runes'
  );
  const [testPreviewUrl, setTestPreviewUrl] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load any custom trained LoRAs as well
    fetch('/api/v1/models?type=lora').catch(() => {});
  }, []);

  function handleAddLoraSlot() {
    if (loras.length >= 5) return;
    const candidate = availableLoras[loras.length % availableLoras.length];
    if (!candidate) return;
    setLoras((prev) => [
      ...prev,
      { modelId: candidate.id, name: candidate.name, weight: 0.5 },
    ]);
  }

  async function handleTestPlayground(e: React.FormEvent) {
    e.preventDefault();
    setTesting(true);
    try {
      const weightSummary = loras
        .map((l) => `${l.name} (${l.weight.toFixed(2)})`)
        .join(' + ');
      const res = await fetch('/api/v1/inferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modality: 'image',
          modelId: baseModelId,
          prompt: `${testPrompt} — Composed LoRAs: ${weightSummary}`,
          parameters: { aspectRatio: '1:1', numSamples: 1 },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.assets?.[0]?.dataUrl) {
          setTestPreviewUrl(data.assets[0].dataUrl);
        }
      }
    } finally {
      setTesting(false);
    }
  }

  async function handleSaveComposition() {
    setSaving(true);
    try {
      const res = await fetch('/api/v1/models/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: compositionName,
          baseModelId,
          loras,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/create?mode=image&modelId=${data.model.id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScenarioShell fullHeight>
      <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden md:flex-row">
        {/* LEFT ELEMENTS DOCK (Replicating Screenshot 26: 26-app-model-compose-new.png) */}
        <aside className="flex w-full shrink-0 flex-col border-b border-[#23232b] bg-[#121216] p-5 md:h-full md:w-[400px] md:border-b-0 md:border-r">
          <div className="flex items-center justify-between border-b border-[#23232c] pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#0099ff]" />
              <h1 className="text-sm font-bold text-white">Elements</h1>
            </div>
            <Link href="/models" className="text-xs text-zinc-400 hover:text-white">
              All Models
            </Link>
          </div>

          <div className="mt-4 flex-1 space-y-5 overflow-y-auto">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                Composition Name
              </label>
              <input
                type="text"
                value={compositionName}
                onChange={(e) => setCompositionName(e.target.value)}
                className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#0099ff]"
              />
            </div>

            {/* Base Model Selector */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                Base Model
              </label>
              <select
                value={baseModelId}
                onChange={(e) => setBaseModelId(e.target.value)}
                className="w-full rounded-xl border border-[#2c2c35] bg-[#18181f] px-3 py-2.5 text-xs font-semibold text-white outline-none"
              >
                {baseModels.map((bm) => (
                  <option key={bm.id} value={bm.id}>
                    {bm.name} ({bm.baseModelFamily})
                  </option>
                ))}
              </select>
            </div>

            {/* Up to 5 Weighted LoRA Adapters */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">
                  Styles &amp; Concepts ({loras.length}/5 LoRAs)
                </span>
                {loras.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddLoraSlot}
                    className="flex items-center gap-1 text-xs font-semibold text-[#0099ff] hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Adapter
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {loras.map((slot, idx) => (
                  <div
                    key={`${slot.modelId}-${idx}`}
                    className="rounded-xl border border-[#262630] bg-[#18181f] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={slot.modelId}
                        onChange={(e) => {
                          const picked = availableLoras.find((a) => a.id === e.target.value);
                          if (!picked) return;
                          setLoras((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, modelId: picked.id, name: picked.name }
                                : item
                            )
                          );
                        }}
                        className="flex-1 rounded-lg border border-[#2c2c35] bg-[#0e0e12] px-2.5 py-1.5 text-xs font-semibold text-white"
                      >
                        {availableLoras.map((al) => (
                          <option key={al.id} value={al.id}>
                            {al.name}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setLoras((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400">
                      <span>Adapter Weight</span>
                      <span className="font-mono font-bold text-[#0099ff]">
                        {slot.weight.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-1}
                      max={2}
                      step={0.05}
                      value={slot.weight}
                      onChange={(e) => {
                        const w = Number(e.target.value);
                        setLoras((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, weight: w } : item))
                        );
                      }}
                      className="mt-1 w-full accent-[#0099ff]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleSaveComposition}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0099ff] py-3 text-xs font-bold text-white hover:bg-[#0080db] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving Composed Model...' : 'Save Model'}
          </button>
        </aside>

        {/* CENTER TEST PLAYGROUND (Replicating Screenshot 26) */}
        <section className="flex flex-1 flex-col justify-between bg-[#0b0b0c] p-6">
          <div className="flex items-center justify-between border-b border-[#22222a] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Test Playground</h2>
              <p className="text-xs text-zinc-400">
                Preview how your weighted LoRA adapters blend before saving as a reusable studio model.
              </p>
            </div>
          </div>

          <div className="my-6 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[#26262f] bg-[#111115] p-6">
            {testPreviewUrl ? (
              <img
                src={testPreviewUrl}
                alt="Composed LoRA Preview"
                className="max-h-[55vh] rounded-2xl border border-[#2c2c36] object-contain shadow-2xl"
              />
            ) : (
              <div className="text-center">
                <Sparkles className="mx-auto h-10 w-10 text-[#0099ff]" />
                <p className="mt-2 text-xs font-semibold text-zinc-300">
                  Enter a test prompt below to sample your composed LoRA weights
                </p>
              </div>
            )}
          </div>

          <form
            onSubmit={handleTestPlayground}
            className="flex items-center gap-3 rounded-2xl border border-[#2a2a33] bg-[#141418] p-2.5"
          >
            <input
              type="text"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Write a prompt to test your model blend..."
              className="flex-1 bg-transparent px-3 text-xs text-white outline-none"
            />
            <button
              type="submit"
              disabled={testing}
              className="flex items-center gap-1.5 rounded-xl bg-[#0099ff] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0080db] disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {testing ? 'Sampling...' : 'Generate Preview'}
            </button>
          </form>
        </section>
      </div>
    </ScenarioShell>
  );
}
