import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedWorkspaceContext } from '@/lib/auth';
import { SYSTEM_MODELS } from '@/lib/system-catalog';

export async function GET(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customModels = await prisma.aiModel.findMany({
    where: {
      OR: [{ teamId: ctx.team.id }, { privacy: 'public' }],
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    systemModels: SYSTEM_MODELS,
    customModels,
    allModels: [
      ...customModels.map((m) => ({
        id: m.id,
        slug: m.slug,
        name: m.name,
        description: m.description,
        type: m.type,
        modality: m.modality,
        baseModelFamily: m.baseModelFamily,
        category: m.category,
        privacy: m.privacy,
        triggerWord: m.triggerWord,
        tags: JSON.parse(m.tagsJson || '[]'),
        components: JSON.parse(m.componentsJson || '[]'),
        oscuCost: m.oscuCost,
        isCustom: true,
        createdAt: m.createdAt,
      })),
      ...SYSTEM_MODELS.map((m) => ({
        ...m,
        components: [],
        isCustom: false,
      })),
    ],
  });
}

export async function POST(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body.name || '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const model = await prisma.aiModel.create({
    data: {
      teamId: ctx.team.id,
      projectId: ctx.project.id,
      authorId: ctx.user.id,
      slug: `${slug}-${Date.now().toString(36)}`,
      name,
      description: String(body.description || 'Custom game production model').trim(),
      type: String(body.type || 'lora'),
      modality: String(body.modality || 'image'),
      baseModelFamily: String(body.baseModelFamily || 'FLUX.1'),
      category: String(body.category || 'Characters'),
      privacy: String(body.privacy || 'private'),
      triggerWord: body.triggerWord ? String(body.triggerWord) : null,
      tagsJson: JSON.stringify(body.tags || ['Custom', 'LoRA']),
      componentsJson: JSON.stringify(body.components || []),
      oscuCost: Number(body.oscuCost || 10),
    },
  });

  return NextResponse.json({ model }, { status: 201 });
}
