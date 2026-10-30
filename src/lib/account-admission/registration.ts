import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { AccountAdmissionError } from './errors';
import { hashPassword } from './passwords';
import {
  normalizeEmail,
  normalizeInvitationCode,
  validateInvitationCode,
} from './invitations';

export type RedeemInvitationRegisterInput = {
  code: string;
  email: string;
  password: string;
  name: string;
  workspaceName?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

function makeTeamSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'studio';
  const suffix = randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
}

export async function redeemInvitationAndRegister(
  input: RedeemInvitationRegisterInput
) {
  const email = normalizeEmail(input.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AccountAdmissionError(400, 'invalid_email', 'Please provide a valid email address.');
  }

  const name = (input.name || '').trim();
  if (!name || name.length < 2) {
    throw new AccountAdmissionError(400, 'invalid_name', 'Please provide your full name or studio handle.');
  }

  const code = normalizeInvitationCode(input.code);
  const validation = await validateInvitationCode(code, email, {
    logAudit: true,
    ipAddress: input.ipAddress || null,
  });

  if (!validation.valid || !validation.invitation) {
    throw new AccountAdmissionError(
      validation.status === 'EMAIL_MISMATCH' ? 403 : 400,
      `invitation_${validation.status.toLowerCase()}`,
      validation.reason || 'Invalid or expired invitation code.'
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    throw new AccountAdmissionError(
      409,
      'email_already_registered',
      'An account with this email address already exists.'
    );
  }

  const passwordHash = await hashPassword(input.password);
  const now = new Date();
  const inv = validation.invitation;

  const result = await prisma.$transaction(async (tx) => {
    const claimed = await tx.invitationCode.updateMany({
      where: {
        id: inv.id,
        status: 'ACTIVE',
        revokedAt: null,
        usedCount: { lt: inv.maxUses },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      data: {
        usedCount: { increment: 1 },
      },
    });

    if (claimed.count !== 1) {
      throw new AccountAdmissionError(
        409,
        'invitation_exhausted',
        'This invitation code has already been redeemed or is no longer active.'
      );
    }

    const updatedInvite = await tx.invitationCode.findUniqueOrThrow({
      where: { id: inv.id },
    });

    if (updatedInvite.usedCount >= updatedInvite.maxUses) {
      await tx.invitationCode.update({
        where: { id: inv.id },
        data: { status: 'CONSUMED' },
      });
    }

    const user = await tx.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: updatedInvite.role,
        status: 'ACTIVE',
        onboarded: true,
        lastLoginAt: now,
      },
    });

    let teamId = updatedInvite.targetTeamId;
    let projectId: string | null = null;

    if (teamId) {
      const existingTeam = await tx.organization.findUnique({
        where: { id: teamId },
        include: { projects: { orderBy: { createdAt: 'asc' }, take: 1 } },
      });
      if (existingTeam) {
        await tx.organizationMember.create({
          data: {
            teamId: existingTeam.id,
            userId: user.id,
            role: updatedInvite.workspaceRole || 'editor',
          },
        });
        projectId = existingTeam.projects[0]?.id || null;
      } else {
        teamId = null;
      }
    }

    if (!teamId) {
      const orgName = input.workspaceName?.trim() || `${name}'s Studio`;
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug: makeTeamSlug(orgName),
          plan: 'pro',
          seatsLimit: 10,
          oscuAllowance: 15000,
          oscuBalance: 15000,
        },
      });
      teamId = org.id;

      await tx.organizationMember.create({
        data: {
          teamId: org.id,
          userId: user.id,
          role: updatedInvite.workspaceRole || 'admin',
        },
      });

      const defaultProject = await tx.project.create({
        data: {
          teamId: org.id,
          name: 'Main Game Production',
          description: 'Primary game art, 3D assets, textures, and workflow automation workspace.',
          privacy: 'private',
        },
      });
      projectId = defaultProject.id;

      await tx.oscuBucket.create({
        data: {
          teamId: org.id,
          name: 'Monthly allowance',
          totalUnits: 15000,
          remainingUnits: 15000,
          priority: 1,
          expiresAt: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
        },
      });

      await tx.oscuTransaction.create({
        data: {
          teamId: org.id,
          projectId: defaultProject.id,
          userId: user.id,
          amount: 15000,
          balanceAfter: 15000,
          reason: 'INITIAL_GRANT',
          description: 'Pro Studio Initial Monthly Compute Units Allowance',
        },
      });
    }

    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        currentTeamId: teamId,
        currentProjectId: projectId,
      },
    });

    await tx.invitationRedemption.create({
      data: {
        invitationId: inv.id,
        userId: user.id,
        redeemedEmail: email,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      },
    });

    await tx.invitationAuditLog.create({
      data: {
        invitationId: inv.id,
        actorId: user.id,
        action: 'REDEEMED',
        codeAttempt: code,
        emailAttempt: email,
        metadataJson: JSON.stringify({
          userId: user.id,
          role: updatedUser.role,
          teamId,
          projectId,
        }),
        ipAddress: input.ipAddress || null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        actorEmail: email,
        teamId,
        projectId,
        action: 'user.registered_via_invite',
        targetType: 'User',
        targetId: user.id,
        severity: 'INFO',
        detailsJson: JSON.stringify({
          invitationId: inv.id,
          codePrefix: code.slice(0, 9),
          role: updatedUser.role,
        }),
        ipAddress: input.ipAddress || null,
      },
    });

    return {
      user: updatedUser,
      teamId,
      projectId,
    };
  });

  return result;
}
