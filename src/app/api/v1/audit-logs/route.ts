import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedWorkspaceContext, isSystemAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const actionFilter = searchParams.get('action') || undefined;

  const whereClause = isSystemAdmin(ctx.user.role)
    ? actionFilter
      ? { action: { contains: actionFilter } }
      : {}
    : {
        teamId: ctx.team.id,
        ...(actionFilter ? { action: { contains: actionFilter } } : {}),
      };

  const [auditLogs, invitationLogs] = await Promise.all([
    prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    isSystemAdmin(ctx.user.role) || ctx.workspaceRole === 'admin'
      ? prisma.invitationAuditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    auditLogs: [
      ...invitationLogs.map((il) => ({
        id: il.id,
        eventType: il.action,
        action: il.action,
        actorEmail: il.emailAttempt || il.actorId || 'system',
        targetType: 'InvitationCode',
        targetId: il.invitationId,
        metadataJson: il.metadataJson || '{}',
        createdAt: il.createdAt,
      })),
      ...auditLogs.map((al) => ({
        ...al,
        eventType: al.action,
        metadataJson: al.detailsJson,
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    invitationLogs,
  });
}
