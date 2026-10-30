import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { AccountAdmissionError } from './errors';

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateInvitationCode(): string {
  const bytes = randomBytes(12);
  let chars = '';
  for (let i = 0; i < 12; i++) {
    chars += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length];
  }
  return `SCEN-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

export function normalizeInvitationCode(raw: string): string {
  return (raw || '').trim().toUpperCase();
}

export function normalizeEmail(raw: string): string {
  return (raw || '').trim().toLowerCase();
}

export type IssueInvitationInput = {
  label?: string;
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  workspaceRole?: 'admin' | 'editor' | 'reader';
  targetTeamId?: string | null;
  boundEmail?: string | null;
  maxUses?: number;
  expiresInHours?: number | null;
  expiresAt?: Date | null;
  createdById?: string | null;
  customCode?: string | null;
  ipAddress?: string | null;
};

export async function issueInvitationCode(input: IssueInvitationInput) {
  const role = input.role || 'USER';
  if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    throw new AccountAdmissionError(400, 'invalid_role', 'Invalid system role.');
  }

  const workspaceRole = input.workspaceRole || 'admin';
  if (!['admin', 'editor', 'reader'].includes(workspaceRole)) {
    throw new AccountAdmissionError(400, 'invalid_workspace_role', 'Invalid workspace role.');
  }

  const maxUses = input.maxUses !== undefined ? Number(input.maxUses) : 1;
  if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 1000) {
    throw new AccountAdmissionError(400, 'invalid_max_uses', 'maxUses must be an integer between 1 and 1000.');
  }

  let expiresAt: Date | null = input.expiresAt ?? null;
  if (!expiresAt && input.expiresInHours !== undefined && input.expiresInHours !== null) {
    expiresAt = new Date(Date.now() + Number(input.expiresInHours) * 3600 * 1000);
  } else if (expiresAt === null && input.expiresInHours === undefined) {
    expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  }

  const boundEmail = input.boundEmail ? normalizeEmail(input.boundEmail) : null;
  const code = input.customCode
    ? normalizeInvitationCode(input.customCode)
    : generateInvitationCode();

  const invitation = await prisma.invitationCode.create({
    data: {
      code,
      label: input.label?.trim() || 'Studio Invitation',
      role,
      workspaceRole,
      targetTeamId: input.targetTeamId || null,
      boundEmail,
      status: 'ACTIVE',
      maxUses,
      usedCount: 0,
      expiresAt,
      createdById: input.createdById || null,
    },
  });

  await prisma.invitationAuditLog.create({
    data: {
      invitationId: invitation.id,
      actorId: input.createdById || null,
      action: 'ISSUED',
      codeAttempt: code,
      emailAttempt: boundEmail,
      metadataJson: JSON.stringify({
        role,
        workspaceRole,
        maxUses,
        expiresAt: expiresAt?.toISOString() || null,
      }),
      ipAddress: input.ipAddress || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: input.createdById || null,
      teamId: input.targetTeamId || null,
      action: 'invitation.issued',
      targetType: 'InvitationCode',
      targetId: invitation.id,
      severity: 'INFO',
      detailsJson: JSON.stringify({
        codePrefix: code.slice(0, 9),
        role,
        workspaceRole,
        maxUses,
        boundEmail,
      }),
      ipAddress: input.ipAddress || null,
    },
  });

  return invitation;
}

export type InvitationValidationResult = {
  valid: boolean;
  status: 'ACTIVE' | 'CONSUMED' | 'EXPIRED' | 'REVOKED' | 'NOT_FOUND' | 'EMAIL_MISMATCH';
  reason?: string;
  invitation?: {
    id: string;
    code: string;
    label: string | null;
    role: string;
    workspaceRole: string;
    boundEmail: string | null;
    maxUses: number;
    usedCount: number;
    remainingUses: number;
    expiresAt: Date | null;
  };
};

export async function validateInvitationCode(
  rawCode: string,
  candidateEmail?: string | null,
  options?: { logAudit?: boolean; ipAddress?: string | null }
): Promise<InvitationValidationResult> {
  const code = normalizeInvitationCode(rawCode);
  const email = candidateEmail ? normalizeEmail(candidateEmail) : null;
  const now = new Date();

  if (!code) {
    return {
      valid: false,
      status: 'NOT_FOUND',
      reason: 'An invitation code is required to register.',
    };
  }

  const invitation = await prisma.invitationCode.findUnique({
    where: { code },
  });

  if (!invitation) {
    if (options?.logAudit) {
      await prisma.invitationAuditLog.create({
        data: {
          action: 'REJECTED',
          codeAttempt: code,
          emailAttempt: email,
          reason: 'CODE_NOT_FOUND',
          ipAddress: options.ipAddress || null,
        },
      });
    }
    return {
      valid: false,
      status: 'NOT_FOUND',
      reason: 'Invitation code not found.',
    };
  }

  if (invitation.status === 'REVOKED' || invitation.revokedAt) {
    if (options?.logAudit) {
      await prisma.invitationAuditLog.create({
        data: {
          invitationId: invitation.id,
          action: 'REJECTED',
          codeAttempt: code,
          emailAttempt: email,
          reason: 'CODE_REVOKED',
          ipAddress: options.ipAddress || null,
        },
      });
    }
    return {
      valid: false,
      status: 'REVOKED',
      reason: invitation.revokedReason
        ? `Invitation revoked: ${invitation.revokedReason}`
        : 'This invitation code has been revoked.',
    };
  }

  if (invitation.expiresAt && invitation.expiresAt <= now) {
    if (invitation.status === 'ACTIVE') {
      await prisma.invitationCode.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
    }
    if (options?.logAudit) {
      await prisma.invitationAuditLog.create({
        data: {
          invitationId: invitation.id,
          action: 'REJECTED',
          codeAttempt: code,
          emailAttempt: email,
          reason: 'CODE_EXPIRED',
          ipAddress: options.ipAddress || null,
        },
      });
    }
    return {
      valid: false,
      status: 'EXPIRED',
      reason: 'This invitation code has expired.',
    };
  }

  if (invitation.status === 'CONSUMED' || invitation.usedCount >= invitation.maxUses) {
    if (invitation.status === 'ACTIVE') {
      await prisma.invitationCode.update({
        where: { id: invitation.id },
        data: { status: 'CONSUMED' },
      });
    }
    if (options?.logAudit) {
      await prisma.invitationAuditLog.create({
        data: {
          invitationId: invitation.id,
          action: 'REJECTED',
          codeAttempt: code,
          emailAttempt: email,
          reason: 'CODE_CONSUMED',
          ipAddress: options.ipAddress || null,
        },
      });
    }
    return {
      valid: false,
      status: 'CONSUMED',
      reason: 'This single-use invitation code has already been redeemed.',
    };
  }

  if (invitation.boundEmail && email && invitation.boundEmail !== email) {
    if (options?.logAudit) {
      await prisma.invitationAuditLog.create({
        data: {
          invitationId: invitation.id,
          action: 'REJECTED',
          codeAttempt: code,
          emailAttempt: email,
          reason: 'BOUND_EMAIL_MISMATCH',
          ipAddress: options.ipAddress || null,
        },
      });
    }
    return {
      valid: false,
      status: 'EMAIL_MISMATCH',
      reason: 'This invitation code is restricted to a different email address.',
    };
  }

  return {
    valid: true,
    status: 'ACTIVE',
    invitation: {
      id: invitation.id,
      code: invitation.code,
      label: invitation.label,
      role: invitation.role,
      workspaceRole: invitation.workspaceRole,
      boundEmail: invitation.boundEmail,
      maxUses: invitation.maxUses,
      usedCount: invitation.usedCount,
      remainingUses: Math.max(0, invitation.maxUses - invitation.usedCount),
      expiresAt: invitation.expiresAt,
    },
  };
}

export async function revokeInvitationCode(params: {
  invitationId: string;
  actorId?: string | null;
  reason?: string;
  ipAddress?: string | null;
}) {
  const existing = await prisma.invitationCode.findUnique({
    where: { id: params.invitationId },
  });
  if (!existing) {
    throw new AccountAdmissionError(404, 'not_found', 'Invitation code not found.');
  }

  const now = new Date();
  const updated = await prisma.invitationCode.update({
    where: { id: existing.id },
    data: {
      status: 'REVOKED',
      revokedAt: now,
      revokedReason: params.reason?.trim() || 'Revoked by administrator',
    },
  });

  await prisma.invitationAuditLog.create({
    data: {
      invitationId: existing.id,
      actorId: params.actorId || null,
      action: 'REVOKED',
      codeAttempt: existing.code,
      reason: updated.revokedReason,
      ipAddress: params.ipAddress || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: params.actorId || null,
      action: 'invitation.revoked',
      targetType: 'InvitationCode',
      targetId: existing.id,
      severity: 'WARN',
      detailsJson: JSON.stringify({
        codePrefix: existing.code.slice(0, 9),
        reason: updated.revokedReason,
      }),
      ipAddress: params.ipAddress || null,
    },
  });

  return updated;
}

export async function rotateInvitationCode(params: {
  invitationId: string;
  actorId?: string | null;
  expiresInHours?: number;
  ipAddress?: string | null;
}) {
  const existing = await prisma.invitationCode.findUnique({
    where: { id: params.invitationId },
  });
  if (!existing) {
    throw new AccountAdmissionError(404, 'not_found', 'Invitation code not found.');
  }
  if (existing.status === 'CONSUMED') {
    throw new AccountAdmissionError(400, 'already_consumed', 'Cannot rotate an already consumed invitation.');
  }

  const newCode = generateInvitationCode();
  const newExpiresAt = params.expiresInHours
    ? new Date(Date.now() + params.expiresInHours * 3600 * 1000)
    : existing.expiresAt;

  const updated = await prisma.invitationCode.update({
    where: { id: existing.id },
    data: {
      code: newCode,
      status: 'ACTIVE',
      revokedAt: null,
      revokedReason: null,
      expiresAt: newExpiresAt,
    },
  });

  await prisma.invitationAuditLog.create({
    data: {
      invitationId: existing.id,
      actorId: params.actorId || null,
      action: 'ROTATED',
      codeAttempt: newCode,
      metadataJson: JSON.stringify({
        previousCodePrefix: existing.code.slice(0, 9),
        newCodePrefix: newCode.slice(0, 9),
      }),
      ipAddress: params.ipAddress || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: params.actorId || null,
      action: 'invitation.rotated',
      targetType: 'InvitationCode',
      targetId: existing.id,
      severity: 'INFO',
      detailsJson: JSON.stringify({
        previousCodePrefix: existing.code.slice(0, 9),
        newCodePrefix: newCode.slice(0, 9),
      }),
      ipAddress: params.ipAddress || null,
    },
  });

  return updated;
}
