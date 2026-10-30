'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [password, setPassword] = useState('');
  const [codeCheck, setCodeCheck] = useState<{
    checked: boolean;
    valid: boolean;
    message: string;
    role?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function verifyCodeNow(rawCode: string, candidateEmail?: string) {
    const trimmed = rawCode.trim();
    if (!trimmed) {
      setCodeCheck(null);
      return;
    }
    try {
      const qs = new URLSearchParams({ code: trimmed });
      if (candidateEmail?.trim()) qs.set('email', candidateEmail.trim());
      const res = await fetch(`/api/v1/invitations/validate?${qs.toString()}`);
      const data = await res.json();
      if (data.valid && data.invitation) {
        setCodeCheck({
          checked: true,
          valid: true,
          role: data.invitation.role,
          message: `Valid ${data.invitation.role} invitation (${data.invitation.remainingUses} use remaining)`,
        });
      } else {
        setCodeCheck({
          checked: true,
          valid: false,
          message: data.reason || 'Invalid or expired invitation code.',
        });
      }
    } catch {
      setCodeCheck({
        checked: true,
        valid: false,
        message: 'Could not validate invitation code.',
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          email: email.trim(),
          name: name.trim(),
          workspaceName: workspaceName.trim() || undefined,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Invitation registration failed.');
        setLoading(false);
        return;
      }

      // Sign in immediately after redeeming invite
      const signInRes = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (signInRes?.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        router.push('/login');
      }
    } catch {
      setError('Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center p-6 sm:p-10">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-black text-black">
              S
            </div>
            <span className="text-base font-bold tracking-tight">Scenario</span>
          </Link>
          <Link href="/login" className="text-xs font-medium text-zinc-400 hover:text-white">
            Sign in instead →
          </Link>
        </div>

        <div className="rounded-2xl border border-[#262630] bg-[#131317] p-6 shadow-2xl">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#0099ff]/30 bg-[#0099ff]/10 px-3 py-1 text-[11px] font-semibold text-[#0099ff]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Invite-Only Studio Admission
          </div>

          <h1 className="text-xl font-bold text-white">Redeem Invitation Code</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Enter your single-use or organization invitation code to provision your Scenario account.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300">
                Invitation Code *
              </label>
              <div className="mt-1.5 flex gap-2">
                <div className="relative flex-1">
                  <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    name="code"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onBlur={() => verifyCodeNow(code, email)}
                    placeholder="SCEN-XXXX-XXXX-XXXX"
                    className="w-full rounded-xl border border-[#2c2c36] bg-[#0d0d10] py-2.5 pl-9 pr-3 font-mono text-xs uppercase text-white outline-none focus:border-[#0099ff]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => verifyCodeNow(code, email)}
                  className="rounded-xl border border-[#2c2c36] bg-[#1b1b22] px-3 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500"
                >
                  Verify
                </button>
              </div>

              {codeCheck?.checked && (
                <div
                  className={`mt-2 flex items-center gap-1.5 text-[11px] ${
                    codeCheck.valid ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {codeCheck.valid ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span>{codeCheck.message}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300">
                Work Email *
              </label>
              <input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => {
                  if (code.trim()) verifyCodeNow(code, email);
                }}
                placeholder="director@gamestudio.com"
                className="mt-1.5 w-full rounded-xl border border-[#2c2c36] bg-[#0d0d10] px-3 py-2.5 text-xs text-white outline-none focus:border-[#0099ff]"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Elena Vance"
                  className="mt-1.5 w-full rounded-xl border border-[#2c2c36] bg-[#0d0d10] px-3 py-2.5 text-xs text-white outline-none focus:border-[#0099ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  Studio / Organization
                </label>
                <input
                  type="text"
                  name="workspaceName"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Vance Interactive"
                  className="mt-1.5 w-full rounded-xl border border-[#2c2c36] bg-[#0d0d10] px-3 py-2.5 text-xs text-white outline-none focus:border-[#0099ff]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300">
                Password (min. 8 characters) *
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="mt-1.5 w-full rounded-xl border border-[#2c2c36] bg-[#0d0d10] px-3 py-2.5 text-xs text-white outline-none focus:border-[#0099ff]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0099ff] py-2.5 text-xs font-bold text-white shadow-lg shadow-[#0099ff]/25 transition hover:bg-[#0080db] disabled:opacity-50"
            >
              {loading ? 'Provisioning Studio Account...' : 'Redeem Invite & Launch Studio'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
