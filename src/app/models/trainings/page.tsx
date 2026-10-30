'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Plus,
  Sparkles,
  CheckCircle2,
  Activity,
  UploadCloud,
} from 'lucide-react';
import { ScenarioShell } from '@/components/layout/ScenarioShell';
import { useWorkspace } from '@/components/providers/SessionProviderWrapper';

type TrainingJobRecord = {
  id: string;
  name: string;
  trainingClass: string;
  baseModel: string;
  triggerToken: string;
  epochs: number;
  learningRate: number;
  datasetCount: number;
  autoCaption: boolean;
  status: string;
  progress: number;
  lossCurveJson: string;
  resultingModelId: string | null;
  createdAt: string;
};

export default function ModelTrainingsPage() {
  const { refreshWorkspace } = useWorkspace();
  const [jobs, setJobs] = useState<TrainingJobRecord[]>([]);
  const [name, setName] = useState('');
  const [trainingClass, setTrainingClass] = useState('Style');
  const [baseModel, setBaseModel] = useState('Flux.1 Dev LoRA');
  const [triggerToken, setTriggerToken] = useState('scen_style');
  const [epochs, setEpochs] = useState(12);
  const [learningRate, setLearningRate] = useState(0.0001);
  const [datasetCount, setDatasetCount] = useState(24);
  const [autoCaption, setAutoCaption] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadTrainings() {
    const res = await fetch('/api/v1/trainings');
    if (res.ok) {
      const data = await res.json();
      setJobs(data.trainings || []);
    }
  }

  useEffect(() => {
    loadTrainings();
  }, []);

  async function handleStartTraining(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          trainingClass,
          baseModel,
          triggerToken: triggerToken.trim() || 'scen_token',
          epochs,
          learningRate,
          datasetCount,
          autoCaption,
        }),
      });
      if (res.ok) {
        setName('');
        await loadTrainings();
        await refreshWorkspace();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScenarioShell>
      <div className="mx-auto max-w-[1440px] space-y-6 p-6">
        {/* Header (Replicating Screenshot 25: 25-app-model-trainings.png) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white">Custom Model Trainings</h1>
            <p className="text-xs text-zinc-400">
              Train proprietary Flux.1 and SDXL LoRA adapters on your studio&apos;s art direction, characters, or isometric tilesets.
            </p>
          </div>
          <Link
            href="/models"
            className="rounded-xl border border-[#2c2c35] bg-[#18181f] px-4 py-2 text-xs font-semibold text-zinc-200 hover:border-[#0099ff]"
          >
            Browse Models Library
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: Start a Training Wizard */}
          <form
            onSubmit={handleStartTraining}
            className="space-y-4 rounded-2xl border border-[#25252e] bg-[#141418] p-6 lg:col-span-5"
          >
            <div className="flex items-center gap-2 border-b border-[#23232c] pb-3">
              <Cpu className="h-4 w-4 text-[#0099ff]" />
              <h2 className="text-sm font-bold text-white">Start a New LoRA Training</h2>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Model Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Eldritch Citadel Isometric Style V2"
                className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3 py-2 text-xs text-white outline-none focus:border-[#0099ff]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Base Architecture
                </label>
                <select
                  value={baseModel}
                  onChange={(e) => setBaseModel(e.target.value)}
                  className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3 py-2 text-xs text-white"
                >
                  <option value="Flux.1 Dev LoRA">Flux.1 Dev LoRA</option>
                  <option value="SDXL 1.0 LoRA">SDXL 1.0 LoRA</option>
                  <option value="Flux.1 Schnell LoRA">Flux.1 Schnell LoRA</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Training Class
                </label>
                <select
                  value={trainingClass}
                  onChange={(e) => setTrainingClass(e.target.value)}
                  className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3 py-2 text-xs text-white"
                >
                  <option value="Style">Art Style</option>
                  <option value="Character">Game Character</option>
                  <option value="Prop">3D Prop / Weapon</option>
                  <option value="Isometric Tile">Isometric Tileset</option>
                  <option value="UI Icon">UI / HUD Iconography</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Trigger Token
                </label>
                <input
                  type="text"
                  value={triggerToken}
                  onChange={(e) => setTriggerToken(e.target.value)}
                  className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3 py-2 font-mono text-xs text-amber-300 outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Dataset Images ({datasetCount})
                </label>
                <input
                  type="number"
                  min={5}
                  max={200}
                  value={datasetCount}
                  onChange={(e) => setDatasetCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Epochs ({epochs})
                </label>
                <input
                  type="range"
                  min={4}
                  max={30}
                  value={epochs}
                  onChange={(e) => setEpochs(Number(e.target.value))}
                  className="w-full accent-[#0099ff]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Learning Rate
                </label>
                <input
                  type="number"
                  step={0.00005}
                  value={learningRate}
                  onChange={(e) => setLearningRate(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3 py-1.5 font-mono text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-[#2c2c36] bg-[#0e0e12] p-4 text-center">
              <UploadCloud className="mx-auto h-6 w-6 text-[#0099ff]" />
              <p className="mt-1 text-xs font-semibold text-zinc-200">
                Training Dataset Staged ({datasetCount} Curated Reference Plates)
              </p>
              <label className="mt-2 inline-flex items-center gap-2 text-[11px] text-zinc-400">
                <input
                  type="checkbox"
                  checked={autoCaption}
                  onChange={(e) => setAutoCaption(e.target.checked)}
                  className="accent-[#0099ff]"
                />
                <span>Enable BLIP-2 / JoyCaption VLM Auto-Captioning</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0099ff] py-3 text-xs font-bold text-white hover:bg-[#0080db] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {submitting ? 'Training Custom LoRA...' : 'Start a Training · 50 CU'}
            </button>
          </form>

          {/* Right: Completed & Active Training Jobs + Loss Curves */}
          <div className="space-y-4 lg:col-span-7">
            {jobs.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-[#25252e] bg-[#141418] p-12 text-center">
                <Activity className="h-9 w-9 text-[#0099ff]" />
                <h3 className="mt-3 text-sm font-bold text-white">No Training Runs Yet</h3>
                <p className="mt-1 max-w-md text-xs text-zinc-400">
                  Launch a training run on the left to compile a custom LoRA adapter with real-time epoch loss telemetry.
                </p>
              </div>
            ) : (
              jobs.map((job) => {
                let curve: Array<{ epoch: number; loss: number }> = [];
                try {
                  curve = JSON.parse(job.lossCurveJson || '[]');
                } catch {
                  // ignore
                }
                return (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-[#25252e] bg-[#141418] p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> {job.status}
                          </span>
                          <span className="font-mono text-[11px] text-amber-300">
                            Trigger: {job.triggerToken}
                          </span>
                        </div>
                        <h3 className="mt-1.5 text-sm font-bold text-white">{job.name}</h3>
                        <p className="text-[11px] text-zinc-400">
                          {job.baseModel} · {job.trainingClass} · {job.epochs} Epochs · LR{' '}
                          {job.learningRate} · {job.datasetCount} Images
                        </p>
                      </div>

                      {job.resultingModelId && (
                        <Link
                          href={`/create?mode=image&modelId=${job.resultingModelId}&prompt=${encodeURIComponent(
                            `${job.triggerToken} isometric game asset`
                          )}`}
                          className="flex items-center gap-1.5 rounded-xl bg-[#0099ff] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0080db]"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Test Trained Model
                        </Link>
                      )}
                    </div>

                    {/* Loss Curve Bar Chart */}
                    {curve.length > 0 && (
                      <div className="mt-4 rounded-xl border border-[#23232c] bg-[#0e0e12] p-3">
                        <p className="mb-2 text-[10px] font-semibold uppercase text-zinc-400">
                          Convergence Loss Telemetry (Final Loss:{' '}
                          {curve[curve.length - 1]?.loss})
                        </p>
                        <div className="flex h-16 items-end gap-1.5">
                          {curve.map((pt) => (
                            <div
                              key={pt.epoch}
                              className="flex flex-1 flex-col items-center gap-1"
                            >
                              <div
                                style={{ height: `${Math.max(12, Math.round(pt.loss * 95))}%` }}
                                className="w-full rounded-t bg-gradient-to-t from-[#0099ff] to-sky-400"
                                title={`Epoch ${pt.epoch}: Loss ${pt.loss}`}
                              />
                              <span className="font-mono text-[9px] text-zinc-500">
                                E{pt.epoch}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </ScenarioShell>
  );
}
