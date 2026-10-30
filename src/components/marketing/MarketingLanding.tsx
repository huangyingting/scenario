'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  Box,
  Volume2,
  GitBranch,
  Layers,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

export function MarketingLanding() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5]">
      {/* Marketing Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09090b]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-black text-black">
              S
            </div>
            <span className="text-base font-bold tracking-tight text-white">Scenario</span>
            <span className="hidden rounded-full border border-[#0099ff]/40 bg-[#0099ff]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#0099ff] sm:inline-block">
              Enterprise AI Production Engine
            </span>
          </div>

          <nav className="hidden items-center gap-7 text-xs font-medium text-zinc-300 md:flex">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#workflows" className="hover:text-white">
              Workflows
            </a>
            <a href="#models" className="hover:text-white">
              Custom Models
            </a>
            <a href="#security" className="hover:text-white">
              Security &amp; Governance
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-500 hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 rounded-lg bg-[#0099ff] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#0099ff]/25 hover:bg-[#0080db]"
            >
              Redeem Invite <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/10 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(0,153,255,0.18),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 text-xs text-zinc-300">
            <Sparkles className="h-3.5 w-3.5 text-[#0099ff]" />
            <span>Control · Consistency · Scale — Multi-Modal Game &amp; Creative AI</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Train Your Style. Automate Your Entire Creative Pipeline.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Generate style-consistent 2D art, cinematic videos, watertight 3D PBR meshes, seamless textures, 360° skyboxes, and studio audio—powered by custom LoRA training and visual node workflows.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black hover:bg-zinc-200"
            >
              Launch Studio <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-6 py-3 text-sm font-semibold text-white hover:border-[#0099ff]"
            >
              <ShieldCheck className="h-4 w-4 text-[#0099ff]" />
              Register with Invitation Code
            </Link>
          </div>
        </div>
      </section>

      {/* Multi-Modal Capabilities Grid */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Every Modality Your Production Needs, In One Workspace
          </h2>
          <p className="mt-2 text-xs text-zinc-400 sm:text-sm">
            From initial concept art and LoRA training to 3D PBR assets and node-based batch automation.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: ImageIcon,
              title: '2D Images, PBR Textures & 360° Skyboxes',
              desc: 'Generate character turnarounds, isometric tilesets, 100% seamless X/Y PBR textures (Albedo, Normal, Roughness, AO), and equirectangular skybox domes.',
              badge: 'FLUX.1 · Gemini 3.1',
            },
            {
              icon: Box,
              title: 'Watertight 3D Meshes (GLB / OBJ)',
              desc: 'Convert 2D concepts or prompts into game-ready 3D meshes with quad remeshing and physically based material channels.',
              badge: 'Hunyuan3D 2.5 · Tripo v2',
            },
            {
              icon: Video,
              title: 'Cinematic Video & Motion Control',
              desc: 'Synthesize up to 30-second multi-shot cutscenes and animated VFX loops with camera motion and synchronized audio.',
              badge: 'Seedance 2.5 · Kling V4',
            },
            {
              icon: Cpu,
              title: 'Custom LoRA Training & 5-Model Compose',
              desc: 'Lock in your studio aesthetic by training custom models or blending up to 5 LoRA models with real-time weight sliders.',
              badge: 'Train & Compose',
            },
            {
              icon: GitBranch,
              title: '16-Node Visual Workflows & Apps',
              desc: 'Connect prompts, LLMs, generators, background removal, upscalers, and approval gates into reusable DAG pipelines and 1-click Workflow Apps.',
              badge: 'DAG Automation',
            },
            {
              icon: Volume2,
              title: 'Infinite Canvas & Audio Synthesis',
              desc: 'Sketch with live real-time bounding frame generation on the Infinite Canvas and synthesize playable WAV game sound effects.',
              badge: 'Live Canvas · WAV Synth',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-[#24242d] bg-[#121216] p-6 transition hover:border-[#0099ff]/60"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0099ff]/15 text-[#0099ff]">
                  <card.icon className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-[11px] text-zinc-300">
                  {card.badge}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{card.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security & Invite-Only Admission Banner */}
      <section id="security" className="border-t border-white/10 bg-[#101014] py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-2xl border border-[#2a2a35] bg-[#15151b] p-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Enterprise Invite-Only Security &amp; Governance</span>
                </div>
                <h3 className="mt-2 text-xl font-bold text-white">
                  Zero Public Sign-Ups. Full Audit Traceability.
                </h3>
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-zinc-400">
                  Every account admission requires a cryptographic single-use or expiring invitation code (`SCEN-XXXX-XXXX-XXXX`) with role-based access control (`USER`, `ADMIN`, `SUPER_ADMIN`), instant revocation, code rotation, and immutable security audit logs.
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[#0099ff]" /> Single-Use Atomic Redemption
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[#0099ff]" /> Quality Gate Brand Guardrails
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[#0099ff]" /> Dual SQLite &amp; PostgreSQL Engine
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2.5">
                <Link
                  href="/register"
                  className="rounded-xl bg-[#0099ff] px-5 py-2.5 text-center text-xs font-bold text-white hover:bg-[#0080db]"
                >
                  Redeem Invitation Code
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl border border-zinc-700 px-5 py-2.5 text-center text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
                >
                  Existing Member Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
