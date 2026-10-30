import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedWorkspaceContext } from '@/lib/auth';

export async function POST(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body.name || '').trim();
  const baseModel = String(body.baseModel || body.baseModelId || 'FLUX.1 Dev');
  const rawComponents = Array.isArray(body.components)
    ? body.components
    : Array.isArray(body.loras)
      ? body.loras
      : [];
  const components = rawComponents.slice(0, 5);

  if (!name) {
    return NextResponse.json({ error: 'Composition name is required.' }, { status: 400 });
  }
  if (components.length === 0) {
    return NextResponse.json(
      { error: 'Add between 1 and 5 component models to compose.' },
      { status: 400 }
    );
  }

  const normalizedComponents: Array<{ modelId: string; name: string; weight: number }> =
    components.map((c: Record<string, unknown>) => ({
      modelId: String(c.modelId || ''),
      name: String(c.name || 'LoRA Component'),
      weight: Math.min(2, Math.max(-1, Number(c.weight || 0.5))),
    }));

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const composedModel = await prisma.aiModel.create({
    data: {
      teamId: ctx.team.id,
      projectId: ctx.project.id,
      authorId: ctx.user.id,
      slug: `composed-${slug}-${Date.now().toString(36)}`,
      name,
      description:
        body.description ||
        `Composed ${baseModel} blend (${normalizedComponents.map((c) => `${c.name} @ ${Math.round(c.weight * 100)}%`).join(' + ')})`,
      type: 'composed',
      modality: 'image',
      baseModelFamily: baseModel,
      category: String(body.category || 'Characters'),
      privacy: String(body.privacy || 'private'),
      triggerWord: body.triggerWord ? String(body.triggerWord) : `blend_${slug.slice(0, 10)}`,
      tagsJson: JSON.stringify(['Composed', baseModel, ...normalizedComponents.map((c) => c.name)]),
      componentsJson: JSON.stringify(normalizedComponents),
      oscuCost: 12,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: ctx.user.id,
      actorEmail: ctx.user.email,
      teamId: ctx.team.id,
      projectId: ctx.project.id,
      action: 'model.composed',
      targetType: 'AiModel',
      targetId: composedModel.id,
      detailsJson: JSON.stringify({
        name: composedModel.name,
        baseModel,
        componentsCount: normalizedComponents.length,
      }),
    },
  });

  return NextResponse.json({ model: composedModel }, { status: 201 });
}
