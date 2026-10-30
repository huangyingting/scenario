'use client';

import React, { useEffect, useState } from 'react';
import {
  Search,
  Layers,
  Image as ImageIcon,
  Video,
  Box,
  Volume2,
  FileText,
  Upload,
  PenTool,
  Trash2,
  RotateCcw,
  Download,
  FolderPlus,
} from 'lucide-react';
import { ScenarioShell } from '@/components/layout/ScenarioShell';

type AssetRecord = {
  id: string;
  modality: string;
  toolBadge: string;
  title: string;
  prompt: string;
  modelName: string;
  dataUrl: string;
  width: number;
  height: number;
  seed: number;
  isUploaded: boolean;
  isDeleted: boolean;
  createdAt: string;
};

const RAIL_FILTERS = [
  { id: 'all', label: 'All Assets', icon: Layers },
  { id: 'image', label: 'Images', icon: ImageIcon },
  { id: 'video', label: 'Videos', icon: Video },
  { id: '3d', label: '3D Models', icon: Box },
  { id: 'audio', label: 'Audio & SFX', icon: Volume2 },
  { id: 'text', label: 'Text & Lore', icon: FileText },
  { id: 'uploads', label: 'Uploads', icon: Upload },
  { id: 'canvas', label: 'Canvas Exports', icon: PenTool },
  { id: 'trash', label: 'Trash Bin', icon: Trash2 },
];

export default function AssetsHubPage() {
  const [activeRail, setActiveRail] = useState('all');
  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [collections, setCollections] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');

  async function loadAssets(rail = activeRail) {
    const params = new URLSearchParams();
    if (rail === 'trash') {
      params.set('trash', 'true');
    } else if (rail === 'uploads') {
      params.set('uploads', 'true');
    } else if (rail !== 'all' && rail !== 'canvas') {
      params.set('modality', rail);
    }
    const res = await fetch(`/api/v1/assets?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      let list: AssetRecord[] = data.assets || [];
      if (rail === 'canvas') {
        list = list.filter((a) => a.toolBadge === 'Canvas');
      }
      setAssets(list);
    }
  }

  useEffect(() => {
    loadAssets(activeRail);
  }, [activeRail]);

  useEffect(() => {
    fetch('/api/v1/collections')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.collections) setCollections(d.collections);
      })
      .catch(() => {});
  }, []);

  async function handleAssetAction(id: string, action: 'trash' | 'restore' | 'assign', collectionId?: string) {
    if (action === 'assign' && collectionId) {
      await fetch('/api/v1/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, collectionId }),
      });
    } else {
      await fetch('/api/v1/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
    }
    await loadAssets(activeRail);
  }

  async function handlePermanentDelete(id: string) {
    await fetch(`/api/v1/assets?id=${id}`, { method: 'DELETE' });
    await loadAssets(activeRail);
  }

  const filtered = assets.filter((a) => {
    if (
      search.trim() &&
      !a.prompt.toLowerCase().includes(search.toLowerCase()) &&
      !a.title.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <ScenarioShell fullHeight>
      <div className="flex h-[calc(100vh-56px)] overflow-hidden">
        {/* LEFT 9-ICON MODALITY FILTER RAIL (Replicating Screenshot 27: 27-app-assets-library.png) */}
        <aside className="flex w-16 shrink-0 flex-col items-center gap-2 border-r border-[#22222a] bg-[#121216] py-4 md:w-52 md:items-stretch md:px-3">
          {RAIL_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveRail(item.id)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                activeRail === item.id
                  ? 'bg-[#0099ff] text-white'
                  : 'text-zinc-400 hover:bg-[#1b1b22] hover:text-white'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* MAIN ASSETS VIEWPORT */}
        <section className="flex flex-1 flex-col overflow-hidden bg-[#0b0b0c]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#22222a] px-6 py-3.5">
            <div className="relative w-72">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workspace assets..."
                className="w-full rounded-xl border border-[#26262f] bg-[#141418] py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-[#0099ff]"
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400">
              {collections.length > 0 && (
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="rounded-xl border border-[#26262f] bg-[#141418] px-3 py-1.5 text-xs text-white"
                >
                  <option value="">Target Collection...</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              <span>{filtered.length} Assets</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {filtered.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#25252e] p-12 text-center">
                <Layers className="h-10 w-10 text-zinc-500" />
                <p className="mt-3 text-sm font-bold text-white">
                  No Assets in {RAIL_FILTERS.find((r) => r.id === activeRail)?.label}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Generated images, videos, 3D meshes, and audio tracks will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filtered.map((asset) => (
                  <div
                    key={asset.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#25252e] bg-[#141418] transition hover:border-[#0099ff]"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-[#0e0e12]">
                      <img
                        src={asset.dataUrl}
                        alt={asset.title}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-2.5 left-2.5 rounded bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {asset.toolBadge}
                      </span>
                    </div>

                    <div className="p-3.5">
                      <p className="line-clamp-1 text-xs font-bold text-white">
                        {asset.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-400">
                        {asset.prompt}
                      </p>

                      <div className="mt-3 flex items-center justify-between border-t border-[#22222a] pt-2.5">
                        <a
                          href={asset.dataUrl}
                          download={`scenario-${asset.id}.svg`}
                          className="flex items-center gap-1 text-[11px] font-semibold text-[#0099ff] hover:underline"
                        >
                          <Download className="h-3 w-3" /> Download
                        </a>

                        <div className="flex items-center gap-1.5">
                          {selectedCollectionId && !asset.isDeleted && (
                            <button
                              type="button"
                              onClick={() =>
                                handleAssetAction(asset.id, 'assign', selectedCollectionId)
                              }
                              title="Add to Selected Collection"
                              className="rounded bg-[#22222c] p-1 text-zinc-300 hover:text-white"
                            >
                              <FolderPlus className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {asset.isDeleted ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAssetAction(asset.id, 'restore')}
                                className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300"
                              >
                                <RotateCcw className="inline h-3 w-3" /> Restore
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePermanentDelete(asset.id)}
                                className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300"
                              >
                                Purge
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAssetAction(asset.id, 'trash')}
                              className="text-zinc-500 hover:text-rose-400"
                              title="Move to Trash"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </ScenarioShell>
  );
}
