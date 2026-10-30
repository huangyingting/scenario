'use client';

import React, { useState } from 'react';
import { Check, Zap, Sparkles } from 'lucide-react';
import { ScenarioShell } from '@/components/layout/ScenarioShell';
import { useWorkspace } from '@/components/providers/SessionProviderWrapper';

const PLANS = [
  {
    id: 'Start',
    priceMonthly: '$0',
    priceYearly: '$0',
    oscu: 500,
    seats: '1 Seat',
    features: [
      '500 Monthly Compute Units (OSCU)',
      'Access to Images, 3D, Audio & Skybox Studios',
      'Infinite Canvas Sketch-to-Image',
      'Community Explore Access',
    ],
  },
  {
    id: 'Indie',
    priceMonthly: '$29',
    priceYearly: '$23',
    oscu: 3000,
    seats: 'Up to 3 Seats',
    features: [
      '3,000 Monthly Compute Units (OSCU)',
      'Private Custom Flux.1 & SDXL LoRA Trainings',
      'Up to 5-LoRA Model Compositions',
      'Commercial Game Studio License',
    ],
  },
  {
    id: 'Pro',
    priceMonthly: '$79',
    priceYearly: '$63',
    oscu: 10000,
    seats: 'Up to 10 Seats',
    badge: 'MOST POPULAR',
    features: [
      '10,000 Monthly Compute Units (OSCU)',
      '16-Node Visual Workflow Graph Builder & Apps',
      'Priority GPU Inference Queue (Kling V3/V4, Veo 3.1)',
      'Unity, Unreal Engine & Godot REST API Keys',
    ],
  },
  {
    id: 'Team',
    priceMonthly: '$249',
    priceYearly: '$199',
    oscu: 35000,
    seats: 'Up to 25 Seats',
    features: [
      '35,000 Monthly Compute Units (OSCU)',
      'Project Quality Gate & Brand Guardrails',
      'HMAC-SHA256 Webhooks & Audit Logging',
      'Invite-Only Team RBAC Admission Controls',
    ],
  },
  {
    id: 'Enterprise',
    priceMonthly: 'Custom',
    priceYearly: 'Custom',
    oscu: 100000,
    seats: 'Unlimited Seats',
    features: [
      '100,000+ Dedicated Compute Units (OSCU)',
      'Isolated VPC Model Weights & Zero Data Retention',
      'Dedicated Technical Art & Pipeline Engineering SLA',
      'Custom SSO / SAML & Multi-Studio Governance',
    ],
  },
];

export default function PricingPage() {
  const { activeTeam, refreshWorkspace } = useWorkspace();
  const [annual, setAnnual] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  async function handleSelectPlan(planTier: string) {
    setUpdating(planTier);
    try {
      await fetch('/api/v1/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: activeTeam?.id,
          planTier,
        }),
      });
      await refreshWorkspace();
    } finally {
      setUpdating(null);
    }
  }

  async function handleTopUp(amount: number) {
    setUpdating(`topup_${amount}`);
    try {
      await fetch('/api/v1/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: activeTeam?.id,
          topUpOscu: amount,
        }),
      });
      await refreshWorkspace();
    } finally {
      setUpdating(null);
    }
  }

  return (
    <ScenarioShell>
      <div className="mx-auto max-w-[1440px] space-y-8 p-6">
        {/* Header (Replicating Screenshot 30: 30-app-pricing-plans.png) */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#25252e] bg-[#141418] p-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0099ff]">
              ON-DEMAND SCENARIO COMPUTE UNITS (OSCU)
            </span>
            <h1 className="mt-1 text-xl font-bold text-white">
              Scale Your Studio Pipeline with Predictable Compute
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Active Plan:{' '}
              <strong className="text-white">{activeTeam?.planTier || 'Pro'}</strong> ·
              Remaining Balance:{' '}
              <strong className="text-[#0099ff]">
                {activeTeam ? activeTeam.oscuTotal - activeTeam.oscuUsed : 1500} CU
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#2c2c35] bg-[#0e0e12] p-1 text-xs">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`rounded-lg px-3.5 py-1.5 font-semibold ${
                !annual ? 'bg-[#0099ff] text-white' : 'text-zinc-400'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`rounded-lg px-3.5 py-1.5 font-semibold ${
                annual ? 'bg-[#0099ff] text-white' : 'text-zinc-400'
              }`}
            >
              Annual Billing (-20%)
            </button>
          </div>
        </div>

        {/* 5 Tier Cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {PLANS.map((plan) => {
            const isCurrent = activeTeam?.planTier === plan.id;
            return (
              <div
                key={plan.id}
                className={`flex flex-col justify-between rounded-2xl border p-5 ${
                  plan.badge
                    ? 'border-[#0099ff] bg-[#151922]'
                    : 'border-[#25252e] bg-[#141418]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white">{plan.id}</h2>
                    {plan.badge && (
                      <span className="rounded bg-[#0099ff] px-2 py-0.5 text-[9px] font-bold text-white">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-white">
                      {annual ? plan.priceYearly : plan.priceMonthly}
                    </span>
                    {plan.priceMonthly !== 'Custom' && (
                      <span className="text-xs text-zinc-400">/ month</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[#0099ff]">
                    {plan.oscu.toLocaleString()} OSCU · {plan.seats}
                  </p>

                  <ul className="mt-4 space-y-2.5 border-t border-[#23232c] pt-4 text-xs text-zinc-300">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0099ff]" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isCurrent || updating === plan.id}
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`mt-6 w-full rounded-xl py-2.5 text-xs font-bold transition ${
                    isCurrent
                      ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : 'bg-[#0099ff] text-white hover:bg-[#0080db]'
                  }`}
                >
                  {isCurrent
                    ? 'Active Workspace Plan'
                    : updating === plan.id
                      ? 'Switching...'
                      : `Switch to ${plan.id}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Instant OSCU Top-Up Packs */}
        <div className="rounded-2xl border border-[#25252e] bg-[#141418] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <Zap className="h-4 w-4 text-amber-400" /> Instant OSCU Compute Top-Up Packs
              </h3>
              <p className="text-xs text-zinc-400">
                Add rollover Compute Units immediately to your organization ledger for heavy LoRA trainings or batch workflow runs.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {[1000, 5000, 25000].map((pack) => (
                <button
                  key={pack}
                  type="button"
                  onClick={() => handleTopUp(pack)}
                  className="flex items-center gap-1.5 rounded-xl border border-[#2c2c35] bg-[#191921] px-4 py-2 text-xs font-bold text-white hover:border-[#0099ff]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#0099ff]" />+{pack.toLocaleString()} CU
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ScenarioShell>
  );
}
