'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Play,
  Save,
  Rocket,
  Sparkles,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { WORKFLOW_NODE_SCHEMAS } from '@/lib/system-catalog';
import { useWorkspace } from '@/components/providers/SessionProviderWrapper';

type GraphNode = {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
};

export default function WorkflowNodeEditorPage() {
  const params = useParams();
  const workflowId = String(params?.id || 'new');
  const { refreshWorkspace } = useWorkspace();

  const [dbId, setDbId] = useState<string>(workflowId);
  const [name, setName] = useState('Untitled Workflow');
  const [isPublishedApp, setIsPublishedApp] = useState(false);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [runOutputs, setRunOutputs] = useState<
    Array<{
      nodeId: string;
      label: string;
      status: string;
      oscuUsed: number;
      asset?: { id: string; title: string; dataUrl: string; toolBadge: string };
    }>
  >([]);

  useEffect(() => {
    fetch(`/api/v1/workflows/${workflowId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.workflow) {
          setDbId(d.workflow.id);
          setName(d.workflow.name || 'Untitled Workflow');
          setIsPublishedApp(Boolean(d.workflow.isPublishedApp));
          try {
            const parsedNodes = JSON.parse(d.workflow.nodesJson || '[]');
            const parsedEdges = JSON.parse(d.workflow.edgesJson || '[]');
            setNodes(parsedNodes);
            setEdges(parsedEdges);
            if (parsedNodes[0]) setSelectedNodeId(parsedNodes[0].id);
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {});
  }, [workflowId]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  function handleAddNode(schemaType: string, label: string, defaultConfig: Record<string, unknown>) {
    const newId = `node_${Date.now()}`;
    const lastNode = nodes[nodes.length - 1];
    const newNode: GraphNode = {
      id: newId,
      type: schemaType,
      label,
      position: {
        x: lastNode ? lastNode.position.x + 280 : 120,
        y: lastNode ? lastNode.position.y : 180,
      },
      config: { ...defaultConfig },
    };
    setNodes((prev) => [...prev, newNode]);
    if (lastNode) {
      setEdges((prev) => [
        ...prev,
        { id: `e_${Date.now()}`, source: lastNode.id, target: newId },
      ]);
    }
    setSelectedNodeId(newId);
    setAddMenuOpen(false);
  }

  function handleDeleteNode(nodeId: string) {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }

  async function handleSaveGraph(publishToggle?: boolean) {
    setSaving(true);
    const nextPublish = publishToggle !== undefined ? publishToggle : isPublishedApp;
    try {
      const res = await fetch(`/api/v1/workflows/${dbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          nodes,
          edges,
          isPublishedApp: nextPublish,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDbId(data.workflow.id);
        setIsPublishedApp(Boolean(data.workflow.isPublishedApp));
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRunWorkflow() {
    setRunning(true);
    try {
      await handleSaveGraph();
      const res = await fetch(`/api/v1/workflows/${dbId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: {} }),
      });
      if (res.ok) {
        const data = await res.json();
        setRunOutputs(data.nodeOutputs || []);
        await refreshWorkspace();
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0b0b0c] text-white">
      {/* Top Bar (Replicating Screenshot 23: 23-app-workflow-node-editor.png) */}
      <header className="z-30 flex h-13 items-center justify-between border-b border-[#22222a] bg-[#121216] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link
            href="/workflows"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a2a33] bg-[#18181f] text-zinc-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg bg-transparent px-2 py-1 text-xs font-bold text-white outline-none focus:bg-[#1c1c24]"
          />
          <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
            {nodes.length} Nodes · {edges.length} Edges
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSaveGraph()}
            className="flex items-center gap-1.5 rounded-xl border border-[#2a2a33] bg-[#18181f] px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-500"
          >
            <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save Graph'}
          </button>

          <button
            type="button"
            onClick={() => handleSaveGraph(!isPublishedApp)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              isPublishedApp
                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                : 'border-[#2a2a33] bg-[#18181f] text-zinc-300 hover:border-zinc-500'
            }`}
          >
            <Rocket className="h-3.5 w-3.5" />
            {isPublishedApp ? 'Published as App' : 'Publish as App'}
          </button>

          <button
            type="button"
            disabled={running}
            onClick={handleRunWorkflow}
            className="flex items-center gap-1.5 rounded-xl bg-[#0099ff] px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-[#0099ff]/25 hover:bg-[#0080db] disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" />
            {running ? 'Executing DAG...' : 'Run Workflow'}
          </button>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Floating Add Node Palette Button */}
        <div className="absolute left-4 top-4 z-30">
          <button
            type="button"
            onClick={() => setAddMenuOpen(!addMenuOpen)}
            className="flex items-center gap-1.5 rounded-xl bg-[#0099ff] px-3.5 py-2 text-xs font-bold text-white shadow-xl hover:bg-[#0080db]"
          >
            <Plus className="h-4 w-4" /> Add Node ({WORKFLOW_NODE_SCHEMAS.length})
          </button>

          {addMenuOpen && (
            <div className="mt-2 max-h-[72vh] w-80 overflow-y-auto rounded-2xl border border-[#2c2c36] bg-[#141419]/95 p-3 shadow-2xl backdrop-blur-md">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                16 Scenario Compute Nodes
              </p>
              <div className="space-y-1.5">
                {WORKFLOW_NODE_SCHEMAS.map((schema) => (
                  <button
                    key={schema.type}
                    type="button"
                    onClick={() =>
                      handleAddNode(
                        schema.type,
                        schema.label,
                        schema.defaultConfig as Record<string, unknown>
                      )
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-[#24242d] bg-[#191921] px-3 py-2 text-left text-xs transition hover:border-[#0099ff]"
                  >
                    <div>
                      <p className="font-bold text-white">{schema.label}</p>
                      <p className="text-[10px] text-zinc-400">
                        {schema.category} · in: {schema.inputs.join(', ') || 'none'} → out:{' '}
                        {schema.outputs.join(', ')}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-[#0099ff]">
                      {schema.oscuCost} CU
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center Node Graph Canvas */}
        <div className="scenario-dot-grid relative flex-1 overflow-auto p-12">
          {/* SVG Bezier Edge Connectors */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {edges.map((edge) => {
              const src = nodes.find((n) => n.id === edge.source);
              const dst = nodes.find((n) => n.id === edge.target);
              if (!src || !dst) return null;
              const x1 = src.position.x + 220;
              const y1 = src.position.y + 52;
              const x2 = dst.position.x;
              const y2 = dst.position.y + 52;
              const cx = (x1 + x2) / 2;
              return (
                <path
                  key={edge.id}
                  d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="#0099ff"
                  strokeWidth={2.5}
                />
              );
            })}
          </svg>

          {/* Interactive DAG Node Cards */}
          {nodes.map((node) => {
            const out = runOutputs.find((o) => o.nodeId === node.id);
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                style={{ left: node.position.x, top: node.position.y }}
                className={`absolute w-56 cursor-pointer rounded-2xl border bg-[#15151b]/95 p-3.5 shadow-xl transition ${
                  selectedNodeId === node.id
                    ? 'border-[#0099ff] ring-2 ring-[#0099ff]/30'
                    : 'border-[#2a2a34] hover:border-zinc-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-[#0099ff]/15 px-2 py-0.5 font-mono text-[10px] text-[#0099ff]">
                    {node.type}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode(node.id);
                    }}
                    className="text-zinc-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="mt-2 text-xs font-bold text-white">{node.label}</p>

                {typeof node.config?.value === 'string' && (
                  <p className="mt-1 line-clamp-2 rounded bg-[#0e0e12] p-1.5 text-[10px] text-zinc-400">
                    {node.config.value}
                  </p>
                )}

                {out?.asset && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-emerald-500/40">
                    <img
                      src={out.asset.dataUrl}
                      alt={out.asset.title}
                      className="h-28 w-full object-cover"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Node Inspector & Workflow AI Agent Dock (Replicating Screenshot 47: 47-app-workflow-node-editor-clean.png) */}
        <aside className="flex w-80 shrink-0 flex-col border-l border-[#22222a] bg-[#121216] p-4">
          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#0099ff]">
                  Node Inspector
                </span>
                <h3 className="text-sm font-bold text-white">{selectedNode.label}</h3>
                <p className="font-mono text-[11px] text-zinc-500">{selectedNode.type}</p>
              </div>

              {Object.entries(selectedNode.config || {}).map(([key, val]) => (
                <label key={key} className="block text-xs text-zinc-300">
                  <span className="capitalize">{key}</span>
                  <input
                    type="text"
                    value={String(val ?? '')}
                    onChange={(e) => {
                      const nextVal = e.target.value;
                      setNodes((prev) =>
                        prev.map((n) =>
                          n.id === selectedNode.id
                            ? { ...n, config: { ...n.config, [key]: nextVal } }
                            : n
                        )
                      );
                    }}
                    className="mt-1 w-full rounded-xl border border-[#2a2a33] bg-[#0e0e12] px-3 py-2 text-xs text-white outline-none focus:border-[#0099ff]"
                  />
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Select a node on the canvas to inspect parameters.</p>
          )}

          {/* Integrated Workflow AI Agent Panel (Claude Opus 4.7 / Ask anything...) */}
          <div className="mt-6 rounded-2xl border border-[#252530] bg-[#16161d] p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Sparkles className="h-3.5 w-3.5 text-[#0099ff]" />
                <span>Workflow AI Agent</span>
              </div>
              <span className="rounded bg-[#22222c] px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                Claude Opus 4.7
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-400">
              Ask the agent to wire nodes, insert an Approval gate, or add a 3D/PBR branch.
            </p>
            <div className="mt-2.5 flex gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleAddNode('approval', 'Art Director Approval Gate', {
                    question: 'Approve character sheet before 3D mesh generation?',
                  })
                }
                className="flex-1 rounded-lg border border-[#2c2c38] bg-[#1d1d26] px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 hover:border-[#0099ff]"
              >
                + Add Approval Gate
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAddNode('choose', 'Choose Variant Node', {
                    question: 'Pick the best concept variant to upscale:',
                  })
                }
                className="flex-1 rounded-lg border border-[#2c2c38] bg-[#1d1d26] px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 hover:border-[#0099ff]"
              >
                + Add Choose Node
              </button>
            </div>
          </div>

          {/* Execution Run Results */}
          {runOutputs.length > 0 && (
            <div className="mt-6 flex-1 overflow-y-auto border-t border-[#23232c] pt-4">
              <div className="mb-3 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>DAG Execution Complete ({runOutputs.length} nodes)</span>
              </div>
              <div className="space-y-2.5">
                {runOutputs.map((ro) => (
                  <div
                    key={ro.nodeId}
                    className="rounded-xl border border-[#25252f] bg-[#18181f] p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{ro.label}</span>
                      <span className="text-[10px] text-sky-400">{ro.oscuUsed} CU</span>
                    </div>
                    {ro.asset && (
                      <img
                        src={ro.asset.dataUrl}
                        alt={ro.asset.title}
                        className="mt-2 h-28 w-full rounded-lg object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
