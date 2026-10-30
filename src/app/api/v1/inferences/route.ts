import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedWorkspaceContext } from '@/lib/auth';
import { executeMultiModalGeneration } from '@/lib/generation-engine';

export async function GET(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const modality = searchParams.get('modality') || undefined;

  const inferences = await prisma.inferenceJob.findMany({
    where: {
      teamId: ctx.team.id,
      projectId: ctx.project.id,
      ...(modality ? { modality } : {}),
    },
    include: {
      assets: {
        where: { trashedAt: null },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ inferences });
}

export async function POST(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (ctx.workspaceRole === 'reader') {
    return NextResponse.json(
      { error: 'Forbidden: Editor or Admin workspace permission required to run inferences.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const result = await executeMultiModalGeneration({
      teamId: ctx.team.id,
      projectId: ctx.project.id,
      userId: ctx.user.id,
      modality: body.modality || 'image',
      modelId: body.modelId,
      prompt: String(body.prompt || ''),
      negativePrompt: body.negativePrompt ? String(body.negativePrompt) : '',
      sourceAssetId: body.sourceAssetId ? String(body.sourceAssetId) : undefined,
      parameters: body.parameters || {},
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Inference failed.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
