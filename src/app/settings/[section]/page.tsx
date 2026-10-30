'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  User,
  Building2,
  Users,
  FolderKanban,
  CreditCard,
  ShieldCheck,
  KeyRound,
  Webhook,
  TicketCheck,
  ScrollText,
  Plus,
  RotateCw,
  Ban,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import { ScenarioShell } from '@/components/layout/ScenarioShell';
import { useWorkspace } from '@/components/providers/SessionProviderWrapper';

const SETTINGS_NAV = [
  { id: 'user-profile', label: 'User Profile', group: 'YOU', icon: User },
  { id: 'user-content-safety', label: 'Content Safety', group: 'YOU', icon: ShieldCheck },
  { id: 'user-file-naming', label: 'File Naming', group: 'YOU', icon: ScrollText },
  { id: 'organization-general', label: 'General', group: 'ORGANIZATION', icon: Building2 },
  { id: 'organization-members', label: 'Members & Roles', group: 'ORGANIZATION', icon: Users },
  { id: 'organization-projects', label: 'Projects', group: 'ORGANIZATION', icon: FolderKanban },
  { id: 'organization-analytics', label: 'Analytics', group: 'ORGANIZATION', icon: CreditCard },
  { id: 'organization-models', label: 'Models Policy', group: 'ORGANIZATION', icon: ShieldCheck },
  { id: 'organization-ip-detection', label: 'IP Detection', group: 'ORGANIZATION', icon: ShieldCheck },
  { id: 'organization-watermark', label: 'Watermark', group: 'ORGANIZATION', icon: ShieldCheck },
  { id: 'organization-external-keys', label: 'External Keys (BYOK)', group: 'ORGANIZATION', icon: KeyRound },
  { id: 'organization-agent', label: 'AI Agent & Memory', group: 'ORGANIZATION', icon: ScrollText },
  { id: 'organization-compute-planner', label: 'Compute Planner', group: 'ORGANIZATION', icon: CreditCard },
  { id: 'organization-plans', label: 'Plans & Billing', group: 'ORGANIZATION', icon: CreditCard },
  { id: 'project-visibility', label: 'Project Visibility', group: 'PROJECT', icon: Users },
  { id: 'project-guardrails', label: 'Quality Gate Guardrails', group: 'PROJECT', icon: ShieldCheck },
  { id: 'api-keys', label: 'REST API Keys & MCP', group: 'DEVELOPER', icon: KeyRound },
  { id: 'webhooks', label: 'Webhooks & HMAC', group: 'DEVELOPER', icon: Webhook },
  { id: 'invitations', label: 'Invite Codes (RBAC)', group: 'SECURITY & AUDIT', icon: TicketCheck },
  { id: 'audit-logs', label: 'Activity Trail & Audit', group: 'SECURITY & AUDIT', icon: ScrollText },
];

type InvitationRecord = {
  id: string;
  code: string;
  invitedEmail: string | null;
  assignedRole: string;
  status: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  notes: string | null;
  createdAt: string;
};

type AuditRecord = {
  id: string;
  eventType: string;
  action: string;
  actorEmail: string | null;
  targetType: string | null;
  targetId: string | null;
  metadataJson: string;
  createdAt: string;
};

