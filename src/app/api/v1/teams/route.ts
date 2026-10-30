import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedWorkspaceContext } from '@/lib/auth';

export async function GET(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [team, members, buckets, transactions] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: ctx.team.id },
      include: { projects: { orderBy: { createdAt: 'asc' } } },
    }),
    prisma.organizationMember.findMany({
      where: { teamId: ctx.team.id },
      include: {
        user: { select: { id: true, email: true, name: true, role: true, status: true, lastLoginAt: true } },
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
      take: 40,
    }),
  ]);

  return NextResponse.json({
    team,
    teams: team ? [{ ...team, members }] : [],
    members,
    buckets,
    transactions,
  });
}

export async function PATCH(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (ctx.workspaceRole !== 'admin' && ctx.user.role === 'USER') {
    return NextResponse.json({ error: 'Workspace admin required' }, { status: 403 });
  }

  const body = await req.json();

  // Top-up compute units action
  if (body.action === 'top_up' || body.topUpOscu) {
    const units = Math.max(100, Number(body.units || body.topUpOscu || 5000));
    const updated = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.update({
        where: { id: ctx.team.id },
        data: { oscuBalance: { increment: units } },
      });
      await tx.oscuBucket.create({
        data: {
          teamId: ctx.team.id,
          name: body.bucketName || `Top-up · ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} batch`,
          totalUnits: units,
          remainingUnits: units,
          priority: 2,
          expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000),
        },
      });
      await tx.oscuTransaction.create({
        data: {
          teamId: ctx.team.id,
          projectId: ctx.project.id,
          userId: ctx.user.id,
          amount: units,
          balanceAfter: org.oscuBalance,
          reason: 'TOP_UP',
          description: `Purchased ${units.toLocaleString()} Compute Units`,
        },
      });
      return org;
    });
    return NextResponse.json({ team: updated });
  }

  // Update member role
  if (body.action === 'update_member_role' && body.memberId && body.role) {
    const member = await prisma.organizationMember.update({
      where: { id: String(body.memberId) },
      data: { role: String(body.role) },
    });
    return NextResponse.json({ member });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if (typeof body.plan === 'string') data.plan = body.plan;
  if (typeof body.planTier === 'string') data.plan = body.planTier;
  if (typeof body.autoRefillEnabled === 'boolean') data.autoRefillEnabled = body.autoRefillEnabled;
  if (body.autoRefillThreshold !== undefined) data.autoRefillThreshold = Number(body.autoRefillThreshold);
  if (body.autoRefillAmount !== undefined) data.autoRefillAmount = Number(body.autoRefillAmount);
  if (body.usageAlertThreshold !== undefined) data.usageAlertThreshold = Number(body.usageAlertThreshold);

  const team = await prisma.organization.update({
    where: { id: ctx.team.id },
    data,
  });

  await prisma.auditLog.create({
    data: {
      actorId: ctx.user.id,
      actorEmail: ctx.user.email,
      teamId: ctx.team.id,
      action: 'organization.updated',
      targetType: 'Organization',
      targetId: ctx.team.id,
      detailsJson: JSON.stringify(data),
    },
  });

  return NextResponse.json({ team });
}
