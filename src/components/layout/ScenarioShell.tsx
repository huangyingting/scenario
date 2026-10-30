'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  ChevronDown,
  Search,
  Bell,
  FolderOpen,
  Sparkles,
  Info,
  Image as ImageIcon,
  Video,
  Box,
  Volume2,
  FileText,
  Globe,
  Layers,
  Wand2,
  Scissors,
  PenTool,
  Grid,
  GitBranch,
  Cpu,
  Sliders,
  Plus,
  X,
  Settings,
  ShieldCheck,
  CreditCard,
  Key,
  LogOut,
  Menu,
  Check,
  Send,
} from 'lucide-react';
import { useWorkspace } from '@/components/providers/SessionProviderWrapper';

export function ScenarioShell({
  children,
  fullHeight = false,
}: {
  children: React.ReactNode;
  fullHeight?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const { workspace, switchProject } = useWorkspace();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const [openDropdown, setOpenDropdown] = useState<
    null | 'org' | 'create' | 'assets' | 'models' | 'workflows' | 'more' | 'profile'
  >(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const teamName = workspace?.team?.name || 'Scenario Studio';
  const projectName = workspace?.project?.name || 'Main Game Production';
  const oscuBalance = workspace?.team?.oscuBalance ?? 15000;
  const initials = (workspace?.user?.name || 'Scenario Studio')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handleAskAssistant(e: React.FormEvent) {
    e.preventDefault();
    if (!assistantPrompt.trim()) return;
    setAssistantBusy(true);
    try {
      const res = await fetch('/api/v1/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', prompt: assistantPrompt }),
      });
      const data = await res.json();
      setAssistantReply(data.reply || 'Ready to assist with your asset pipeline.');
    } finally {
      setAssistantBusy(false);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const res = await fetch('/api/v1/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName.trim(), switchActive: true }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewProjectName('');
      setNewProjectModal(false);
      if (workspace?.team?.id && data.project?.id) {
        await switchProject(workspace.team.id, data.project.id);
      }
    }
  }

  return (
    <div
      className={`flex flex-col bg-[#0b0b0c] text-[#f4f4f5] ${
        fullHeight ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Top 56px Scenario Navigation Bar */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-[#222228] bg-[#0b0b0c]/95 px-3 backdrop-blur-md md:px-4">
        {/* Left: Scenario Monogram + Org > Project Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#26262d] bg-[#141418] text-zinc-300 md:hidden"
            aria-label="Toggle Menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="relative">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#26262d] bg-[#141418] p-1 pr-2.5 text-xs font-medium text-zinc-200 hover:border-zinc-700">
              <Link
                href="/dashboard"
                className="flex h-6 w-6 items-center justify-center rounded bg-white font-bold text-[#0b0b0c]"
              >
                S
              </Link>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'org' ? null : 'org')}
                className="flex items-center gap-1.5 text-left"
              >
                <span className="max-w-[110px] truncate text-zinc-300 sm:max-w-[140px]">
                  {teamName}
                </span>
                <span className="text-zinc-600">&gt;</span>
                <span className="max-w-[120px] truncate font-semibold text-white sm:max-w-[160px]">
                  {projectName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
              </button>
            </div>

            {openDropdown === 'org' && (
              <div className="absolute left-0 mt-2 w-80 rounded-xl border border-[#2a2a32] bg-[#141418] p-3 shadow-2xl">
                <div className="mb-2 flex items-center justify-between border-b border-[#24242b] pb-2">
                  <div>
                    <p className="text-xs font-semibold text-white">{teamName}</p>
                    <p className="text-[11px] text-zinc-400">
                      Plan: {workspace?.team?.plan?.toUpperCase() || 'PRO'} ·{' '}
                      {oscuBalance.toLocaleString()} CU available
                    </p>
                  </div>
                  <Link
                    href="/settings/organization-general"
                    onClick={() => setOpenDropdown(null)}
                    className="rounded-md border border-[#2c2c34] px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800"
                  >
                    Settings
                  </Link>
                </div>

                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Switch Project
                </p>
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {(workspace?.teams?.[0]?.projects || [{ id: workspace?.project?.id || 'default', name: projectName }]).map(
                    (proj) => {
                      const active = proj.id === workspace?.project?.id;
                      return (
                        <button
                          key={proj.id}
                          type="button"
                          onClick={async () => {
                            if (workspace?.team?.id) {
                              await switchProject(workspace.team.id, proj.id);
                            }
                            setOpenDropdown(null);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                            active
                              ? 'bg-[#0099ff]/15 text-[#0099ff] font-medium'
                              : 'text-zinc-300 hover:bg-zinc-800/70'
                          }`}
                        >
                          <span className="truncate">{proj.name}</span>
                          {active && <Check className="h-3.5 w-3.5" />}
                        </button>
                      );
                    }
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    setNewProjectModal(true);
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-700 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" /> New Project
                </button>
              </div>
            )}
          </div>

          <Link
            href="/settings/project-guardrails"
            title="Project Info & Quality Gate Guardrails"
            className="hidden h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white sm:flex"
          >
            <Info className="h-4 w-4" />
          </Link>
        </div>

        {/* Center: Primary Navigation Links & Mega-Menus */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/dashboard"
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              pathname === '/dashboard' || pathname === '/'
                ? 'bg-zinc-800/90 text-white'
                : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
            }`}
          >
            Home
          </Link>

          {/* Create 4-Column Mega-Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'create' ? null : 'create')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                pathname.startsWith('/create') || pathname.startsWith('/canvas')
                  ? 'bg-zinc-800/90 text-white'
                  : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
              }`}
            >
              Create <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>

            {openDropdown === 'create' && (
              <div
                onMouseLeave={() => setOpenDropdown(null)}
                className="absolute left-1/2 mt-2 w-[720px] -translate-x-1/2 rounded-2xl border border-[#2a2a33] bg-[#131317] p-5 shadow-2xl"
              >
                <div className="grid grid-cols-4 gap-5">
                  {/* Column 1: GENERATE */}
                  <div>
                    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Generate
                    </p>
                    <div className="space-y-1">
                      {[
                        { label: 'Images', href: '/create?mode=image', icon: ImageIcon },
                        { label: 'Videos', href: '/create?mode=video', icon: Video },
                        { label: '3D', href: '/create?mode=3d', icon: Box },
                        { label: 'World (Skyboxes & Splats)', href: '/create?mode=world', icon: Globe },
                        { label: 'Audio', href: '/create?mode=audio', icon: Volume2 },
                        { label: 'Text', href: '/create?mode=text', icon: FileText },
                        { label: 'Skyboxes', href: '/create?mode=skybox', icon: Globe },
                        { label: 'Textures', href: '/create?mode=texture', icon: Layers },
                      ].map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setOpenDropdown(null)}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800/80 hover:text-white"
                        >
                          <item.icon className="h-4 w-4 text-[#0099ff]" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: EDIT */}
                  <div>
                    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Edit
                    </p>
                    <div className="space-y-1">
                      {[
                        { label: 'Upscale & Enhance', href: '/create?mode=upscale', icon: Wand2 },
                        { label: 'Expand / Reframe', href: '/create?mode=reframe', icon: Grid },
                        { label: 'Remove Background', href: '/create?mode=remove-bg', icon: Scissors },
                        { label: 'Infinite Canvas', href: '/canvas/new', icon: PenTool },
                        { label: 'Pixelate', href: '/create?mode=pixelate', icon: Grid },
                        { label: 'Vectorize SVG', href: '/create?mode=vectorize', icon: Layers },
                      ].map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setOpenDropdown(null)}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800/80 hover:text-white"
                        >
                          <item.icon className="h-4 w-4 text-emerald-400" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: AUTOMATE */}
                  <div>
                    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Automate
                    </p>
                    <div className="space-y-1">
                      {[
                        { label: 'Workflows', href: '/workflows', icon: GitBranch },
                        { label: 'Workflow Apps', href: '/apps', icon: Sliders },
                        { label: 'New Node Graph', href: '/workflows/new', icon: Plus },
                      ].map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setOpenDropdown(null)}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800/80 hover:text-white"
                        >
                          <item.icon className="h-4 w-4 text-purple-400" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Column 4: TRAIN */}
                  <div>
                    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Train
                    </p>
                    <div className="space-y-1">
                      {[
                        { label: 'Model Training', href: '/models/trainings', icon: Cpu },
                        { label: 'Compose a Model', href: '/compose/new', icon: Layers },
                        { label: 'Models Library', href: '/models', icon: Box },
                      ].map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setOpenDropdown(null)}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800/80 hover:text-white"
                        >
                          <item.icon className="h-4 w-4 text-amber-400" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Assets Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'assets' ? null : 'assets')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                pathname.startsWith('/assets') || pathname.startsWith('/collections')
                  ? 'bg-zinc-800/90 text-white'
                  : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
              }`}
            >
              Assets <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
            {openDropdown === 'assets' && (
              <div className="absolute left-0 mt-2 w-48 rounded-xl border border-[#2a2a33] bg-[#131317] p-2 shadow-xl">
                <Link
                  href="/assets"
                  onClick={() => setOpenDropdown(null)}
                  className="block rounded-lg px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800"
                >
                  Asset Hub
                </Link>
                <Link
                  href="/collections"
                  onClick={() => setOpenDropdown(null)}
                  className="block rounded-lg px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800"
                >
                  Collections
                </Link>
              </div>
            )}
          </div>

          {/* Models Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'models' ? null : 'models')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                pathname.startsWith('/models') || pathname.startsWith('/compose')
                  ? 'bg-zinc-800/90 text-white'
                  : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
              }`}
            >
              Models <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
            {openDropdown === 'models' && (
              <div className="absolute left-0 mt-2 w-52 rounded-xl border border-[#2a2a33] bg-[#131317] p-2 shadow-xl">
                <Link
                  href="/models"
                  onClick={() => setOpenDropdown(null)}
                  className="block rounded-lg px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800"
                >
                  Models Library
                </Link>
                <Link
                  href="/models/trainings"
                  onClick={() => setOpenDropdown(null)}
                  className="block rounded-lg px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800"
                >
                  Train a Model (LoRA)
                </Link>
                <Link
                  href="/compose/new"
                  onClick={() => setOpenDropdown(null)}
                  className="block rounded-lg px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800"
                >
                  Compose a Model
                </Link>
              </div>
            )}
          </div>

          {/* Workflows Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'workflows' ? null : 'workflows')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                pathname.startsWith('/workflows') || pathname.startsWith('/apps')
                  ? 'bg-zinc-800/90 text-white'
                  : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
              }`}
            >
              Workflows <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
            {openDropdown === 'workflows' && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl border border-[#2a2a33] bg-[#131317] p-2 shadow-xl">
                <Link
                  href="/workflows"
                  onClick={() => setOpenDropdown(null)}
                  className="block rounded-lg px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800"
                >
                  Workflows Library
                </Link>
                <Link
                  href="/apps"
                  onClick={() => setOpenDropdown(null)}
                  className="block rounded-lg px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800"
                >
                  Workflow Apps Gallery
                </Link>
                <Link
                  href="/reviews"
                  onClick={() => setOpenDropdown(null)}
                  className="block rounded-lg px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800"
                >
                  Reviews (Human-in-the-Loop)
                </Link>
                <Link
                  href="/workflows/new"
                  onClick={() => setOpenDropdown(null)}
                  className="block rounded-lg px-3 py-2 text-xs text-[#0099ff] hover:bg-zinc-800"
                >
                  + New Node Workflow
                </Link>
              </div>
            )}
          </div>

          {/* More Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'more' ? null : 'more')}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800/50 hover:text-white"
            >
              More <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
            {openDropdown === 'more' && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl border border-[#2a2a33] bg-[#131317] p-2 shadow-xl">
                <Link
                  href="/explore"
                  onClick={() => setOpenDropdown(null)}
                  className="block rounded-lg px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800"
                >
                  Explore Community
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setOpenDropdown(null)}
                  className="block rounded-lg px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800"
                >
                  Plans & Compute Units
                </Link>
                <Link
                  href="/settings/invitations"
                  onClick={() => setOpenDropdown(null)}
                  className="block rounded-lg px-3 py-2 text-xs text-emerald-400 hover:bg-zinc-800"
                >
                  Invite-Only Governance
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right Action Icons: Search, Notifications, Active Jobs, AI Spark, Avatar */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-lg border border-[#26262d] bg-[#141418] px-2.5 py-1 text-[11px] font-medium text-zinc-300 lg:flex">
            <span className="h-2 w-2 rounded-full bg-[#0099ff]" />
            <span>{oscuBalance.toLocaleString()} CU</span>
          </div>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#26262d] bg-[#141418] text-zinc-300 hover:border-zinc-600 hover:text-white"
            title="Global Search"
          >
            <Search className="h-4 w-4" />
          </button>

          <Link
            href="/reviews"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#26262d] bg-[#141418] text-zinc-300 hover:border-zinc-600 hover:text-white"
            title="Pending Reviews & Notifications"
          >
            <Bell className="h-4 w-4" />
          </Link>

          <Link
            href="/recent-tasks"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#26262d] bg-[#141418] text-zinc-300 hover:border-zinc-600 hover:text-white"
            title="Recent Tasks & Background Jobs"
          >
            <FolderOpen className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#0099ff] ring-2 ring-[#0b0b0c]" />
          </Link>

          <button
            type="button"
            onClick={() => setAssistantOpen(!assistantOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0088ff] text-white shadow-sm hover:bg-[#0077e6]"
            title="Scenario AI Copilot & Prompt Spark"
          >
            <Sparkles className="h-4 w-4" />
          </button>

          {/* Profile Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'profile' ? null : 'profile')}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2d2d36] bg-[#1b1b22] text-xs font-bold text-white hover:border-zinc-500"
            >
              {initials}
            </button>

            {openDropdown === 'profile' && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#2a2a33] bg-[#141418] p-2 shadow-2xl">
                <div className="border-b border-[#24242c] px-3 py-2">
                  <p className="truncate text-xs font-semibold text-white">
                    {workspace?.user?.name || 'Scenario Creator'}
                  </p>
                  <p className="truncate text-[11px] text-zinc-400">
                    {workspace?.user?.email || ''}
                  </p>
                  <span className="mt-1 inline-block rounded bg-[#0099ff]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#0099ff]">
                    {workspace?.user?.role || 'USER'} · {workspace?.workspaceRole || 'admin'}
                  </span>
                </div>
                <div className="py-1">
                  <Link
                    href="/settings/user-profile"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                  >
                    <Settings className="h-3.5 w-3.5" /> User Profile & Settings
                  </Link>
                  <Link
                    href="/settings/organization-plans"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                  >
                    <CreditCard className="h-3.5 w-3.5" /> Plans & Compute Units
                  </Link>
                  <Link
                    href="/settings/api-keys"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                  >
                    <Key className="h-3.5 w-3.5" /> API Keys & Webhooks
                  </Link>
                  <Link
                    href="/settings/invitations"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-emerald-400 hover:bg-zinc-800"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" /> Invite Codes & Audit Logs
                  </Link>
                </div>
                <div className="border-t border-[#24242c] pt-1">
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-[#24242c] bg-[#121216] p-4 md:hidden">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-zinc-800/70 px-3 py-2">
              Home Dashboard
            </Link>
            <Link href="/create?mode=image" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-zinc-800/70 px-3 py-2">
              Image Studio
            </Link>
            <Link href="/create?mode=video" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-zinc-800/70 px-3 py-2">
              Video Studio
            </Link>
            <Link href="/create?mode=3d" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-zinc-800/70 px-3 py-2">
              3D Mesh Studio
            </Link>
            <Link href="/canvas/new" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-zinc-800/70 px-3 py-2">
              Infinite Canvas
            </Link>
            <Link href="/workflows" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-zinc-800/70 px-3 py-2">
              Workflows
            </Link>
            <Link href="/models" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-zinc-800/70 px-3 py-2">
              Models Hub
            </Link>
            <Link href="/assets" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-zinc-800/70 px-3 py-2">
              Asset Hub
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={fullHeight ? 'flex-1 overflow-hidden' : 'flex-1'}>{children}</main>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 pt-20 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#2c2c35] bg-[#141418] p-4 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-[#24242c] pb-3">
              <Search className="h-4 w-4 text-zinc-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    setSearchOpen(false);
                    router.push(`/assets?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                placeholder="Search prompts, assets, models, workflows, or jump to a studio..."
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded p-1 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
              {[
                { label: 'Generate Images', href: '/create?mode=image' },
                { label: 'Generate 3D Meshes', href: '/create?mode=3d' },
                { label: 'Generate Seamless Textures', href: '/create?mode=texture' },
                { label: 'Generate 360° Skyboxes', href: '/create?mode=skybox' },
                { label: 'Open Infinite Canvas', href: '/canvas/new' },
                { label: 'Compose a LoRA Model', href: '/compose/new' },
                { label: 'Visual Node Workflows', href: '/workflows' },
                { label: 'Invite-Only Admin Console', href: '/settings/invitations' },
              ].map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  onClick={() => setSearchOpen(false)}
                  className="rounded-lg border border-[#24242c] bg-[#19191f] px-3 py-2 text-zinc-200 hover:border-[#0099ff] hover:text-white"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Spark Drawer */}
      {assistantOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-96 rounded-2xl border border-[#2d2d38] bg-[#141418] p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between border-b border-[#24242c] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0088ff] text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-semibold text-white">Scenario AI Agent</span>
            </div>
            <button
              type="button"
              onClick={() => setAssistantOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {assistantReply && (
            <div className="mb-3 rounded-xl border border-[#262630] bg-[#191920] p-3 text-xs leading-relaxed text-zinc-200">
              {assistantReply}
            </div>
          )}
          <form onSubmit={handleAskAssistant} className="flex gap-2">
            <input
              type="text"
              value={assistantPrompt}
              onChange={(e) => setAssistantPrompt(e.target.value)}
              placeholder="Ask how to build a workflow or refine a prompt..."
              className="flex-1 rounded-lg border border-[#2a2a33] bg-[#0e0e11] px-3 py-2 text-xs text-white outline-none focus:border-[#0099ff]"
            />
            <button
              type="submit"
              disabled={assistantBusy}
              className="flex items-center justify-center rounded-lg bg-[#0099ff] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0080db]"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Bottom-Left "What's New" Changelog Widget (Observed in Screenshots 25–34) */}
      <div className="fixed bottom-4 left-4 z-30">
        {whatsNewOpen ? (
          <div className="w-72 rounded-2xl border border-[#2c2c35] bg-[#141418]/95 p-4 shadow-2xl backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-white">What&apos;s New</span>
              <button
                type="button"
                onClick={() => setWhatsNewOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-[11px]">
              <div className="border-b border-[#24242c] pb-2">
                <p className="font-semibold text-white">
                  Skills - v0.60.1 - More Reliable Skill Installations
                </p>
                <p className="mt-0.5 text-zinc-400">
                  Installation workflows are more stable with pinned setups and agent prerequisites.
                </p>
              </div>
              <div className="border-b border-[#24242c] pb-2">
                <p className="font-semibold text-white">
                  MCP Server - v0.36.0 - Model Schema Updates
                </p>
                <p className="mt-0.5 text-zinc-400">
                  Integrate Scenario tools directly into agents and track API consumption limits.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white">New Models: Kling V4 &amp; Seedance 2.5</p>
                <p className="mt-0.5 text-zinc-400">
                  Generate and edit videos up to 30 seconds with native audio and multi-shot support.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setWhatsNewOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-[#282830] bg-[#141418]/90 px-3 py-1.5 text-[11px] font-medium text-zinc-300 shadow-lg hover:border-zinc-600 hover:text-white"
          >
            <span className="h-2 w-2 rounded-full bg-[#0099ff]" />
            What&apos;s New
          </button>
        )}
      </div>

      {/* New Project Modal */}
      {newProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <form
            onSubmit={handleCreateProject}
            className="w-full max-w-md rounded-2xl border border-[#2c2c35] bg-[#141418] p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Create New Project</h3>
              <button
                type="button"
                onClick={() => setNewProjectModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="block text-xs font-medium text-zinc-300">
              Project Name
              <input
                type="text"
                required
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g., Isometric Dungeon Crawler Vol. 2"
                className="mt-1.5 w-full rounded-lg border border-[#2a2a33] bg-[#0e0e11] px-3 py-2 text-xs text-white outline-none focus:border-[#0099ff]"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewProjectModal(false)}
                className="rounded-lg border border-[#2c2c35] px-3 py-1.5 text-xs text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#0099ff] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0080db]"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
