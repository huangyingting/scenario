'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  Search,
  RotateCcw,
  Download,
  Wand2,
  Scissors,
  Grid,
  Layers,
  PenTool,
  Box,
  Volume2,
  Globe,
  Trash2,
  Share2,
  X,
} from 'lucide-react';
import { ScenarioShell } from '@/components/layout/ScenarioShell';
import { useWorkspace } from '@/components/providers/SessionProviderWrapper';
import { SYSTEM_MODELS } from '@/lib/system-catalog';

type StudioModality =
  | 'image'
  | 'video'
  | '3d'
  | 'world'
  | 'audio'
  | 'text'
  | 'texture'
  | 'skybox'
  | 'reframe'
  | 'upscale'
  | 'remove-bg'
  | 'vectorize'
  | 'pixelate';

type ModelItem = {
  id: string;
  name: string;
  description: string;
  type: string;
  modality: string;
  baseModelFamily: string;
  category: string;
  oscuCost: number;
  isCustom?: boolean;
};

type AssetItem = {
  id: string;
  modality: string;
  toolBadge: string;
  title: string;
  prompt: string;
  negativePrompt: string;
  modelId: string;
  modelName: string;
  mimeType: string;
  width: number;
  height: number;
  durationSec: number | null;
  seed: number;
  dataUrl: string;
  artifactPayload: string;
  publishedToExplore: boolean;
  createdAt: string;
};

const MODALITY_OPTIONS: Array<{ value: StudioModality; label: string }> = [
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: '3d', label: '3D Meshes' },
  { value: 'world', label: 'World (Skyboxes & 3D Splats)' },
  { value: 'audio', label: 'Audio & SFX' },
  { value: 'text', label: 'Text & Lore LLM' },
  { value: 'texture', label: 'PBR Textures' },
  { value: 'skybox', label: '360° Skyboxes' },
  { value: 'reframe', label: 'Expand / Reframe' },
  { value: 'upscale', label: 'Upscale & Enhance' },
  { value: 'remove-bg', label: 'Remove Background' },
  { value: 'vectorize', label: 'Vectorize SVG' },
  { value: 'pixelate', label: 'Pixelate Retro' },
];

function CreateStudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshWorkspace } = useWorkspace();

  const initialMode = (searchParams.get('mode') as StudioModality) || 'image';
  const initialModelId = searchParams.get('modelId') || 'model_flux-1-dev';
  const initialPrompt = searchParams.get('prompt') || '';
  const initialAspect = searchParams.get('aspectRatio') || '1:1';

  const [modality, setModality] = useState<StudioModality>(initialMode);
  const [models, setModels] = useState<ModelItem[]>(SYSTEM_MODELS);
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId);
  const [modelModalOpen, setModelModalOpen] = useState(false);

  const [prompt, setPrompt] = useState(initialPrompt);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showNegative, setShowNegative] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(initialAspect);
  const [numSamples, setNumSamples] = useState(1);
  const [steps, setSteps] = useState(28);
  const [guidance, setGuidance] = useState(3.5);
  const [seed, setSeed] = useState('');
  const [seamless, setSeamless] = useState(true);
  const [durationSeconds, setDurationSeconds] = useState(5);
  const [resolution, setResolution] = useState('1080p');
  const [cameraMotion, setCameraMotion] = useState('Orbit');
  const [outputFormat, setOutputFormat] = useState('GLB');
  const [polycount, setPolycount] = useState('Medium (25k tris)');
  const [audioMode, setAudioMode] = useState('Sound Effects');

  const [generating, setGenerating] = useState(false);
  const [sparkBusy, setSparkBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [gridCols, setGridCols] = useState(3);
  const [inspectedAsset, setInspectedAsset] = useState<AssetItem | null>(null);
  const [tile2x2Preview, setTile2x2Preview] = useState(false);
  const [skyboxYaw, setSkyboxYaw] = useState(50);
  const [meshRotY, setMeshRotY] = useState(30);

  useEffect(() => {
    const urlMode = searchParams.get('mode') as StudioModality | null;
    if (urlMode && MODALITY_OPTIONS.some((m) => m.value === urlMode)) {
      setModality(urlMode);
    }
    const urlModel = searchParams.get('modelId');
    if (urlModel) setSelectedModelId(urlModel);
    const urlPrompt = searchParams.get('prompt');
    if (urlPrompt) setPrompt(urlPrompt);
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/v1/models')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.allModels) setModels(d.allModels);
      })
      .catch(() => {});
  }, []);

  async function loadAssets() {
    const res = await fetch('/api/v1/assets');
    if (res.ok) {
      const data = await res.json();
      setAssets(data.assets || []);
    }
  }

  useEffect(() => {
    loadAssets();
  }, []);

  const activeModel = useMemo(() => {
    return (
      models.find((m) => m.id === selectedModelId) ||
      models.find((m) => m.modality === modality) ||
      models[0]
    );
  }, [models, selectedModelId, modality]);

  const estimatedCost = (activeModel?.oscuCost || 10) * numSamples;

  async function handleSparkEnhance() {
    setSparkBusy(true);
    try {
      const res = await fetch('/api/v1/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'spark_prompt',
          prompt: prompt.trim() || 'Isometric dark fantasy arcane relic',
          modality,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.enhancedPrompt) setPrompt(data.enhancedPrompt);
      }
    } finally {
      setSparkBusy(false);
    }
  }

  async function handleGenerate(e?: React.FormEvent, overrideModality?: StudioModality, sourceAsset?: AssetItem) {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setGenerating(true);

    const targetModality = overrideModality || modality;
    const dims: Record<string, { w: number; h: number }> = {
      '1:1': { w: 1024, h: 1024 },
      '16:9': { w: 1344, h: 768 },
      '9:16': { w: 768, h: 1344 },
      '4:3': { w: 1152, h: 896 },
      '3:4': { w: 896, h: 1152 },
    };
    const { w, h } = dims[aspectRatio] || dims['1:1'];

    try {
      const res = await fetch('/api/v1/inferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modality: targetModality,
          modelId: activeModel?.id,
          prompt:
            sourceAsset?.prompt ||
            prompt.trim() ||
            'Isometric dark fantasy paladin with glowing runic obsidian armor',
          negativePrompt,
          sourceAssetId: sourceAsset?.id,
          parameters: {
            aspectRatio,
            width: w,
            height: h,
            numSamples,
            steps,
            guidance,
            seed: seed ? Number(seed) : undefined,
            seamless,
            durationSeconds,
            resolution,
            cameraMotion,
            outputFormat,
            polycount,
            audioMode,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Generation failed.');
      } else {
        await loadAssets();
        await refreshWorkspace();
        if (data.assets?.[0]) {
          setInspectedAsset(data.assets[0]);
        }
      }
    } catch {
      setErrorMsg('Network error during inference.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggleExplore(asset: AssetItem) {
    const res = await fetch('/api/v1/assets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: asset.id,
        publishedToExplore: !asset.publishedToExplore,
      }),
    });
    if (res.ok) {
      await loadAssets();
      setInspectedAsset((prev) =>
        prev && prev.id === asset.id
          ? { ...prev, publishedToExplore: !asset.publishedToExplore }
          : prev
      );
    }
  }

  async function handleTrashAsset(assetId: string) {
    const res = await fetch('/api/v1/assets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: assetId, action: 'trash' }),
    });
    if (res.ok) {
      setInspectedAsset(null);
      await loadAssets();
    }
  }

  const filteredAssets = assets.filter((a) => {
    if (
      searchFilter.trim() &&
      !a.prompt.toLowerCase().includes(searchFilter.toLowerCase()) &&
      !a.title.toLowerCase().includes(searchFilter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <ScenarioShell fullHeight>
      <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden md:flex-row">
        {/* LEFT 380px DOCKED STUDIO CONTROL PANEL (Replicating Screenshots 11–19) */}
        <aside className="flex w-full shrink-0 flex-col border-b border-[#23232b] bg-[#121216] md:h-full md:w-[380px] md:border-b-0 md:border-r">
          {/* Studio Mode Selector Header */}
          <div className="flex items-center justify-between border-b border-[#22222a] px-4 py-3">
            <select
              aria-label="Creation Mode"
              value={modality}
              onChange={(e) => {
                const next = e.target.value as StudioModality;
                setModality(next);
                router.replace(`/create?mode=${next}`);
              }}
              className="rounded-lg border border-[#2c2c36] bg-[#191920] px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-[#0099ff]"
            >
              {MODALITY_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <button
                type="button"
                onClick={() => {
                  setPrompt('');
                  setNegativePrompt('');
                  setAspectRatio('1:1');
                  setNumSamples(1);
                  setSteps(28);
                  setGuidance(3.5);
                }}
                className="flex items-center gap-1 hover:text-white"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
              <span className="text-zinc-700">|</span>
              <Link href="/compose/new" className="text-[#0099ff] hover:underline">
                Compose
              </Link>
            </div>
          </div>

          {/* Scrollable Parameter Controls */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300"
              >
                {errorMsg}
              </div>
            )}

            {/* 1. Model Selector Card */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span>Model</span>
                <span className="text-[11px] font-normal text-zinc-500">
                  {activeModel?.baseModelFamily}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModelModalOpen(true)}
                className="flex w-full items-center justify-between rounded-xl border border-[#2a2a33] bg-[#18181f] p-3 text-left transition hover:border-[#0099ff]"
              >
                <div>
                  <p className="text-xs font-bold text-white">{activeModel?.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-400">
                    {activeModel?.description}
                  </p>
                </div>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#23232d] text-zinc-200">
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            </div>

            {/* 2. Prompt Box + AI Spark Enhancer */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">Prompt</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNegative(!showNegative)}
                    className="text-[11px] text-zinc-400 hover:text-white"
                  >
                    {showNegative ? 'Hide Negative' : '+ Negative'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSparkEnhance}
                    disabled={sparkBusy}
                    className="flex items-center gap-1 rounded-md bg-[#0088ff]/20 px-2 py-0.5 text-[11px] font-semibold text-[#0099ff] hover:bg-[#0088ff]/30"
                    title="Enhance prompt with Scenario AI Spark"
                  >
                    <Sparkles className="h-3 w-3" />
                    {sparkBusy ? 'Enhancing...' : 'AI Spark'}
                  </button>
                </div>
              </div>

              <textarea
                rows={4}
                name="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type a prompt or describe your game asset, lighting, and style..."
                className="w-full rounded-xl border border-[#2a2a33] bg-[#0e0e12] p-3 text-xs leading-relaxed text-white outline-none focus:border-[#0099ff]"
              />

              {showNegative && (
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Negative prompt: blurry, watermark, low contrast, deformed..."
                  className="mt-2 w-full rounded-xl border border-[#2a2a33] bg-[#0e0e12] px-3 py-2 text-xs text-zinc-200 outline-none focus:border-rose-500"
                />
              )}
            </div>

            {/* 3. Modality-Specific Parameter Accordions */}
            {(modality === 'image' ||
              modality === 'texture' ||
              modality === 'upscale' ||
              modality === 'remove-bg' ||
              modality === 'vectorize' ||
              modality === 'pixelate') && (
              <div className="space-y-3 rounded-xl border border-[#24242d] bg-[#16161c] p-3.5">
                <p className="text-xs font-semibold text-zinc-200">Dimensions &amp; Sampling</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`rounded-lg py-1.5 text-[11px] font-semibold ${
                        aspectRatio === ratio
                          ? 'bg-[#0099ff] text-white'
                          : 'bg-[#202028] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="text-[11px] text-zinc-400">
                    Images Count ({numSamples})
                    <input
                      type="range"
                      min={1}
                      max={4}
                      value={numSamples}
                      onChange={(e) => setNumSamples(Number(e.target.value))}
                      className="mt-1 w-full accent-[#0099ff]"
                    />
                  </label>
                  <label className="text-[11px] text-zinc-400">
                    Inference Steps ({steps})
                    <input
                      type="range"
                      min={10}
                      max={50}
                      value={steps}
                      onChange={(e) => setSteps(Number(e.target.value))}
                      className="mt-1 w-full accent-[#0099ff]"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[11px] text-zinc-400">
                    Guidance ({guidance})
                    <input
                      type="range"
                      min={1}
                      max={12}
                      step={0.5}
                      value={guidance}
                      onChange={(e) => setGuidance(Number(e.target.value))}
                      className="mt-1 w-full accent-[#0099ff]"
                    />
                  </label>
                  <label className="text-[11px] text-zinc-400">
                    Seed
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      placeholder="Random"
                      className="mt-1 w-full rounded-lg border border-[#2c2c35] bg-[#0e0e12] px-2.5 py-1 text-xs text-white outline-none"
                    />
                  </label>
                </div>

                {modality === 'texture' && (
                  <label className="flex items-center justify-between pt-1 text-xs text-zinc-200">
                    <span>Seamless X/Y Tiling + PBR Maps</span>
                    <input
                      type="checkbox"
                      checked={seamless}
                      onChange={(e) => setSeamless(e.target.checked)}
                      className="h-4 w-4 accent-[#0099ff]"
                    />
                  </label>
                )}
              </div>
            )}

            {modality === 'video' && (
              <div className="space-y-3 rounded-xl border border-[#24242d] bg-[#16161c] p-3.5">
                <p className="text-xs font-semibold text-zinc-200">Video &amp; Camera Controls</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="text-[11px] text-zinc-400">
                    Duration
                    <select
                      value={durationSeconds}
                      onChange={(e) => setDurationSeconds(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-[#2c2c35] bg-[#0e0e12] px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value={5}>5 seconds</option>
                      <option value={10}>10 seconds</option>
                      <option value={15}>15 seconds</option>
                      <option value={30}>30 seconds (Kling V4)</option>
                    </select>
                  </label>
                  <label className="text-[11px] text-zinc-400">
                    Resolution
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#2c2c35] bg-[#0e0e12] px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="720p">720p Fast</option>
                      <option value="1080p">1080p HD</option>
                      <option value="4K">4K Cinema</option>
                    </select>
                  </label>
                </div>
                <label className="block text-[11px] text-zinc-400">
                  Camera Motion
                  <select
                    value={cameraMotion}
                    onChange={(e) => setCameraMotion(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#2c2c35] bg-[#0e0e12] px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="Orbit">360° Orbit Around Subject</option>
                    <option value="Pan">Cinematic Pan</option>
                    <option value="Zoom In">Dramatic Dolly Zoom In</option>
                    <option value="Crane">Aerial Crane Sweep</option>
                    <option value="Static">Locked Tripod</option>
                  </select>
                </label>
              </div>
            )}

            {modality === '3d' && (
              <div className="space-y-3 rounded-xl border border-[#24242d] bg-[#16161c] p-3.5">
                <p className="text-xs font-semibold text-zinc-200">3D Mesh &amp; PBR Topology</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="text-[11px] text-zinc-400">
                    Export Format
                    <select
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#2c2c35] bg-[#0e0e12] px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="GLB">GLB (glTF Binary)</option>
                      <option value="OBJ">Wavefront OBJ</option>
                      <option value="FBX">Autodesk FBX</option>
                      <option value="USDZ">Pixar USDZ</option>
                    </select>
                  </label>
                  <label className="text-[11px] text-zinc-400">
                    Target Polycount
                    <select
                      value={polycount}
                      onChange={(e) => setPolycount(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#2c2c35] bg-[#0e0e12] px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="Low (5k tris)">Low (5k tris)</option>
                      <option value="Medium (25k tris)">Medium (25k tris)</option>
                      <option value="High (100k tris)">High (100k tris)</option>
                      <option value="Quad Remesh">Clean Quad Topology</option>
                    </select>
                  </label>
                </div>
              </div>
            )}

            {modality === 'audio' && (
              <div className="space-y-3 rounded-xl border border-[#24242d] bg-[#16161c] p-3.5">
                <p className="text-xs font-semibold text-zinc-200">Audio Synthesis Mode</p>
                <select
                  value={audioMode}
                  onChange={(e) => setAudioMode(e.target.value)}
                  className="w-full rounded-lg border border-[#2c2c35] bg-[#0e0e12] px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="Sound Effects">Game Sound Effects (SFX)</option>
                  <option value="Music">Ambient Soundtrack Loop</option>
                  <option value="Text to Speech">Character Voice (TTS)</option>
                  <option value="Voice Clone">Voice Clone</option>
                  <option value="Lip Sync">Dialogue Lip Sync</option>
                </select>
              </div>
            )}

            {modality === 'world' && (
              <div className="space-y-3 rounded-xl border border-[#24242d] bg-[#16161c] p-3.5">
                <p className="text-xs font-semibold text-zinc-200">
                  World Generation (360° Skybox &amp; Gaussian Splat)
                </p>
                <p className="text-[11px] leading-relaxed text-zinc-400">
                  Generate 360° panorama skyboxes, upscale existing skyboxes, or build explorable 3D worlds as Gaussian splats (.SPZ / .PLY).
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['360° Skybox (HDRI)', '3D Gaussian Splat (.SPZ)'].map((wType) => (
                    <button
                      key={wType}
                      type="button"
                      onClick={() => setOutputFormat(wType)}
                      className={`rounded-lg py-2 text-[11px] font-semibold ${
                        outputFormat === wType
                          ? 'bg-[#0099ff] text-white'
                          : 'bg-[#202028] text-zinc-300 hover:text-white'
                      }`}
                    >
                      {wType}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {modality === 'reframe' && (
              <div className="space-y-3 rounded-xl border border-[#24242d] bg-[#16161c] p-3.5">
                <p className="text-xs font-semibold text-zinc-200">
                  Expand &amp; Reframe (Gemini 3.1 Flash Reframe)
                </p>
                <p className="text-[11px] text-zinc-400">Target Aspect Ratio</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {['16:9', '9:16', '21:9', '4:3', '1:1'].map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`rounded-lg py-1.5 text-[11px] font-semibold ${
                        aspectRatio === ratio
                          ? 'bg-[#0099ff] text-white'
                          : 'bg-[#202028] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
                <label className="flex items-center justify-between pt-1 text-xs text-zinc-200">
                  <span>Attach C2PA Content Credential</span>
                  <input
                    type="checkbox"
                    checked={seamless}
                    onChange={(e) => setSeamless(e.target.checked)}
                    className="h-4 w-4 accent-[#0099ff]"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Sticky Bottom Generate CTA */}
          <div className="border-t border-[#22222a] bg-[#141418] p-4">
            <button
              type="button"
              disabled={generating}
              onClick={(e) => handleGenerate(e)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0099ff] py-3 text-xs font-bold text-white shadow-lg shadow-[#0099ff]/25 transition hover:bg-[#0080db] disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {generating ? 'Synthesizing Asset...' : `Generate · ${estimatedCost} CU`}
              </span>
            </button>
          </div>
        </aside>

        {/* RIGHT MAIN ASSET FEED & INTERACTIVE INSPECTOR VIEWPORT */}
        <section className="flex flex-1 flex-col overflow-hidden bg-[#0b0b0c]">
          {/* Viewport Filter & Zoom Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#22222a] px-5 py-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search by prompt..."
                className="w-full rounded-xl border border-[#26262f] bg-[#141418] py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-[#0099ff]"
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span>Grid Size</span>
              <input
                type="range"
                min={2}
                max={5}
                value={gridCols}
                onChange={(e) => setGridCols(Number(e.target.value))}
                className="w-24 accent-[#0099ff]"
              />
              <span className="rounded-lg border border-[#26262f] bg-[#141418] px-2.5 py-1 text-[11px] text-zinc-300">
                Newest first ({filteredAssets.length})
              </span>
            </div>
          </div>

          {/* Scrollable Asset Grid */}
          <div className="flex-1 overflow-y-auto p-5">
            {filteredAssets.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#26262f] p-12 text-center">
                <Sparkles className="h-10 w-10 text-[#0099ff]" />
                <h2 className="mt-3 text-base font-bold text-white">
                  Ready to Generate in {MODALITY_OPTIONS.find((m) => m.value === modality)?.label}
                </h2>
                <p className="mt-1 max-w-md text-xs text-zinc-400">
                  Enter a prompt in the left studio panel and click{' '}
                  <strong className="text-white">Generate</strong> to synthesize real game-ready assets persisted to your project workspace.
                </p>
              </div>
            ) : (
              <div>
                <p className="mb-3 text-xs font-semibold text-zinc-400">
                  Workspace Generations ({filteredAssets.length})
                </p>
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                  }}
                >
                  {filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => setInspectedAsset(asset)}
                      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#25252e] bg-[#141418] transition hover:border-[#0099ff]"
                    >
                      <div className="aspect-square w-full overflow-hidden bg-[#0e0e12]">
                        <img
                          src={asset.dataUrl}
                          alt={asset.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>

                      <span className="absolute bottom-3 left-3 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                        {asset.toolBadge}
                      </span>

                      {asset.durationSec && (
                        <span className="absolute bottom-3 right-3 rounded-md bg-black/80 px-2 py-0.5 font-mono text-[10px] text-sky-300">
                          00:0{asset.durationSec}
                        </span>
                      )}

                      {/* Hover Quick Actions */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute inset-x-2 top-2 hidden items-center justify-end gap-1.5 group-hover:flex"
                      >
                        <button
                          type="button"
                          onClick={() => handleGenerate(undefined, 'upscale', asset)}
                          title="4K Upscale"
                          className="rounded-lg bg-black/80 p-1.5 text-zinc-200 hover:bg-[#0099ff] hover:text-white"
                        >
                          <Wand2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerate(undefined, 'remove-bg', asset)}
                          title="Remove Background"
                          className="rounded-lg bg-black/80 p-1.5 text-zinc-200 hover:bg-[#0099ff] hover:text-white"
                        >
                          <Scissors className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerate(undefined, 'pixelate', asset)}
                          title="Pixelate Sprite"
                          className="rounded-lg bg-black/80 p-1.5 text-zinc-200 hover:bg-[#0099ff] hover:text-white"
                        >
                          <Grid className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* MODEL PICKER MODAL */}
      {modelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-[#2c2c35] bg-[#141418] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-[#24242c] pb-3">
              <h3 className="text-sm font-bold text-white">Select a Production Model</h3>
              <button
                type="button"
                onClick={() => setModelModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid max-h-[60vh] gap-2.5 overflow-y-auto sm:grid-cols-2">
              {models.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedModelId(m.id);
                    setModelModalOpen(false);
                  }}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition ${
                    selectedModelId === m.id
                      ? 'border-[#0099ff] bg-[#0099ff]/10'
                      : 'border-[#25252e] bg-[#191920] hover:border-zinc-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-[#0099ff]">
                        {m.type.toUpperCase()} · {m.modality.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-zinc-400">{m.oscuCost} CU</span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-white">{m.name}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">
                      {m.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MULTI-MODAL ASSET INSPECTOR MODAL (3D Mesh, Playable Audio, 2x2 Seamless Texture, 360° Skybox) */}
      {inspectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="grid max-h-[90vh] w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-[#2c2c36] bg-[#131317] shadow-2xl md:grid-cols-12">
            {/* Left Media Viewport */}
            <div className="relative flex flex-col items-center justify-center bg-[#09090c] p-6 md:col-span-7">
              {inspectedAsset.toolBadge === 'PBRTexture' && tile2x2Preview ? (
                <div className="grid aspect-square w-full max-w-md grid-cols-2 overflow-hidden rounded-xl border border-[#2a2a33]">
                  <img src={inspectedAsset.dataUrl} alt="Tile 1" className="h-full w-full object-cover" />
                  <img src={inspectedAsset.dataUrl} alt="Tile 2" className="h-full w-full object-cover" />
                  <img src={inspectedAsset.dataUrl} alt="Tile 3" className="h-full w-full object-cover" />
                  <img src={inspectedAsset.dataUrl} alt="Tile 4" className="h-full w-full object-cover" />
                </div>
              ) : inspectedAsset.toolBadge === 'Skybox360' ? (
                <div className="w-full space-y-3">
                  <div className="h-80 w-full overflow-hidden rounded-xl border border-[#2a2a33]">
                    <img
                      src={inspectedAsset.dataUrl}
                      alt={inspectedAsset.title}
                      style={{ objectPosition: `${skyboxYaw}% 50%` }}
                      className="h-full w-full object-cover transition-all"
                    />
                  </div>
                  <label className="flex items-center gap-3 text-xs text-zinc-300">
                    <Globe className="h-4 w-4 text-[#0099ff]" />
                    <span>360° Panorama Horizon Yaw ({skyboxYaw}°)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={skyboxYaw}
                      onChange={(e) => setSkyboxYaw(Number(e.target.value))}
                      className="flex-1 accent-[#0099ff]"
                    />
                  </label>
                </div>
              ) : inspectedAsset.modality === '3d' ? (
                <div className="w-full space-y-3 text-center">
                  <div
                    style={{ transform: `perspective(800px) rotateY(${meshRotY - 30}deg)` }}
                    className="mx-auto max-w-sm overflow-hidden rounded-xl border border-teal-500/40 transition-transform"
                  >
                    <img src={inspectedAsset.dataUrl} alt={inspectedAsset.title} className="w-full" />
                  </div>
                  <label className="flex items-center gap-3 text-xs text-zinc-300">
                    <Box className="h-4 w-4 text-teal-400" />
                    <span>3D Turntable Orbit</span>
                    <input
                      type="range"
                      min={0}
                      max={60}
                      value={meshRotY}
                      onChange={(e) => setMeshRotY(Number(e.target.value))}
                      className="flex-1 accent-teal-400"
                    />
                  </label>
                </div>
              ) : (
                <img
                  src={inspectedAsset.dataUrl}
                  alt={inspectedAsset.title}
                  className="max-h-[62vh] rounded-xl object-contain"
                />
              )}

              {/* Playable WAV Audio Synthesizer Player */}
              {inspectedAsset.modality === 'audio' && inspectedAsset.artifactPayload.startsWith('data:audio/wav') && (
                <div className="mt-4 w-full max-w-md rounded-xl border border-[#2a2a33] bg-[#16161d] p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-400">
                    <Volume2 className="h-4 w-4" />
                    <span>Synthesized RIFF PCM .WAV Audio</span>
                  </div>
                  <audio controls src={inspectedAsset.artifactPayload} className="w-full" />
                </div>
              )}
            </div>

            {/* Right Metadata & Post-Processing Actions */}
            <div className="flex flex-col justify-between p-6 md:col-span-5">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded bg-[#0099ff]/20 px-2 py-0.5 text-[10px] font-bold text-[#0099ff]">
                      {inspectedAsset.toolBadge} · {inspectedAsset.modelName}
                    </span>
                    <h3 className="mt-1.5 text-sm font-bold text-white">
                      {inspectedAsset.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInspectedAsset(null)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="rounded-xl border border-[#24242c] bg-[#0e0e12] p-3 text-xs text-zinc-300">
                  <p className="mb-1 text-[10px] font-semibold uppercase text-zinc-500">
                    Prompt
                  </p>
                  <p className="leading-relaxed">{inspectedAsset.prompt}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="rounded-lg border border-[#24242c] bg-[#18181f] p-2">
                    <p className="text-zinc-500">Dimensions</p>
                    <p className="font-semibold text-white">
                      {inspectedAsset.width}×{inspectedAsset.height}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#24242c] bg-[#18181f] p-2">
                    <p className="text-zinc-500">Seed</p>
                    <p className="font-mono font-semibold text-white">{inspectedAsset.seed}</p>
                  </div>
                  <div className="rounded-lg border border-[#24242c] bg-[#18181f] p-2">
                    <p className="text-zinc-500">Modality</p>
                    <p className="font-semibold uppercase text-white">{inspectedAsset.modality}</p>
                  </div>
                </div>

                {inspectedAsset.toolBadge === 'PBRTexture' && (
                  <button
                    type="button"
                    onClick={() => setTile2x2Preview(!tile2x2Preview)}
                    className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 py-2 text-xs font-semibold text-amber-300"
                  >
                    {tile2x2Preview ? 'Show Single Texture Tile' : 'Inspect 2×2 Seamless Repeat'}
                  </button>
                )}

                {inspectedAsset.modality === '3d' && (
                  <div className="rounded-xl border border-[#24242c] bg-[#0e0e12] p-2.5">
                    <p className="mb-1 text-[10px] font-semibold uppercase text-teal-400">
                      Wavefront .OBJ Geometry Preview
                    </p>
                    <pre className="max-h-28 overflow-y-auto font-mono text-[10px] text-zinc-400">
                      {inspectedAsset.artifactPayload}
                    </pre>
                  </div>
                )}

                {/* Post-Processing Pipelines */}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Edit &amp; Post-Process Asset
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleGenerate(undefined, 'upscale', inspectedAsset)}
                      className="flex items-center gap-1.5 rounded-lg border border-[#2a2a33] bg-[#191920] px-3 py-2 text-zinc-200 hover:border-[#0099ff]"
                    >
                      <Wand2 className="h-3.5 w-3.5 text-[#0099ff]" /> Topaz 4K Upscale
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerate(undefined, 'remove-bg', inspectedAsset)}
                      className="flex items-center gap-1.5 rounded-lg border border-[#2a2a33] bg-[#191920] px-3 py-2 text-zinc-200 hover:border-[#0099ff]"
                    >
                      <Scissors className="h-3.5 w-3.5 text-pink-400" /> Remove BG
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerate(undefined, 'vectorize', inspectedAsset)}
                      className="flex items-center gap-1.5 rounded-lg border border-[#2a2a33] bg-[#191920] px-3 py-2 text-zinc-200 hover:border-[#0099ff]"
                    >
                      <Layers className="h-3.5 w-3.5 text-emerald-400" /> Vectorize SVG
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerate(undefined, 'pixelate', inspectedAsset)}
                      className="flex items-center gap-1.5 rounded-lg border border-[#2a2a33] bg-[#191920] px-3 py-2 text-zinc-200 hover:border-[#0099ff]"
                    >
                      <Grid className="h-3.5 w-3.5 text-rose-400" /> 16-Bit Pixelate
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[#24242c] pt-4">
                <div className="flex gap-2">
                  <a
                    href={
                      inspectedAsset.modality === '3d'
                        ? `data:text/plain;charset=utf-8,${encodeURIComponent(inspectedAsset.artifactPayload)}`
                        : inspectedAsset.dataUrl
                    }
                    download={
                      inspectedAsset.modality === '3d'
                        ? `scenario-mesh-${inspectedAsset.seed}.obj`
                        : `scenario-asset-${inspectedAsset.seed}.svg`
                    }
                    className="flex items-center gap-1.5 rounded-lg bg-[#0099ff] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0080db]"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                  <Link
                    href="/canvas/new"
                    className="flex items-center gap-1.5 rounded-lg border border-[#2c2c35] bg-[#191920] px-3 py-2 text-xs text-zinc-200 hover:border-zinc-500"
                  >
                    <PenTool className="h-3.5 w-3.5" /> Send to Canvas
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleToggleExplore(inspectedAsset)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs ${
                      inspectedAsset.publishedToExplore
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                        : 'border-[#2c2c35] bg-[#191920] text-zinc-300'
                    }`}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {inspectedAsset.publishedToExplore ? 'Published' : 'Publish'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleTrashAsset(inspectedAsset.id)}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20"
                  title="Move to Trash"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ScenarioShell>
  );
}

export default function CreateStudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b0b0c]" />}>
      <CreateStudioContent />
    </Suspense>
  );
}
