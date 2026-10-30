'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';

export type WorkspaceData = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    currentTeamId: string;
    currentProjectId: string;
  };
  team: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    seatsLimit: number;
    oscuAllowance: number;
    oscuBalance: number;
    autoRefillEnabled: boolean;
    autoRefillThreshold: number;
    autoRefillAmount: number;
  };
  project: {
    id: string;
    name: string;
    description: string;
    privacy: string;
    guardrailsJson: string;
  };
  workspaceRole: 'admin' | 'editor' | 'reader';
  teams: Array<{
    id: string;
    name: string;
    slug: string;
    plan: string;
    oscuBalance: number;
    memberRole: string;
    projects: Array<{ id: string; name: string; description: string; privacy: string }>;
  }>;
  buckets: Array<{
    id: string;
    name: string;
    totalUnits: number;
    remainingUnits: number;
    expiresAt: string | null;
  }>;
};

type WorkspaceContextValue = {
  workspace: WorkspaceData | null;
  user: (WorkspaceData['user'] & { locale?: string }) | null;
  activeTeam: {
    id: string;
    name: string;
    slug: string;
    planTier: string;
    oscuTotal: number;
    oscuUsed: number;
    oscuBalance: number;
  } | null;
  activeProject: {
    id: string;
    name: string;
    description: string;
    guardrailsEnabled?: boolean;
  } | null;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    privacy: string;
    guardrailsEnabled?: boolean;
  }>;
  loading: boolean;
  refreshWorkspace: () => Promise<void>;
  switchProject: (teamId: string, projectId: string) => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspace: null,
  user: null,
  activeTeam: null,
  activeProject: null,
  projects: [],
  loading: true,
  refreshWorkspace: async () => {},
  switchProject: async () => {},
});

function WorkspaceStateProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshWorkspace = useCallback(async () => {
    if (status !== 'authenticated') {
      setWorkspace(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/v1/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data);
      }
    } catch {
      // ignore transient network errors
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  const switchProject = useCallback(
    async (teamId: string, projectId: string) => {
      const res = await fetch('/api/v1/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentTeamId: teamId, currentProjectId: projectId }),
      });
      if (res.ok) {
        await refreshWorkspace();
      }
    },
    [refreshWorkspace]
  );

  const activeTeam = workspace?.team
    ? {
        id: workspace.team.id,
        name: workspace.team.name,
        slug: workspace.team.slug,
        planTier: workspace.team.plan,
        oscuTotal: Math.max(workspace.team.oscuAllowance, workspace.team.oscuBalance),
        oscuUsed: Math.max(0, workspace.team.oscuAllowance - workspace.team.oscuBalance),
        oscuBalance: workspace.team.oscuBalance,
      }
    : null;

  const activeProject = workspace?.project
    ? {
        id: workspace.project.id,
        name: workspace.project.name,
        description: workspace.project.description,
        guardrailsEnabled: workspace.project.guardrailsJson?.includes('"enabled":true'),
      }
    : null;

  const projects =
    workspace?.teams?.find((t) => t.id === workspace.team.id)?.projects ||
    workspace?.teams?.[0]?.projects ||
    [];

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        user: workspace?.user || null,
        activeTeam,
        activeProject,
        projects,
        loading,
        refreshWorkspace,
        switchProject,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <WorkspaceStateProvider>{children}</WorkspaceStateProvider>
    </SessionProvider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
