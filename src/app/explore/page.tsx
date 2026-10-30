'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Compass,
  Sliders,
} from 'lucide-react';
import { ScenarioShell } from '@/components/layout/ScenarioShell';
import { SYSTEM_MODELS } from '@/lib/system-catalog';

type ExploreAsset = {
  id: string;
  title: string;
  prompt: string;
  modelId: string;
  modelName: string;
  toolBadge: string;
  width: number;
  height: number;
  dataUrl: string;
};

export default function ExplorePage() {
  const [tab, setTab] = useState<'gallery' | 'models'>('gallery');
  const [ratioFilter, setRatioFilter] = useState<'all' | 'square' | 'landscape' | 'portrait'>('all');
  const [search, setSearch] = useState('');
  const [publishedAssets, setPublishedAssets] = useState<ExploreAsset[]>([]);

  useEffect(() => {
    fetch('/api/v1/assets?explore=true')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.assets) setPublishedAssets(d.assets);
      })
      .catch(() => {});
  }, []);

  const filteredAssets = publishedAssets.filter((a) => {
    if (ratioFilter === 'square' && a.width !== a.height) return false;
    if (ratioFilter === 'landscape' && a.width <= a.height) return false;
    if (ratioFilter === 'portrait' && a.height <= a.width) return false;
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
    <ScenarioShell>
      <div className="mx-auto max-w-[1440px] space-y-6 p-6">
        {/* Top Filter Bar (Replicating Screenshot 29: 29-app-explore-community.png) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-[#25252e] bg-[#141418] p-1">
              <button
                type="button"
                onClick={() => setTab('gallery')}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                  tab === 'gallery'
                    ? 'bg-[#0099ff] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Gallery ({publishedAssets.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('models')}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                  tab === 'models'
                    ? 'bg-[#0099ff] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Models ({SYSTEM_MODELS.length})
              </button>
            </div>

            {tab === 'gallery' && (
              <div className="flex items-center gap-1 rounded-xl border border-[#25252e] bg-[#141418] p-1 text-xs">
                {(['all', 'square', 'landscape', 'portrait'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRatioFilter(r)}
                    className={`rounded-lg px-3 py-1.5 capitalize ${
                      ratioFilter === r
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search community creations & models..."
              className="w-full rounded-xl border border-[#26262f] bg-[#141418] py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-[#0099ff]"
            />
          </div>
        </div>

        {tab === 'gallery' ? (
          filteredAssets.length === 0 ? (
            <div className="rounded-2xl border border-[#25252e] bg-[#141418] p-12 text-center">
              <Compass className="mx-auto h-10 w-10 text-[#0099ff]" />
              <h2 className="mt-3 text-sm font-bold text-white">
                Explore Published Workspace Creations
              </h2>
              <p className="mx-auto mt-1 max-w-md text-xs text-zinc-400">
                Publish any generated asset from the Studio Inspector to showcase it in the Explore Gallery with one-click Remix Prompt support, or switch to the{' '}
                <button
                  type="button"
                  onClick={() => setTab('models')}
                  className="font-semibold text-[#0099ff] underline"
                >
                  Models showcase
                </button>
                .
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group overflow-hidden rounded-2xl border border-[#25252e] bg-[#141418]"
                >
                  <div className="relative aspect-square overflow-hidden bg-[#0e0e12]">
                    <img
                      src={asset.dataUrl}
                      alt={asset.title}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-2.5 left-2.5 rounded bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {asset.toolBadge}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 text-xs text-zinc-300">{asset.prompt}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500">{asset.modelName}</span>
                      <Link
                        href={`/create?mode=image&modelId=${asset.modelId}&prompt=${encodeURIComponent(
                          asset.prompt
                        )}`}
                        className="flex items-center gap-1 rounded-lg bg-[#0099ff] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#0080db]"
                      >
                        <Sparkles className="h-3 w-3" /> Remix Prompt
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SYSTEM_MODELS.map((m) => (
              <div
                key={m.id}
                className="flex flex-col justify-between rounded-2xl border border-[#25252e] bg-[#141418] p-5"
              >
                <div>
                  <span className="rounded bg-[#0099ff]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#0099ff]">
                    {m.type} · {m.modality}
                  </span>
                  <h3 className="mt-2.5 text-sm font-bold text-white">{m.name}</h3>
                  <p className="mt-1 text-xs text-zinc-400">{m.description}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#22222a] pt-3">
                  <Link
                    href={`/create?mode=${
                      m.modality === 'edit' ? 'upscale' : m.modality
                    }&modelId=${m.id}`}
                    className="flex items-center gap-1 rounded-xl bg-[#0099ff] px-3 py-1.5 text-xs font-bold text-white"
                  >
                    <Sliders className="h-3.5 w-3.5" /> Launch in Studio
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
