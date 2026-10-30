'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  SlidersHorizontal,
  X,
  Sparkles,
  GitBranch,
} from 'lucide-react';
import { ScenarioShell } from '@/components/layout/ScenarioShell';

type ReviewItem = {
  id: string;
  workflowId: string;
  workflowName: string;
  type: 'approval' | 'choose';
  question: string;
  status: 'pending' | 'confirmed' | 'selected' | 'stopped';
  author: 'Me' | 'Team';
  createdAt: string;
  options?: string[];
  selectedOption?: string;
};

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev_turnaround_01',
    workflowId: 'wf_character_turnaround',
    workflowName: '6-Angle Character Turnaround & PBR Pipeline',
    type: 'approval',
    question: 'Approve front/side/back character poses before 3D mesh extraction and PBR texture baking?',
    status: 'pending',
    author: 'Me',
    createdAt: '12 minutes ago',
  },
  {
    id: 'rev_skybox_choose_02',
    workflowId: 'wf_world_skybox',
    workflowName: '360° Biome Skybox & Gaussian Splat Generator',
    type: 'choose',
    question: 'Select the preferred 360° equirectangular lighting variant to convert into an explorable 3D World:',
    status: 'pending',
    author: 'Me',
    createdAt: '38 minutes ago',
    options: [
      'Variant A — Torchlit Obsidian Cavern (Warm Rim Light)',
      'Variant B — Bioluminescent Crystal Vault (Cool Cyan Fog)',
      'Variant C — High-Noon Ruined Citadel Courtyard',
    ],
  },
];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [authorFilter, setAuthorFilter] = useState<'Me' | 'All'>('Me');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [activeReviewModal, setActiveReviewModal] = useState<ReviewItem | null>(null);
  const [chosenOption, setChosenOption] = useState<string>('');

  const filtered = reviews.filter((r) => {
    if (authorFilter === 'Me' && r.author !== 'Me') return false;
    if (statusFilter === 'pending' && r.status !== 'pending') return false;
    if (statusFilter === 'completed' && r.status === 'pending') return false;
    return true;
  });

  function handleResolveReview(id: string, nextStatus: ReviewItem['status'], selectedOption?: string) {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: nextStatus,
              selectedOption: selectedOption || r.selectedOption,
            }
          : r
      )
    );
    setActiveReviewModal(null);
  }

  return (
    <ScenarioShell>
      <div className="mx-auto max-w-[1160px] space-y-6 px-6 py-8">
        {/* Header (Replicating Screenshot 51: 51-app-reviews-human-in-the-loop.png) */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Reviews</h1>
            <p className="mt-1 text-xs text-zinc-400">
              Reviews are created when an app or workflow pauses for your input — an approval or a selection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {authorFilter === 'Me' ? (
              <button
                type="button"
                onClick={() => setAuthorFilter('All')}
                className="flex items-center gap-1.5 rounded-lg border border-[#2c2c36] bg-[#16161c] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-600"
              >
                <span>Author: Me</span>
                <X className="h-3.5 w-3.5 text-zinc-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthorFilter('Me')}
                className="flex items-center gap-1.5 rounded-lg border border-[#2c2c36] bg-[#16161c] px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filter Author: Me
              </button>
            )}

            <div className="flex items-center rounded-lg border border-[#25252e] bg-[#141418] p-0.5 text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'completed', label: 'Completed' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setStatusFilter(t.id as typeof statusFilter)}
                  className={`rounded-md px-2.5 py-1 font-medium transition ${
                    statusFilter === t.id
                      ? 'bg-[#0099ff] text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#22222a] bg-[#111115] px-6 py-20 text-center">
            <Clock className="h-9 w-9 text-zinc-500" />
            <h2 className="mt-3 text-sm font-bold text-white">No reviews yet</h2>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-zinc-400">
              Reviews are created when an app or workflow pauses for your input — an approval or a selection.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((rev) => (
              <div
                key={rev.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#24242d] bg-[#141418] p-5 transition hover:border-[#343442]"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        rev.type === 'approval'
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-purple-500/15 text-purple-300'
                      }`}
                    >
                      {rev.type === 'approval' ? 'Approval Gate' : 'Choose Selection'}
                    </span>

                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        rev.status === 'pending'
                          ? 'bg-[#0099ff]/15 text-[#0099ff]'
                          : rev.status === 'stopped'
                          ? 'bg-rose-500/15 text-rose-300'
                          : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {rev.status === 'pending'
                        ? 'Action Required'
                        : rev.status === 'confirmed'
                        ? 'Approved'
                        : rev.status === 'selected'
                        ? 'Selection Submitted'
                        : 'Stopped'}
                    </span>

                    <span className="flex items-center gap-1 text-xs font-semibold text-zinc-300">
                      <GitBranch className="h-3.5 w-3.5 text-zinc-500" />
                      {rev.workflowName}
                    </span>
                    <span className="text-[11px] text-zinc-500">· {rev.createdAt}</span>
                  </div>

                  <p className="text-sm font-medium text-white">{rev.question}</p>
                  {rev.selectedOption && (
                    <p className="text-xs text-emerald-400">
                      Selected: <span className="font-semibold">{rev.selectedOption}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/apps"
                    className="flex items-center gap-1.5 rounded-xl border border-[#2c2c35] bg-[#1a1a22] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View App
                  </Link>

                  {rev.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReviewModal(rev);
                        setChosenOption(rev.options?.[0] || '');
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-[#0099ff] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#0080db]"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Complete Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Completion Modal */}
        {activeReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-[#2c2c36] bg-[#15151a] p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#24242d] pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0099ff]">
                    Human-in-the-Loop Workflow Pause
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {activeReviewModal.workflowName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveReviewModal(null)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-zinc-200">
                {activeReviewModal.question}
              </p>

              {activeReviewModal.type === 'choose' && activeReviewModal.options && (
                <div className="mt-4 space-y-2">
                  {activeReviewModal.options.map((opt) => (
                    <label
                      key={opt}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs transition ${
                        chosenOption === opt
                          ? 'border-[#0099ff] bg-[#0099ff]/10 text-white'
                          : 'border-[#26262f] bg-[#111116] text-zinc-300 hover:border-zinc-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="review-choice"
                        checked={chosenOption === opt}
                        onChange={() => setChosenOption(opt)}
                        className="accent-[#0099ff]"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-[#24242d] pt-4">
                <button
                  type="button"
                  onClick={() => handleResolveReview(activeReviewModal.id, 'stopped')}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject & Stop Run
                </button>

                {activeReviewModal.type === 'approval' ? (
                  <button
                    type="button"
                    onClick={() => handleResolveReview(activeReviewModal.id, 'confirmed')}
                    className="flex items-center gap-1.5 rounded-xl bg-[#0099ff] px-4 py-2 text-xs font-bold text-white hover:bg-[#0080db]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Continue DAG
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      handleResolveReview(activeReviewModal.id, 'selected', chosenOption)
                    }
                    className="flex items-center gap-1.5 rounded-xl bg-[#0099ff] px-4 py-2 text-xs font-bold text-white hover:bg-[#0080db]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Confirm Selection
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ScenarioShell>
  );
}
