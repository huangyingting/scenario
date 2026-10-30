'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  MousePointer,
  Frame,
  Hand,
  Brush,
  Eraser,
  Sparkles,
  Undo2,
  Redo2,
  Download,
  Save,
  Layers,
} from 'lucide-react';
import { SYSTEM_MODELS } from '@/lib/system-catalog';

type Stroke = {
  id: string;
  tool: 'brush' | 'mask' | 'eraser';
  color: string;
  size: number;
  points: Array<{ x: number; y: number }>;
};

export default function InfiniteCanvasEditorPage() {
  const params = useParams();
  const canvasId = String(params?.id || 'new');

  const [projectId, setProjectId] = useState<string | null>(null);
  const [title, setTitle] = useState('Untitled');
  const [tool, setTool] = useState<'select' | 'frame' | 'pan' | 'brush' | 'mask' | 'eraser'>('brush');
  const [color, setColor] = useState('#0099ff');
  const [brushSize, setBrushSize] = useState(6);
  const [zoom, setZoom] = useState(100);
  const [liveMode, setLiveMode] = useState(false);
  const [modelId, setModelId] = useState('model_flux-1-dev');
  const [prompt, setPrompt] = useState('');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [frameBox, setFrameBox] = useState({ x: 260, y: 110, width: 440, height: 440 });
  const [generatedFrameUrl, setGeneratedFrameUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    fetch(`/api/v1/canvases/${canvasId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.canvas) {
          setProjectId(d.canvas.id);
          setTitle(d.canvas.name || 'Untitled');
          setLiveMode(Boolean(d.canvas.liveMode));
          try {
            const parsedStrokes = JSON.parse(d.canvas.strokesJson || '[]');
            if (Array.isArray(parsedStrokes)) setStrokes(parsedStrokes);
          } catch {
            // ignore invalid JSON
          }
        }
      })
      .catch(() => {});
  }, [canvasId]);

  function getRelativePoint(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    };
  }

  function handlePointerDown(e: React.MouseEvent<SVGSVGElement>) {
    const pt = getRelativePoint(e);
    if (tool === 'frame') {
      setFrameBox((prev) => ({
        ...prev,
        x: Math.max(20, pt.x - Math.round(prev.width / 2)),
        y: Math.max(20, pt.y - Math.round(prev.height / 2)),
      }));
      return;
    }
    if (tool === 'brush' || tool === 'mask' || tool === 'eraser') {
      setDrawing(true);
      const newStroke: Stroke = {
        id: `st_${Date.now()}`,
        tool,
        color: tool === 'mask' ? '#a855f7' : tool === 'eraser' ? '#0b0b0c' : color,
        size: tool === 'mask' ? 22 : brushSize,
        points: [pt],
      };
      setStrokes((prev) => [...prev, newStroke]);
      setRedoStack([]);
    }
  }

  function handlePointerMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!drawing) return;
    const pt = getRelativePoint(e);
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      return [...prev.slice(0, -1), { ...last, points: [...last.points, pt] }];
    });
  }

  function handlePointerUp() {
    if (drawing) {
      setDrawing(false);
      if (liveMode) {
        triggerFrameGeneration();
      }
    }
  }

  async function handleSaveCanvas() {
    if (!projectId) return;
    setSaving(true);
    try {
      await fetch(`/api/v1/canvases/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: title,
          liveMode,
          frame: frameBox,
          strokes,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function triggerFrameGeneration(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const targetId = projectId || 'new';
    setGenerating(true);
    try {
      const res = await fetch(`/api/v1/canvases/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_frame',
          modelId,
          prompt: prompt.trim() || 'Isometric dark fantasy citadel sketch-to-image synthesis',
          width: frameBox.width,
          height: frameBox.height,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.assets?.[0]?.dataUrl) {
          setGeneratedFrameUrl(data.assets[0].dataUrl);
        }
      }
    } finally {
      setGenerating(false);
    }
  }

  function handleUndo() {
    if (strokes.length === 0) return;
    const popped = strokes[strokes.length - 1];
    setStrokes((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, popped]);
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    const restored = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setStrokes((prev) => [...prev, restored]);
  }

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#0b0b0c] text-white">
      {/* Top Canvas Header (Replicating Screenshot 20: 20-app-canvas-editor.png) */}
      <header className="z-30 flex h-12 items-center justify-between border-b border-[#22222a] bg-[#121216]/95 px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a2a33] bg-[#18181f] text-zinc-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg bg-transparent px-2 py-1 text-xs font-bold text-white outline-none focus:bg-[#1b1b22]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveCanvas}
            className="flex items-center gap-1.5 rounded-lg border border-[#2c2c35] bg-[#18181f] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500"
          >
            <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save'}
          </button>
          {generatedFrameUrl && (
            <a
              href={generatedFrameUrl}
              download={`${title || 'canvas'}-export.svg`}
              className="flex items-center gap-1.5 rounded-lg bg-[#0099ff] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0080db]"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </a>
          )}
        </div>
      </header>

      {/* Left Floating Vertical Tool Rail (Replicating Screenshot 20) */}
      <div className="absolute left-4 top-16 z-30 flex flex-col items-center gap-1.5 rounded-2xl border border-[#2a2a33] bg-[#141419]/95 p-2 shadow-2xl backdrop-blur-md">
        {[
          { id: 'select', label: 'Select (V)', icon: MousePointer },
          { id: 'frame', label: 'Generation Frame (F)', icon: Frame },
          { id: 'pan', label: 'Pan Canvas (H)', icon: Hand },
          { id: 'brush', label: 'Sketch Brush (B)', icon: Brush },
          { id: 'mask', label: 'Inpaint Mask (M)', icon: Layers },
          { id: 'eraser', label: 'Eraser (E)', icon: Eraser },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTool(item.id as typeof tool)}
            title={item.label}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
              tool === item.id
                ? 'bg-[#0099ff] text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <item.icon className="h-4 w-4" />
          </button>
        ))}

        <div className="my-1 h-px w-6 bg-[#26262f]" />

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          title="Brush Color"
          className="h-7 w-7 cursor-pointer rounded-full border border-zinc-700 bg-transparent"
        />

        <button
          type="button"
          onClick={handleUndo}
          title="Undo"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleRedo}
          title="Redo"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setZoom((z) => (z >= 150 ? 75 : z + 25))}
          className="mt-1 rounded-lg bg-[#1d1d24] px-2 py-1 text-[10px] font-semibold text-zinc-300"
        >
          {zoom}%
        </button>
      </div>

      {/* Main Interactive Infinite Canvas Viewport */}
      <div className="scenario-checkerboard relative flex-1 overflow-hidden">
        <svg
          ref={svgRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          className="h-full w-full cursor-crosshair"
        >
          {/* Active Bounding Generation Frame */}
          <g transform={`translate(${frameBox.x}, ${frameBox.y})`}>
            <rect
              width={frameBox.width}
              height={frameBox.height}
              fill="#0b0b0e"
              fillOpacity={0.65}
              stroke="#0099ff"
              strokeWidth={2}
              strokeDasharray="8 4"
              rx={8}
            />
            {generatedFrameUrl && (
              <image
                href={generatedFrameUrl}
                width={frameBox.width}
                height={frameBox.height}
                preserveAspectRatio="xMidYMid slice"
              />
            )}
            <rect
              x={0}
              y={-26}
              width={210}
              height={22}
              rx={5}
              fill="#0099ff"
            />
            <text
              x={8}
              y={-11}
              fill="#ffffff"
              fontSize={11}
              fontWeight="bold"
              fontFamily="Inter, sans-serif"
            >
              Generation Frame · {frameBox.width}×{frameBox.height}
            </text>
          </g>

          {/* User Sketch & Inpaint Mask Strokes */}
          {strokes.map((st) => {
            if (st.points.length === 0) return null;
            const d = st.points
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
              .join(' ');
            return (
              <path
                key={st.id}
                d={d}
                fill="none"
                stroke={st.color}
                strokeWidth={st.size}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={st.tool === 'mask' ? 0.5 : 1}
              />
            );
          })}
        </svg>
      </div>

      {/* Bottom Floating Prompt & Live Mode Bar (Replicating Screenshot 20) */}
      <div className="absolute bottom-5 left-1/2 z-30 flex w-full max-w-3xl -translate-x-1/2 items-center gap-2 px-4">
        <form
          onSubmit={triggerFrameGeneration}
          className="flex flex-1 items-center gap-2 rounded-2xl border border-[#2c2c36] bg-[#141419]/95 p-2 shadow-2xl backdrop-blur-md"
        >
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="rounded-xl border border-[#2a2a33] bg-[#1d1d24] px-3 py-2 text-xs font-semibold text-white outline-none"
          >
            {SYSTEM_MODELS.slice(0, 6).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your image or sketch inside the bounding frame..."
            className="flex-1 bg-transparent px-2 text-xs text-white outline-none placeholder:text-zinc-500"
          />

          <button
            type="submit"
            disabled={generating}
            className="flex items-center gap-1.5 rounded-xl bg-[#0099ff] px-4 py-2 text-xs font-bold text-white hover:bg-[#0080db] disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {generating ? 'Rendering...' : 'Generate'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setLiveMode(!liveMode)}
          className={`flex items-center gap-1.5 rounded-2xl border px-4 py-3 text-xs font-bold shadow-xl transition ${
            liveMode
              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
              : 'border-[#2c2c36] bg-[#141419]/95 text-zinc-400 hover:text-white'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              liveMode ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
            }`}
          />
          Live
        </button>
      </div>
    </div>
  );
}
