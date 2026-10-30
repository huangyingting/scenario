import { createHash } from 'node:crypto';
import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { normalizeEmail, verifyPassword } from './account-admission';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 14 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Scenario Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email || '');
        const password = credentials?.password || '';
        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || user.status !== 'ACTIVE') {
          await prisma.auditLog.create({
            data: {
              actorEmail: email,
              action: 'auth.login.failed',
              targetType: 'User',
              severity: 'WARN',
              detailsJson: JSON.stringify({
                reason: !user ? 'USER_NOT_FOUND' : `STATUS_${user.status}`,
              }),
            },
          });
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          await prisma.auditLog.create({
            data: {
              actorId: user.id,
              actorEmail: user.email,
              teamId: user.currentTeamId,
              projectId: user.currentProjectId,
              action: 'auth.login.failed',
              targetType: 'User',
              targetId: user.id,
              severity: 'WARN',
              detailsJson: JSON.stringify({ reason: 'INVALID_PASSWORD' }),
            },
          });
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            actorEmail: user.email,
            teamId: user.currentTeamId,
            projectId: user.currentProjectId,
            action: 'auth.login.succeeded',
            targetType: 'User',
            targetId: user.id,
            severity: 'INFO',
            detailsJson: JSON.stringify({ role: user.role }),
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          currentTeamId: user.currentTeamId,
          currentProjectId: user.currentProjectId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || 'USER';
        token.currentTeamId = (user as { currentTeamId?: string | null }).currentTeamId || null;
        token.currentProjectId = (user as { currentProjectId?: string | null }).currentProjectId || null;
      }
      if (trigger === 'update' && session) {
        if (session.currentTeamId) token.currentTeamId = session.currentTeamId;
        if (session.currentProjectId) token.currentProjectId = session.currentProjectId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        Object.assign(session.user, {
          id: String(token.id),
          role: String(token.role || 'USER'),
          currentTeamId: token.currentTeamId ? String(token.currentTeamId) : null,
          currentProjectId: token.currentProjectId ? String(token.currentProjectId) : null,
        });
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'scenario-production-grade-secret-key-2026-v1',
};

export type WorkspaceContext = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    avatarUrl: string | null;
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
};

export async function getAuthenticatedWorkspaceContext(
  req?: Request
): Promise<WorkspaceContext | null> {
  let userId: string | null = null;

  // Support Bearer API Key authentication for SDK / API clients
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer scen_')) {
      const rawKey = authHeader.slice('Bearer '.length).trim();
      const keyHash = createHash('sha256').update(rawKey).digest('hex');
      const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash },
      });
      if (apiKey && !apiKey.revokedAt) {
        await prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() },
        });
        userId = apiKey.userId;
      }
    }
  }

  if (!userId) {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string } | undefined;
    if (sessionUser?.id) {
      userId = sessionUser.id;
    }
  }

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          team: {
            include: {
              projects: {
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });

  if (!user || user.status !== 'ACTIVE') return null;

  let activeMembership =
    user.memberships.find((m) => m.teamId === user.currentTeamId) ||
    user.memberships[0];

  // Self-heal if user has no workspace yet
  if (!activeMembership) {
    const org = await prisma.organization.create({
      data: {
        name: `${user.name}'s Studio`,
        slug: `studio-${user.id.slice(-6)}`,
        plan: 'pro',
        seatsLimit: 10,
        oscuAllowance: 15000,
        oscuBalance: 15000,
      },
    });
    const project = await prisma.project.create({
      data: {
        teamId: org.id,
        name: 'Main Game Production',
        description: 'Primary game production workspace.',
        privacy: 'private',
      },
    });
    await prisma.oscuBucket.create({
      data: {
        teamId: org.id,
        name: 'Monthly allowance',
        totalUnits: 15000,
        remainingUnits: 15000,
        priority: 1,
      },
    });
    const createdMember = await prisma.organizationMember.create({
      data: {
        teamId: org.id,
        userId: user.id,
        role: 'admin',
      },
      include: {
        team: {
          include: {
            projects: true,
          },
        },
      },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        currentTeamId: org.id,
        currentProjectId: project.id,
      },
    });
    activeMembership = createdMember;
  }

  const team = activeMembership.team;
  let activeProject =
    team.projects.find((p) => p.id === user.currentProjectId) ||
    team.projects[0];

  if (!activeProject) {
    activeProject = await prisma.project.create({
      data: {
        teamId: team.id,
        name: 'Main Game Production',
        description: 'Primary game production workspace.',
        privacy: 'private',
      },
    });
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      currentTeamId: team.id,
      currentProjectId: activeProject.id,
    },
    team: {
      id: team.id,
      name: team.name,
      slug: team.slug,
      plan: team.plan,
      seatsLimit: team.seatsLimit,
      oscuAllowance: team.oscuAllowance,
      oscuBalance: team.oscuBalance,
      autoRefillEnabled: team.autoRefillEnabled,
      autoRefillThreshold: team.autoRefillThreshold,
      autoRefillAmount: team.autoRefillAmount,
    },
    project: {
      id: activeProject.id,
      name: activeProject.name,
      description: activeProject.description,
      privacy: activeProject.privacy,
      guardrailsJson: activeProject.guardrailsJson,
    },
    workspaceRole: (activeMembership.role as 'admin' | 'editor' | 'reader') || 'editor',
  };
}

export function isSystemAdmin(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}
