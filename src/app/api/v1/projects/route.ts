import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedWorkspaceContext } from '@/lib/auth';

export async function GET(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { teamId: ctx.team.id },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({
    projects: projects.map((p) => {
      let g: Record<string, unknown> = {};
      try {
        g = JSON.parse(p.guardrailsJson || '{}');
      } catch {
        g = {};
      }
      return {
        ...p,
        guardrailsEnabled: Boolean(g.enabled),
        bannedTerms: Array.isArray(g.bannedKeywords)
          ? g.bannedKeywords.join(', ')
          : String(g.bannedTerms || ''),
        brandHexPalette: Array.isArray(g.brandPalette)
          ? g.brandPalette.join(',')
          : String(g.brandHexPalette || '#0099ff,#0b0b0c'),
      };
    }),
    activeProjectId: ctx.project.id,
  });
}

export async function POST(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (ctx.workspaceRole === 'reader') {
    return NextResponse.json({ error: 'Editor or Admin role required' }, { status: 403 });
  }

  const body = await req.json();
  const name = String(body.name || '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      teamId: ctx.team.id,
      name,
      description: String(body.description || 'Game Production Project').trim(),
      privacy: String(body.privacy || 'private'),
    },
  });

  if (body.switchActive !== false) {
    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { currentProjectId: project.id },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: ctx.user.id,
      actorEmail: ctx.user.email,
      teamId: ctx.team.id,
      projectId: project.id,
      action: 'project.created',
      targetType: 'Project',
      targetId: project.id,
      detailsJson: JSON.stringify({ name: project.name, privacy: project.privacy }),
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}

export async function PATCH(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const targetProjectId = String(body.projectId || ctx.project.id);

  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if (typeof body.description === 'string') data.description = body.description.trim();
  if (typeof body.privacy === 'string') data.privacy = body.privacy;
  if (body.guardrails) {
    data.guardrailsJson =
      typeof body.guardrails === 'string'
        ? body.guardrails
        : JSON.stringify(body.guardrails);
  } else if (
    body.guardrailsEnabled !== undefined ||
    body.bannedTerms !== undefined ||
    body.brandHexPalette !== undefined
  ) {
    const bannedKeywords = String(body.bannedTerms || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const brandPalette = String(body.brandHexPalette || '#0099ff,#0b0b0c')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    data.guardrailsJson = JSON.stringify({
      enabled: Boolean(body.guardrailsEnabled),
      bannedKeywords,
      bannedTerms: String(body.bannedTerms || ''),
      brandPalette,
      brandHexPalette: String(body.brandHexPalette || ''),
    });
  }

  const project = await prisma.project.update({
    where: { id: targetProjectId },
    data,
  });

  await prisma.auditLog.create({
    data: {
      actorId: ctx.user.id,
      actorEmail: ctx.user.email,
      teamId: ctx.team.id,
      projectId: project.id,
      action: 'project.updated',
      targetType: 'Project',
      targetId: project.id,
      detailsJson: JSON.stringify(data),
    },
  });

  return NextResponse.json({ project });
}
