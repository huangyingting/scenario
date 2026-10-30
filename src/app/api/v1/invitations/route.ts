import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedWorkspaceContext, isSystemAdmin } from '@/lib/auth';
import { AccountAdmissionError, issueInvitationCode } from '@/lib/account-admission';

export async function GET(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isSystemAdmin(ctx.user.role) && ctx.workspaceRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const invitations = await prisma.invitationCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, email: true, name: true } },
      redemptions: {
        include: {
          user: { select: { id: true, email: true, name: true, role: true } },
        },
        orderBy: { redeemedAt: 'desc' },
      },
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
    take: 100,
  });

  return NextResponse.json({
    invitations: invitations.map((inv) => ({
      ...inv,
      invitedEmail: inv.boundEmail,
      assignedRole: inv.role,
      notes: inv.label,
      status: inv.status.toLowerCase(),
    })),
  });
}

export async function POST(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isSystemAdmin(ctx.user.role) && ctx.workspaceRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const rawRole = String(body.role || body.assignedRole || 'USER').toUpperCase();
    const requestedRole =
      rawRole === 'ADMIN'
        ? 'ADMIN'
        : rawRole === 'SUPER_ADMIN'
          ? 'SUPER_ADMIN'
          : 'USER';
    if (requestedRole === 'SUPER_ADMIN' && ctx.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only SUPER_ADMIN can issue SUPER_ADMIN invitations.' },
        { status: 403 }
      );
    }

    const invitation = await issueInvitationCode({
      label: body.label || body.notes || 'Studio Invite',
      role: requestedRole,
      workspaceRole:
        body.workspaceRole ||
        (String(body.assignedRole || '').toLowerCase() === 'viewer'
          ? 'reader'
          : String(body.assignedRole || '').toLowerCase() === 'admin'
            ? 'admin'
            : 'editor'),
      targetTeamId: body.attachToCurrentTeam ? ctx.team.id : null,
      boundEmail: body.boundEmail || body.invitedEmail || null,
      maxUses: body.maxUses !== undefined ? Number(body.maxUses) : 1,
      expiresInHours: body.expiresInHours !== undefined ? Number(body.expiresInHours) : 168,
      createdById: ctx.user.id,
    });

    return NextResponse.json(
      {
        invitation: {
          ...invitation,
          invitedEmail: invitation.boundEmail,
          assignedRole: invitation.role,
          notes: invitation.label,
          status: invitation.status.toLowerCase(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof AccountAdmissionError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to issue invitation.' }, { status: 500 });
  }
}
