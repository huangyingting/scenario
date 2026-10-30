'use client';

import React, { useEffect, useState } from 'react';
import {
  Folder,
  Plus,
  Globe,
  Lock,
  Trash2,
} from 'lucide-react';
import { ScenarioShell } from '@/components/layout/ScenarioShell';

type CollectionRecord = {
  id: string;
  name: string;
  description: string;
  visibility: string;
  shareSlug: string | null;
  createdAt: string;
  _count?: { assets: number };
};

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [tab, setTab] = useState<'all' | 'public' | 'private'>('all');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [creating, setCreating] = useState(false);

  async function loadCollections() {
    const res = await fetch('/api/v1/collections');
    if (res.ok) {
      const data = await res.json();
      setCollections(data.collections || []);
    }
  }

  useEffect(() => {
    loadCollections();
  }, []);

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/v1/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          visibility,
        }),
      });
      if (res.ok) {
        setName('');
        setDescription('');
        await loadCollections();
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleVisibility(col: CollectionRecord) {
    const nextVis = col.visibility === 'public' ? 'private' : 'public';
    await fetch('/api/v1/collections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: col.id, visibility: nextVis }),
    });
    await loadCollections();
  }

  async function handleDeleteCollection(id: string) {
    await fetch(`/api/v1/collections?id=${id}`, { method: 'DELETE' });
    await loadCollections();
  }

  const filtered = collections.filter((c) => {
    if (tab !== 'all' && c.visibility !== tab) return false;
    return true;
  });

  return (
    <ScenarioShell>
      <div className="mx-auto max-w-[1440px] space-y-6 p-6">
        {/* Top Bar (Replicating Screenshot 28: 28-app-collections.png) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 rounded-xl border border-[#25252e] bg-[#141418] p-1">
            {[
              { id: 'all', label: 'All Collections' },
              { id: 'public', label: 'Public Shared' },
              { id: 'private', label: 'Private Workspace' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as typeof tab)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  tab === t.id
                    ? 'bg-[#0099ff] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Create Collection Form */}
          <form
            onSubmit={handleCreateCollection}
            className="space-y-4 rounded-2xl border border-[#25252e] bg-[#141418] p-5 lg:col-span-4"
          >
            <h2 className="text-sm font-bold text-white">Create a Collection</h2>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Collection Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Act II Dungeon Props & Skyboxes"
                className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3 py-2 text-xs text-white outline-none focus:border-[#0099ff]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Curated assets for milestone review..."
                className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] p-3 text-xs text-white outline-none focus:border-[#0099ff]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'private' | 'public')}
                className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3 py-2 text-xs text-white"
              >
                <option value="private">Private to Project</option>
                <option value="public">Public Shareable Link</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0099ff] py-2.5 text-xs font-bold text-white hover:bg-[#0080db]"
            >
              <Plus className="h-4 w-4" />
              {creating ? 'Creating...' : 'Create Collection'}
            </button>
          </form>

          {/* Collections Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            {filtered.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#25252e] p-12 text-center">
                <Folder className="h-10 w-10 text-zinc-500" />
                <p className="mt-3 text-sm font-bold text-white">No Collections Yet</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Create a collection on the left to organize and share generated game assets.
                </p>
              </div>
            ) : (
              filtered.map((col) => (
                <div
                  key={col.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#25252e] bg-[#141418] p-5"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 rounded-md bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold uppercase text-zinc-200">
                        {col.visibility === 'public' ? (
                          <>
                            <Globe className="h-3 w-3 text-emerald-400" /> Public
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3 text-amber-400" /> Private
                          </>
                        )}
                      </span>
                      <span className="text-xs font-semibold text-[#0099ff]">
                        {col._count?.assets || 0} Assets
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-white">{col.name}</h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      {col.description || 'Workspace curated asset folder'}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#22222a] pt-3.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(col)}
                      className="font-semibold text-[#0099ff] hover:underline"
                    >
                      Switch to {col.visibility === 'public' ? 'Private' : 'Public'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCollection(col.id)}
                      className="text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ScenarioShell>
  );
}
