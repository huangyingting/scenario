import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedWorkspaceContext } from '@/lib/auth';
import { executeMultiModalGeneration } from '@/lib/generation-engine';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  let canvas = await prisma.canvasProject.findFirst({
    where: { id, teamId: ctx.team.id },
  });

  if (!canvas && id === 'new') {
    canvas = await prisma.canvasProject.findFirst({
      where: { teamId: ctx.team.id, projectId: ctx.project.id },
      orderBy: { updatedAt: 'desc' },
    });
    if (!canvas) {
      canvas = await prisma.canvasProject.create({
        data: {
          teamId: ctx.team.id,
          projectId: ctx.project.id,
          userId: ctx.user.id,
          name: 'Untitled',
        },
      });
    }
  }

  if (!canvas) {
    return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
  }

  return NextResponse.json({ canvas });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();

  if (body.action === 'generate_frame') {
    const genResult = await executeMultiModalGeneration({
      teamId: ctx.team.id,
      projectId: ctx.project.id,
      userId: ctx.user.id,
      modality: 'image',
      modelId: String(body.modelId || 'model_flux-1-dev'),
      prompt: String(body.prompt || 'Canvas bounding frame sketch-to-image synthesis'),
      parameters: {
        width: Number(body.width || 512),
        height: Number(body.height || 512),
        numSamples: 1,
      },
    });
    return NextResponse.json(genResult);
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string') data.name = body.name.trim() || 'Untitled';
  if (typeof body.zoom === 'number') data.zoom = body.zoom;
  if (typeof body.panX === 'number') data.panX = body.panX;
  if (typeof body.panY === 'number') data.panY = body.panY;
  if (typeof body.liveMode === 'boolean') data.liveMode = body.liveMode;
  if (body.frame) data.frameJson = JSON.stringify(body.frame);
  if (body.layers) data.layersJson = JSON.stringify(body.layers);
  if (body.strokes) data.strokesJson = JSON.stringify(body.strokes);

  const canvas = await prisma.canvasProject.update({
    where: { id },
    data,
  });

  return NextResponse.json({ canvas });
}
