'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid email or password, or your account is not active.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#09090b] text-white">
      {/* Left Auth Column (Replicating Screenshot 03: app.scenario.com/login) */}
      <div className="flex w-full flex-col justify-between p-8 md:w-[480px] lg:w-[520px] lg:p-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-black text-black">
              S
            </div>
            <span className="text-base font-bold tracking-tight">Scenario</span>
          </Link>
          <Link
            href="/register"
            className="text-xs font-medium text-[#0099ff] hover:underline"
          >
            Have an Invite Code?
          </Link>
        </div>

        <div className="my-auto py-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Sign in to Scenario
          </h1>
          <p className="mt-1.5 text-xs text-zinc-400">
            Enter your studio credentials to access your organization and projects.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300">
                Email address
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="artist@studio.com"
                  className="w-full rounded-xl border border-[#2a2a33] bg-[#131317] py-2.5 pl-9 pr-3 text-xs text-white outline-none focus:border-[#0099ff]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-[#2a2a33] bg-[#131317] py-2.5 pl-9 pr-3 text-xs text-white outline-none focus:border-[#0099ff]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0099ff] py-2.5 text-xs font-bold text-white shadow-lg shadow-[#0099ff]/20 transition hover:bg-[#0080db] disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Continue to Studio'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-[#23232b] bg-[#121216] p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <ShieldCheck className="h-4 w-4 text-[#0099ff]" />
              <span>Invite-Only Workspace Admission</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
              New studio members require a single-use or expiring invitation code (`SCEN-XXXX-XXXX-XXXX`) issued by a platform administrator.
            </p>
            <Link
              href="/register"
              className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-[#0099ff] hover:underline"
            >
              Redeem Invitation Code &amp; Create Account →
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-zinc-500">
          Protected by Scenario Enterprise RBAC &amp; Audit Governance.
        </p>
      </div>

      {/* Right Artwork Showcase Column */}
      <div className="relative hidden flex-1 items-end overflow-hidden border-l border-[#1f1f26] bg-gradient-to-br from-[#0d1526] via-[#17112b] to-[#081c24] p-12 md:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_60%_35%,rgba(0,153,255,0.22),transparent_60%)]" />
        <div className="relative z-10 max-w-lg rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur-md">
          <span className="rounded bg-[#0099ff]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#0099ff]">
            Scenario Production Engine
          </span>
          <h2 className="mt-2 text-xl font-bold text-white">
            Train Custom LoRA Models &amp; Build Visual Node Pipelines
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
            Generate style-consistent 2D game art, PBR seamless textures, 360° skyboxes, watertight 3D GLB/OBJ meshes, and studio audio in one unified workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
