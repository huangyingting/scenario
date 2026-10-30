import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedWorkspaceContext } from '@/lib/auth';

export async function GET(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const canvases = await prisma.canvasProject.findMany({
    where: { teamId: ctx.team.id, projectId: ctx.project.id },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ canvases });
}

export async function POST(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const canvas = await prisma.canvasProject.create({
    data: {
      teamId: ctx.team.id,
      projectId: ctx.project.id,
      userId: ctx.user.id,
      name: String(body.name || 'Untitled Canvas').trim(),
      liveMode: Boolean(body.liveMode),
    },
  });

  return NextResponse.json({ canvas }, { status: 201 });
}
