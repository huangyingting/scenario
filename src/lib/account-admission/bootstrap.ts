import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { AccountAdmissionError } from './errors';
import { hashPassword } from './passwords';
import { issueInvitationCode, normalizeEmail } from './invitations';

export type BootstrapAdminInput = {
  email: string;
  password: string;
  name?: string | null;
  role?: 'ADMIN' | 'SUPER_ADMIN';
  workspaceName?: string | null;
  issueInvite?: boolean;
};

export async function bootstrapAdmin(input: BootstrapAdminInput) {
  const email = normalizeEmail(input.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AccountAdmissionError(400, 'invalid_email', 'Provide a valid administrator email address.');
  }

  const passwordHash = await hashPassword(input.password);
  const name = input.name?.trim() || 'Scenario Administrator';
  const role = input.role || 'SUPER_ADMIN';
  const now = new Date();

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        passwordHash,
        role,
        status: 'ACTIVE',
      },
    });

    let issuedInviteCode: string | null = null;
    if (input.issueInvite) {
      const invite = await issueInvitationCode({
        label: 'Bootstrap Starter Invitation',
        role: 'USER',
        workspaceRole: 'admin',
        maxUses: 1,
        expiresInHours: 168,
        createdById: updated.id,
      });
      issuedInviteCode = invite.code;
    }

    await prisma.auditLog.create({
      data: {
        actorId: updated.id,
        actorEmail: updated.email,
        teamId: updated.currentTeamId,
        projectId: updated.currentProjectId,
        action: 'admin.bootstrap.updated',
        targetType: 'User',
        targetId: updated.id,
        severity: 'INFO',
        detailsJson: JSON.stringify({ role, issuedInviteCode }),
      },
    });

    return {
      created: false,
      user: updated,
      teamId: updated.currentTeamId,
      projectId: updated.currentProjectId,
      invitationCode: issuedInviteCode,
    };
  }

  const orgName = input.workspaceName?.trim() || 'Scenario Studio';
  const slug = `scenario-studio-${randomBytes(3).toString('hex')}`;

  const createdResult = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        status: 'ACTIVE',
        onboarded: true,
        lastLoginAt: now,
      },
    });

    const org = await tx.organization.create({
      data: {
        name: orgName,
        slug,
        plan: 'pro',
        seatsLimit: 25,
        oscuAllowance: 30000,
        oscuBalance: 30000,
      },
    });

    await tx.organizationMember.create({
      data: {
        teamId: org.id,
        userId: user.id,
        role: 'admin',
      },
    });

    const project = await tx.project.create({
      data: {
        teamId: org.id,
        name: 'Main Game Production',
        description: 'Primary game art, 3D meshes, PBR textures, and node workflow workspace.',
        privacy: 'private',
      },
    });

    await tx.oscuBucket.create({
      data: {
        teamId: org.id,
        name: 'Monthly allowance',
        totalUnits: 30000,
        remainingUnits: 30000,
        priority: 1,
        expiresAt: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
      },
    });

    await tx.oscuTransaction.create({
      data: {
        teamId: org.id,
        projectId: project.id,
        userId: user.id,
        amount: 30000,
        balanceAfter: 30000,
        reason: 'INITIAL_GRANT',
        description: 'Bootstrap Studio Compute Allowance',
      },
    });

    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        currentTeamId: org.id,
        currentProjectId: project.id,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: updatedUser.id,
        actorEmail: updatedUser.email,
        teamId: org.id,
        projectId: project.id,
        action: 'admin.bootstrap.created',
        targetType: 'User',
        targetId: updatedUser.id,
        severity: 'INFO',
        detailsJson: JSON.stringify({ role, orgId: org.id, projectId: project.id }),
      },
    });

    return { user: updatedUser, org, project };
  });

  let issuedInviteCode: string | null = null;
  if (input.issueInvite) {
    const invite = await issueInvitationCode({
      label: 'Bootstrap Starter Invitation',
      role: 'USER',
      workspaceRole: 'admin',
      maxUses: 1,
      expiresInHours: 168,
      createdById: createdResult.user.id,
    });
    issuedInviteCode = invite.code;
  }

  return {
    created: true,
    user: createdResult.user,
    teamId: createdResult.org.id,
    projectId: createdResult.project.id,
    invitationCode: issuedInviteCode,
  };
}
