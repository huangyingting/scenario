import { NextResponse } from 'next/server';
import { getAuthenticatedWorkspaceContext, isSystemAdmin } from '@/lib/auth';
import {
  AccountAdmissionError,
  revokeInvitationCode,
  rotateInvitationCode,
} from '@/lib/account-admission';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isSystemAdmin(ctx.user.role) && ctx.workspaceRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const action = String(body.action || 'revoke');

    if (action === 'rotate') {
      const updated = await rotateInvitationCode({
        invitationId: id,
        actorId: ctx.user.id,
        expiresInHours: body.expiresInHours ? Number(body.expiresInHours) : undefined,
      });
      return NextResponse.json({ invitation: updated });
    }

    const updated = await revokeInvitationCode({
      invitationId: id,
      actorId: ctx.user.id,
      reason: body.reason || 'Revoked by administrator',
    });
    return NextResponse.json({ invitation: updated });
  } catch (err) {
    if (err instanceof AccountAdmissionError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to update invitation.' }, { status: 500 });
  }
}