export default function SettingsSectionPage() {
  const params = useParams();
  const section = String(params?.section || 'user-profile');
  const { user, activeTeam, activeProject, projects, refreshWorkspace } = useWorkspace();

  // User profile state
  const [displayName, setDisplayName] = useState('');
  const [locale, setLocale] = useState('en');
  const [profileSaved, setProfileSaved] = useState(false);

  // Org state
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<
    Array<{ id: string; role: string; user: { id: string; name: string; email: string; role: string } }>
  >([]);

  // Project creation & guardrails state
  const [newProjectName, setNewProjectName] = useState('');
  const [guardrailsEnabled, setGuardrailsEnabled] = useState(false);
  const [bannedTerms, setBannedTerms] = useState('');
  const [brandHexPalette, setBrandHexPalette] = useState('#0099ff,#0b0b0c');

  // API keys state
  const [apiKeys, setApiKeys] = useState<
    Array<{ id: string; name: string; keyPrefix: string; scopes: string; status: string; createdAt: string }>
  >([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [mintedSecretKey, setMintedSecretKey] = useState<string | null>(null);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<
    Array<{ id: string; url: string; events: string; secretHash: string; lastTestStatus: number | null }>
  >([]);
  const [webhookUrl, setWebhookUrl] = useState('');

  // Invitations state
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'viewer' | 'admin'>('member');
  const [inviteTtlHours, setInviteTtlHours] = useState(168);
  const [inviteNotes, setInviteNotes] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);

  // Enterprise & Personal Settings states (Screenshots 59–72)
  const [autoEnableModels, setAutoEnableModels] = useState(true);
  const [displayDisabledModels, setDisplayDisabledModels] = useState(false);
  const [ipEnforcement, setIpEnforcement] = useState<'disabled' | 'fail-open' | 'fail-closed'>('disabled');
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState('SCENARIO STUDIO INTERNAL');
  const [watermarkPlacement, setWatermarkPlacement] = useState('bottom-left');
  const [byokProvider, setByokProvider] = useState<'OpenAI' | 'Anthropic' | 'Google Vertex AI'>('OpenAI');
  const [agentOrgInstructions, setAgentOrgInstructions] = useState(
    'Look: clean 2D hand-painted. Stills: GPT Image 2. In-image text: Ideogram V4. Video: Seedance 2.0. 3D: Rodin Gen-2.5.'
  );
  const [projectVisibility, setProjectVisibility] = useState<'collaborative' | 'solo'>('collaborative');
  const [hiddenNsfwCategories, setHiddenNsfwCategories] = useState<string[]>(['Explicit Imagery']);
  const [singleDownloadTemplate, setSingleDownloadTemplate] = useState('<description>-<id>');
  const [bulkDownloadTemplate, setBulkDownloadTemplate] = useState('<description>-<id>-<num>');
  const [plannerCounts, setPlannerCounts] = useState<Record<string, number>>({
    'Generate Image': 200,
    'Generate 3D': 25,
    'Generate Video': 15,
    'Generate Audio': 40,
    Upscale: 80,
    Training: 2,
    Pixelization: 30,
    Vectorization: 30,
    'Edit with prompts': 50,
    Skybox: 15,
  });

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || '');
      setLocale(user.locale || 'en');
    }
    if (activeTeam) {
      setTeamName(activeTeam.name || '');
    }
  }, [user, activeTeam]);

  useEffect(() => {
    if (section === 'organization-members' || section === 'organization-general') {
      fetch('/api/v1/teams')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const current = d?.teams?.[0];
          if (current?.members) setMembers(current.members);
        })
        .catch(() => {});
    }
    if (section === 'project-guardrails' || section === 'organization-projects') {
      fetch('/api/v1/projects')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const p = d?.projects?.find((pr: { id: string }) => pr.id === activeProject?.id) || d?.projects?.[0];
          if (p) {
            setGuardrailsEnabled(Boolean(p.guardrailsEnabled));
            setBannedTerms(p.bannedTerms || '');
            setBrandHexPalette(p.brandHexPalette || '#0099ff,#0b0b0c');
          }
        })
        .catch(() => {});
    }
    if (section === 'api-keys' || section === 'organization-api-keys') {
      loadApiKeys();
    }
    if (section === 'webhooks' || section === 'organization-webhooks' || section === 'project-webhooks') {
      loadWebhooks();
    }
    if (section === 'invitations') {
      loadInvitations();
    }
    if (section === 'audit-logs' || section === 'organization-activity-trail') {
      loadAuditLogs();
    }
  }, [section, activeProject?.id]);

  async function loadApiKeys() {
    const res = await fetch('/api/v1/api-keys');
    if (res.ok) {
      const data = await res.json();
      setApiKeys(data.apiKeys || []);
    }
  }

  async function loadWebhooks() {
    const res = await fetch('/api/v1/webhooks');
    if (res.ok) {
      const data = await res.json();
      setWebhooks(data.webhooks || []);
    }
  }

  async function loadInvitations() {
    const res = await fetch('/api/v1/invitations');
    if (res.ok) {
      const data = await res.json();
      setInvitations(data.invitations || []);
    }
  }

  async function loadAuditLogs() {
    const res = await fetch('/api/v1/audit-logs?limit=100');
    if (res.ok) {
      const data = await res.json();
      setAuditLogs(data.auditLogs || []);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaved(false);
    const res = await fetch('/api/v1/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: displayName, locale }),
    });
    if (res.ok) {
      setProfileSaved(true);
      await refreshWorkspace();
    }
  }

  async function handleSaveTeam(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/v1/teams', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: activeTeam?.id, name: teamName }),
    });
    await refreshWorkspace();
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    await fetch('/api/v1/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName.trim() }),
    });
    setNewProjectName('');
    await refreshWorkspace();
  }

  async function handleSaveGuardrails(e: React.FormEvent) {
    e.preventDefault();
    if (!activeProject) return;
    await fetch('/api/v1/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: activeProject.id,
        guardrailsEnabled,
        bannedTerms,
        brandHexPalette,
      }),
    });
    await refreshWorkspace();
  }

  async function handleCreateApiKey(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/v1/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName.trim() || 'Unity Engine Production Token' }),
    });
    if (res.ok) {
      const data = await res.json();
      setMintedSecretKey(data.secretKey);
      setNewKeyName('');
      await loadApiKeys();
    }
  }

  async function handleRevokeApiKey(id: string) {
    await fetch(`/api/v1/api-keys?id=${id}`, { method: 'DELETE' });
    await loadApiKeys();
  }

  async function handleCreateWebhook(e: React.FormEvent) {
    e.preventDefault();
    if (!webhookUrl.trim()) return;
    await fetch('/api/v1/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl.trim() }),
    });
    setWebhookUrl('');
    await loadWebhooks();
  }

  async function handleTestWebhook(id: string) {
    await fetch('/api/v1/webhooks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'test' }),
    });
    await loadWebhooks();
  }

  async function handleMintInvitation(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/v1/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitedEmail: inviteEmail.trim() || null,
        assignedRole: inviteRole,
        expiresInHours: inviteTtlHours,
        notes: inviteNotes.trim() || null,
      }),
    });
    if (res.ok) {
      setInviteEmail('');
      setInviteNotes('');
      await loadInvitations();
    }
  }

  async function handleInvitationAction(id: string, action: 'revoke' | 'rotate') {
    await fetch(`/api/v1/invitations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    await loadInvitations();
  }

  return (
    <ScenarioShell>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 p-6 md:flex-row">
        {/* Left Settings Sidebar (Replicating Screenshots 31–33) */}
        <aside className="w-full shrink-0 space-y-1 rounded-2xl border border-[#25252e] bg-[#141418] p-3 md:w-64">
          {SETTINGS_NAV.map((item) => (
            <Link
              key={item.id}
              href={`/settings/${item.id}`}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                section === item.id
                  ? 'bg-[#0099ff] text-white'
                  : 'text-zinc-400 hover:bg-[#1c1c24] hover:text-white'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </aside>

        {/* Right Settings Content Pane */}
        <section className="flex-1 rounded-2xl border border-[#25252e] bg-[#141418] p-6">
          {section === 'user-profile' && (
            <form onSubmit={handleSaveProfile} className="max-w-lg space-y-5">
              <div>
                <h1 className="text-lg font-bold text-white">User Profile</h1>
                <p className="text-xs text-zinc-400">
                  Manage your Scenario account identity, language, and RBAC status.
                </p>
              </div>

              {profileSaved && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  Profile settings saved.
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3.5 py-2 text-xs text-white outline-none focus:border-[#0099ff]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full rounded-xl border border-[#24242c] bg-[#101014] px-3.5 py-2 text-xs text-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">
                    Global Role
                  </label>
                  <div className="rounded-xl border border-[#24242c] bg-[#101014] px-3.5 py-2 text-xs font-bold uppercase text-[#0099ff]">
                    {user?.role || 'member'}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">
                    Interface Language
                  </label>
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                    className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3 py-2 text-xs text-white"
                  >
                    <option value="en">English (en)</option>
                    <option value="fr">Français (fr)</option>
                    <option value="ja">日本語 (ja)</option>
                    <option value="ko">한국어 (ko)</option>
                    <option value="zh">中文 (zh)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="rounded-xl bg-[#0099ff] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0080db]"
              >
                Save Changes
              </button>
            </form>
          )}

          {section === 'organization-general' && (
            <form onSubmit={handleSaveTeam} className="max-w-lg space-y-5">
              <div>
                <h1 className="text-lg font-bold text-white">Organization General Settings</h1>
                <p className="text-xs text-zinc-400">
                  Configure your studio organization name, slug, and default workspace parameters.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3.5 py-2 text-xs text-white outline-none focus:border-[#0099ff]"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-[#0099ff] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0080db]"
              >
                Update Organization
              </button>
            </form>
          )}

          {section === 'organization-members' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold text-white">Organization Members &amp; Seats</h1>
                  <p className="text-xs text-zinc-400">
                    Active seats admitted via single-use invitation codes.
                  </p>
                </div>
                <Link
                  href="/settings/invitations"
                  className="rounded-xl bg-[#0099ff] px-4 py-2 text-xs font-bold text-white hover:bg-[#0080db]"
                >
                  Generate Invite Code
                </Link>
              </div>

              <div className="space-y-2.5">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-[#25252e] bg-[#191920] px-4 py-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{m.user.name}</p>
                      <p className="text-zinc-400">{m.user.email}</p>
                    </div>
                    <span className="rounded-md bg-[#0099ff]/15 px-2.5 py-1 text-[10px] font-bold uppercase text-[#0099ff]">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'organization-projects' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-lg font-bold text-white">Workspace Projects</h1>
                <p className="text-xs text-zinc-400">
                  Isolate assets, custom LoRAs, workflows, and brand guardrails per game project.
                </p>
              </div>

              <form onSubmit={handleCreateProject} className="flex max-w-md gap-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="New Game Project Name..."
                  className="flex-1 rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3.5 py-2 text-xs text-white outline-none focus:border-[#0099ff]"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#0099ff] px-4 py-2 text-xs font-bold text-white hover:bg-[#0080db]"
                >
                  Create Project
                </button>
              </form>

              <div className="grid gap-3 sm:grid-cols-2">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-[#25252e] bg-[#191920] p-4 text-xs"
                  >
                    <p className="font-bold text-white">{p.name}</p>
                    <p className="mt-1 text-zinc-400">
                      Guardrails: {p.guardrailsEnabled ? 'Enforced' : 'Standard'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'organization-plans' && (
            <div className="space-y-4">
              <h1 className="text-lg font-bold text-white">Plans &amp; OSCU Credit Ledger</h1>
              <p className="text-xs text-zinc-400">
                Active Plan: <strong className="text-white">{activeTeam?.planTier}</strong> ·
                Used: <strong className="text-[#0099ff]">{activeTeam?.oscuUsed}</strong> /{' '}
                {activeTeam?.oscuTotal} CU
              </p>
              <Link
                href="/pricing"
                className="inline-block rounded-xl bg-[#0099ff] px-4 py-2 text-xs font-bold text-white"
              >
                Manage Plans &amp; Top-Up Packs →
              </Link>
            </div>
          )}

          {(section === 'project-guardrails' || section === 'organization-quality-gate') && (
            <form onSubmit={handleSaveGuardrails} className="max-w-lg space-y-5">
              <div>
                <h1 className="text-lg font-bold text-white">
                  Project Quality Gate &amp; Brand Guardrails
                </h1>
                <p className="text-xs text-zinc-400">
                  Enforce studio-wide negative prompt terms, banned tokens, and deterministic HEX color palettes across all project inferences.
                </p>
              </div>

              <label className="flex items-center justify-between rounded-xl border border-[#25252e] bg-[#191920] p-3.5 text-xs font-semibold text-white">
                <span>Enable Project Quality Gate Enforcement</span>
                <input
                  type="checkbox"
                  checked={guardrailsEnabled}
                  onChange={(e) => setGuardrailsEnabled(e.target.checked)}
                  className="h-4 w-4 accent-[#0099ff]"
                />
              </label>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Banned Prompt Terms (Comma-separated)
                </label>
                <input
                  type="text"
                  value={bannedTerms}
                  onChange={(e) => setBannedTerms(e.target.value)}
                  placeholder="watermark, competitor_ip, nsfw, gore"
                  className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3.5 py-2 text-xs text-white outline-none focus:border-[#0099ff]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Studio Brand HEX Palette
                </label>
                <input
                  type="text"
                  value={brandHexPalette}
                  onChange={(e) => setBrandHexPalette(e.target.value)}
                  className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3.5 py-2 font-mono text-xs text-sky-400 outline-none focus:border-[#0099ff]"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-[#0099ff] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0080db]"
              >
                Save Guardrails Policy
              </button>
            </form>
          )}

          {(section === 'api-keys' || section === 'organization-api-keys') && (
            <div className="space-y-6">
              <div>
                <h1 className="text-lg font-bold text-white">
                  Engine &amp; Pipeline REST API Keys
                </h1>
                <p className="text-xs text-zinc-400">
                  Generate Bearer tokens (`scen_live_...`) for Unity, Unreal Engine 5, Godot, and Blender pipelines targeting `/api/v1/inferences` and `/api/v1/assets`.
                </p>
              </div>

              <form onSubmit={handleCreateApiKey} className="flex max-w-md gap-2">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key label (e.g., Unreal Engine 5 Plugin)..."
                  className="flex-1 rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3.5 py-2 text-xs text-white outline-none focus:border-[#0099ff]"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-[#0099ff] px-4 py-2 text-xs font-bold text-white hover:bg-[#0080db]"
                >
                  <Plus className="h-4 w-4" /> Mint API Key
                </button>
              </form>

              {mintedSecretKey && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs">
                  <p className="font-bold text-amber-300">
                    Copy Your Secret API Key Now (Displayed Once Only):
                  </p>
                  <code className="mt-1.5 block rounded bg-black/60 p-2 font-mono text-emerald-300">
                    {mintedSecretKey}
                  </code>
                </div>
              )}

              <div className="space-y-2.5">
                {apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center justify-between rounded-xl border border-[#25252e] bg-[#191920] px-4 py-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{k.name}</p>
                      <p className="font-mono text-[11px] text-zinc-400">
                        {k.keyPrefix}•••••••• · Scopes: {k.scopes}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          k.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {k.status}
                      </span>
                      {k.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleRevokeApiKey(k.id)}
                          className="text-zinc-500 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(section === 'webhooks' || section === 'organization-webhooks' || section === 'project-webhooks') && (
            <div className="space-y-6">
              <div>
                <h1 className="text-lg font-bold text-white">HMAC-SHA256 Event Webhooks</h1>
                <p className="text-xs text-zinc-400">
                  Receive signed notifications for `inference.completed`, `training.completed`, and `workflow.completed`.
                </p>
              </div>

              <form onSubmit={handleCreateWebhook} className="flex max-w-lg gap-2">
                <input
                  type="url"
                  required
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://pipeline.yourstudio.com/webhooks/scenario"
                  className="flex-1 rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3.5 py-2 text-xs text-white outline-none focus:border-[#0099ff]"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#0099ff] px-4 py-2 text-xs font-bold text-white hover:bg-[#0080db]"
                >
                  Register Webhook
                </button>
              </form>

              <div className="space-y-2.5">
                {webhooks.map((wh) => (
                  <div
                    key={wh.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#25252e] bg-[#191920] px-4 py-3 text-xs"
                  >
                    <div>
                      <p className="font-mono font-bold text-white">{wh.url}</p>
                      <p className="text-[11px] text-zinc-400">
                        Events: {wh.events} · Secret: {wh.secretHash}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {wh.lastTestStatus && (
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                          HTTP {wh.lastTestStatus}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleTestWebhook(wh.id)}
                        className="rounded-lg border border-[#2c2c35] bg-[#141418] px-3 py-1 font-semibold text-[#0099ff]"
                      >
                        Ping Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'invitations' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-lg font-bold text-white">
                  Invite-Only Account Admission &amp; RBAC Codes
                </h1>
                <p className="text-xs text-zinc-400">
                  Mint single-use, expiring `SCEN-XXXX-XXXX-XXXX` invitation codes with role bindings, instant revocation, and rotation.
                </p>
              </div>

              <form
                onSubmit={handleMintInvitation}
                className="grid gap-3 rounded-2xl border border-[#262630] bg-[#18181f] p-4 sm:grid-cols-4"
              >
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Optional email lock..."
                  className="rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3 py-2 text-xs text-white outline-none focus:border-[#0099ff]"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                  className="rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3 py-2 text-xs text-white"
                >
                  <option value="member">Role: Member</option>
                  <option value="viewer">Role: Viewer</option>
                  <option value="admin">Role: Admin</option>
                </select>
                <input
                  type="text"
                  value={inviteNotes}
                  onChange={(e) => setInviteNotes(e.target.value)}
                  placeholder="Audit note / seat label..."
                  className="rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3 py-2 text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[#0099ff] px-4 py-2 text-xs font-bold text-white hover:bg-[#0080db]"
                >
                  <Plus className="h-4 w-4" /> Generate Invite Code
                </button>
              </form>

              <div className="space-y-2.5">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#25252e] bg-[#191920] px-4 py-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm font-bold text-[#0099ff]">
                          {inv.code}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(inv.code);
                            setCopiedCode(inv.code);
                          }}
                          className="text-zinc-400 hover:text-white"
                          title="Copy Invitation Code"
                        >
                          {copiedCode === inv.code ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            inv.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : inv.status === 'consumed'
                                ? 'bg-sky-500/20 text-sky-300'
                                : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {inv.status}
                        </span>
                        <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase text-zinc-300">
                          Role: {inv.assignedRole}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {inv.invitedEmail ? `Locked to ${inv.invitedEmail}` : 'Any email'} ·
                        Uses: {inv.usedCount}/{inv.maxUses} · Expires:{' '}
                        {new Date(inv.expiresAt).toLocaleDateString()}
                        {inv.notes ? ` · Note: ${inv.notes}` : ''}
                      </p>
                    </div>

                    {inv.status === 'active' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleInvitationAction(inv.id, 'rotate')}
                          className="flex items-center gap-1 rounded-lg border border-[#2c2c35] bg-[#141418] px-2.5 py-1.5 text-[11px] font-semibold text-zinc-200 hover:border-[#0099ff]"
                        >
                          <RotateCw className="h-3 w-3" /> Rotate
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInvitationAction(inv.id, 'revoke')}
                          className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20"
                        >
                          <Ban className="h-3 w-3" /> Revoke
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(section === 'audit-logs' || section === 'organization-activity-trail') && (
            <div className="space-y-5">
              <div>
                <h1 className="text-lg font-bold text-white">
                  Immutable Security &amp; Admission Audit Log
                </h1>
                <p className="text-xs text-zinc-400">
                  Tamper-evident ledger of every invitation lifecycle event, registration attempt, login, and administrative action.
                </p>
              </div>

              <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-[#25252e] bg-[#191920] p-3 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#0099ff]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#0099ff]">
                          {log.eventType}
                        </span>
                        <span className="font-semibold text-white">
                          Actor: {log.actorEmail || 'system/anonymous'}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-zinc-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1.5 font-mono text-[11px] text-zinc-400">
                      Target: {log.targetType || 'n/a'} ({log.targetId || 'n/a'}) · Metadata:{' '}
                      {log.metadataJson}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'organization-analytics' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-lg font-bold text-white">Organization · Analytics</h1>
                <p className="text-xs text-zinc-400">
                  Compute usage and spending across every project and member in the organization.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[#25252e] bg-[#191920] p-4 text-xs">
                <div>
                  <p className="font-bold text-white">Analytics API key</p>
                  <p className="mt-0.5 text-zinc-400">
                    Query organization-wide compute consumption and job metrics programmatically.
                  </p>
                </div>
                <Link
                  href="/settings/api-keys"
                  className="rounded-lg border border-[#2c2c35] bg-[#141418] px-3 py-1.5 font-semibold text-white hover:border-[#0099ff]"
                >
                  Create key
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-[#25252e] bg-[#191920] p-4">
                  <p className="text-[11px] text-zinc-400">Total Used This Period</p>
                  <p className="mt-1 text-xl font-bold text-white">{activeTeam?.oscuUsed ?? 0} CU</p>
                </div>
                <div className="rounded-xl border border-[#25252e] bg-[#191920] p-4">
                  <p className="text-[11px] text-zinc-400">Available Allocation</p>
                  <p className="mt-1 text-xl font-bold text-[#0099ff]">{activeTeam?.oscuTotal ?? 15000} CU</p>
                </div>
                <div className="rounded-xl border border-[#25252e] bg-[#191920] p-4">
                  <p className="text-[11px] text-zinc-400">Active Projects</p>
                  <p className="mt-1 text-xl font-bold text-emerald-400">{projects.length}</p>
                </div>
              </div>
            </div>
          )}

          {section === 'organization-models' && (
            <div className="space-y-5">
              <div>
                <h1 className="text-lg font-bold text-white">Organization · Models</h1>
                <p className="text-xs text-zinc-400">
                  Control which public and third-party models are available across the organization.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center justify-between rounded-xl border border-[#25252e] bg-[#191920] p-4 text-xs">
                  <div>
                    <p className="font-bold text-white">Automatically enable new models</p>
                    <p className="mt-0.5 text-zinc-400">When off, new models start disabled.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoEnableModels}
                    onChange={(e) => setAutoEnableModels(e.target.checked)}
                    className="h-4 w-4 accent-[#0099ff]"
                  />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-[#25252e] bg-[#191920] p-4 text-xs">
                  <div>
                    <p className="font-bold text-white">Display disabled models (admins only)</p>
                    <p className="mt-0.5 text-zinc-400">Show disabled models in pickers for admins.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={displayDisabledModels}
                    onChange={(e) => setDisplayDisabledModels(e.target.checked)}
                    className="h-4 w-4 accent-[#0099ff]"
                  />
                </label>
              </div>
            </div>
          )}

          {section === 'organization-ip-detection' && (
            <div className="max-w-xl space-y-5">
              <div>
                <h1 className="text-lg font-bold text-white">Organization · IP Detection</h1>
                <p className="text-xs text-zinc-400">
                  Checks every job for IP patterns or filters before it runs. Choose what happens when a match is found.
                </p>
              </div>
              <div className="space-y-2">
                {[
                  { id: 'disabled', label: 'Disabled', desc: 'Do not screen prompts or images for IP patterns.' },
                  { id: 'fail-open', label: 'Warn / Flag (Fail Open)', desc: 'Log IP matches to Activity Trail while allowing generation.' },
                  { id: 'fail-closed', label: 'Block Generation (Fail Closed)', desc: 'Strictly reject jobs that match protected IP filters.' },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 text-xs ${
                      ipEnforcement === opt.id
                        ? 'border-[#0099ff] bg-[#0099ff]/10 text-white'
                        : 'border-[#25252e] bg-[#191920] text-zinc-300'
                    }`}
                  >
                    <div>
                      <p className="font-bold">{opt.label}</p>
                      <p className="mt-0.5 text-zinc-400">{opt.desc}</p>
                    </div>
                    <input
                      type="radio"
                      name="ip-enforcement"
                      checked={ipEnforcement === opt.id}
                      onChange={() => setIpEnforcement(opt.id as typeof ipEnforcement)}
                      className="accent-[#0099ff]"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {section === 'organization-watermark' && (
            <div className="max-w-xl space-y-5">
              <div>
                <h1 className="text-lg font-bold text-white">Organization · Watermark</h1>
                <p className="text-xs text-zinc-400">
                  When the watermark is on, every image and video generated in your organization is viewed and downloaded with it.
                </p>
              </div>
              <label className="flex items-center justify-between rounded-xl border border-[#25252e] bg-[#191920] p-4 text-xs font-bold text-white">
                <span>Enable Organization Watermark</span>
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  className="h-4 w-4 accent-[#0099ff]"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-zinc-300">
                  Watermark Text
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3 py-2 text-xs text-white"
                  />
                </label>
                <label className="text-xs text-zinc-300">
                  Placement
                  <select
                    value={watermarkPlacement}
                    onChange={(e) => setWatermarkPlacement(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3 py-2 text-xs text-white"
                  >
                    <option value="tiled">Tiled</option>
                    <option value="center">Center</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {section === 'organization-external-keys' && (
            <div className="space-y-5">
              <div>
                <h1 className="text-lg font-bold text-white">Organization · External Keys (BYOK)</h1>
                <p className="text-xs text-zinc-400">
                  Bring your own API keys for supported providers (OpenAI, Anthropic, Google Vertex AI). Pricing: External Cost + 50% markup.
                </p>
              </div>
              <div className="flex gap-2">
                {(['OpenAI', 'Anthropic', 'Google Vertex AI'] as const).map((prov) => (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => setByokProvider(prov)}
                    className={`rounded-xl border px-4 py-2 text-xs font-bold ${
                      byokProvider === prov
                        ? 'border-[#0099ff] bg-[#0099ff]/15 text-white'
                        : 'border-[#25252e] bg-[#191920] text-zinc-400'
                    }`}
                  >
                    {prov}
                  </button>
                ))}
              </div>
              <div className="rounded-xl border border-[#25252e] bg-[#191920] p-4 text-xs">
                <p className="font-bold text-white">{byokProvider} Credentials</p>
                <p className="mt-1 text-zinc-400">
                  Minimum Post-Processing Fees: Image 1 CU · Video 5 CU · Audio 2 CU · 3D 3 CU · Text 0.5 CU
                </p>
              </div>
            </div>
          )}

          {section === 'organization-agent' && (
            <div className="max-w-xl space-y-5">
              <div>
                <h1 className="text-lg font-bold text-white">Organization · Agent</h1>
                <p className="text-xs text-zinc-400">
                  Rules the Scenario AI Agent always follows across every project. Standing context the Agent brings to every chat.
                </p>
              </div>
              <textarea
                rows={5}
                value={agentOrgInstructions}
                onChange={(e) => setAgentOrgInstructions(e.target.value)}
                className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] p-3 text-xs leading-relaxed text-white outline-none focus:border-[#0099ff]"
              />
            </div>
          )}

          {section === 'organization-compute-planner' && (
            <div className="space-y-5">
              <div>
                <h1 className="text-lg font-bold text-white">Organization · Compute Planner</h1>
                <p className="text-xs text-zinc-400">
                  Estimate Creative Units (CU) needed for your studio&apos;s monthly generation and training volume.
                </p>
              </div>
              <div className="space-y-2.5">
                {Object.entries(plannerCounts).map(([feat, count]) => (
                  <div
                    key={feat}
                    className="flex items-center justify-between gap-4 rounded-xl border border-[#25252e] bg-[#191920] px-4 py-2.5 text-xs"
                  >
                    <span className="w-40 font-semibold text-white">{feat}</span>
                    <input
                      type="range"
                      min={0}
                      max={1000}
                      value={count}
                      onChange={(e) =>
                        setPlannerCounts((prev) => ({ ...prev, [feat]: Number(e.target.value) }))
                      }
                      className="flex-1 accent-[#0099ff]"
                    />
                    <span className="w-24 text-right font-mono text-[#0099ff]">
                      {count * (feat === 'Training' ? 120 : 10)} CU
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'project-visibility' && (
            <div className="max-w-xl space-y-5">
              <div>
                <h1 className="text-lg font-bold text-white">
                  Project · Visibility · {activeProject?.name || 'Main Game Production'}
                </h1>
                <p className="text-xs text-zinc-400">
                  Choose how team members can access and view assets in this project.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    id: 'collaborative',
                    title: 'Collaborative',
                    desc: 'Everyone can view and reuse all project assets — perfect for open collaboration and shared creativity.',
                  },
                  {
                    id: 'solo',
                    title: 'Solo',
                    desc: 'Creators can access only their own assets; admins see all. Ideal for private or sensitive work.',
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setProjectVisibility(mode.id as 'collaborative' | 'solo')}
                    className={`rounded-2xl border p-4 text-left text-xs transition ${
                      projectVisibility === mode.id
                        ? 'border-[#0099ff] bg-[#0099ff]/10 text-white'
                        : 'border-[#25252e] bg-[#191920] text-zinc-300'
                    }`}
                  >
                    <p className="text-sm font-bold">{mode.title}</p>
                    <p className="mt-1.5 leading-relaxed text-zinc-400">{mode.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {section === 'user-content-safety' && (
            <div className="max-w-2xl space-y-5">
              <div>
                <h1 className="text-lg font-bold text-white">You · Content Safety</h1>
                <p className="text-xs text-zinc-400">
                  All content uploaded to or generated with Scenario is automatically processed for sensitive (NSFW) content. Select categories to hide in your account:
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Alcohol',
                  'Drugs',
                  'Explicit Imagery',
                  'Gambling',
                  'Hate Symbols',
                  'Offensive Content',
                  'Non-Explicit Imagery',
                  'Swimwear/Underwear',
                  'Tobacco',
                  'Violence',
                  'Disturbing Imagery',
                ].map((cat) => {
                  const active = hiddenNsfwCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setHiddenNsfwCategories((prev) =>
                          prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                        )
                      }
                      className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                        active
                          ? 'border-[#0099ff] bg-[#0099ff] text-white'
                          : 'border-[#25252e] bg-[#191920] text-zinc-300 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {section === 'user-file-naming' && (
            <div className="max-w-xl space-y-5">
              <div>
                <h1 className="text-lg font-bold text-white">You · File Naming</h1>
                <p className="text-xs text-zinc-400">
                  Customize filename templates for Single Download and Bulk Download exports.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Single Download Template (.png)
                </label>
                <input
                  type="text"
                  value={singleDownloadTemplate}
                  onChange={(e) => setSingleDownloadTemplate(e.target.value)}
                  className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3.5 py-2 font-mono text-xs text-white"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['description', 'id', 'seed', 'prompt', 'model'].map((tok) => (
                    <button
                      key={tok}
                      type="button"
                      onClick={() => setSingleDownloadTemplate((p) => `${p}-<${tok}>`)}
                      className="rounded-md bg-[#22222c] px-2 py-1 font-mono text-[11px] text-zinc-300 hover:text-white"
                    >
                      +{tok}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Bulk Download Template (.png)
                </label>
                <input
                  type="text"
                  value={bulkDownloadTemplate}
                  onChange={(e) => setBulkDownloadTemplate(e.target.value)}
                  className="w-full rounded-xl border border-[#2c2c35] bg-[#0e0e12] px-3.5 py-2 font-mono text-xs text-white"
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </ScenarioShell>
  );
}
