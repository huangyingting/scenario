import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedWorkspaceContext } from '@/lib/auth';

export async function GET(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [memberships, buckets, recentTransactions] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { userId: ctx.user.id },
      include: {
        team: {
          include: {
            projects: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    }),
    prisma.oscuBucket.findMany({
      where: { teamId: ctx.team.id },
      orderBy: { priority: 'asc' },
    }),
    prisma.oscuTransaction.findMany({
      where: { teamId: ctx.team.id },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
  ]);

  return NextResponse.json({
    user: ctx.user,
    team: ctx.team,
    project: ctx.project,
    workspaceRole: ctx.workspaceRole,
    teams: memberships.map((m) => ({
      ...m.team,
      memberRole: m.role,
    })),
    buckets,
    recentTransactions,
  });
}

export async function PATCH(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.name === 'string' && body.name.trim()) {
    data.name = body.name.trim();
  }
  if (typeof body.avatarUrl === 'string') {
    data.avatarUrl = body.avatarUrl.trim() || null;
  }
  if (typeof body.currentTeamId === 'string' && body.currentTeamId) {
    const member = await prisma.organizationMember.findUnique({
      where: {
        teamId_userId: {
          teamId: body.currentTeamId,
          userId: ctx.user.id,
        },
      },
      include: {
        team: { include: { projects: { orderBy: { createdAt: 'asc' }, take: 1 } } },
      },
    });
    if (member) {
      data.currentTeamId = member.teamId;
      data.currentProjectId =
        body.currentProjectId || member.team.projects[0]?.id || ctx.user.currentProjectId;
    }
  } else if (typeof body.currentProjectId === 'string' && body.currentProjectId) {
    const proj = await prisma.project.findFirst({
      where: { id: body.currentProjectId, teamId: ctx.team.id },
    });
    if (proj) {
      data.currentProjectId = proj.id;
    }
  }

  const updated = await prisma.user.update({
    where: { id: ctx.user.id },
    data,
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      currentTeamId: updated.currentTeamId,
      currentProjectId: updated.currentProjectId,
    },
  });
}
