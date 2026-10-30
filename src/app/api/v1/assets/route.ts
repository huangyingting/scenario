import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedWorkspaceContext } from '@/lib/auth';

export async function GET(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const modality = searchParams.get('modality');
  const toolBadge = searchParams.get('toolBadge');
  const modelId = searchParams.get('modelId');
  const collectionId = searchParams.get('collectionId');
  const query = searchParams.get('q')?.trim();
  const trashed =
    searchParams.get('trashed') === 'true' || searchParams.get('trash') === 'true';
  const uploads = searchParams.get('uploads') === 'true';
  const explore = searchParams.get('explore') === 'true';

  if (explore) {
    const publicAssets = await prisma.asset.findMany({
      where: {
        trashedAt: null,
        OR: [{ publishedToExplore: true }, { teamId: ctx.team.id }],
        ...(modality && modality !== 'all' ? { modality } : {}),
        ...(query ? { prompt: { contains: query } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({
      assets: publicAssets.map((a) => ({
        ...a,
        isDeleted: Boolean(a.trashedAt),
        isUploaded: a.toolBadge === 'Upload',
      })),
    });
  }

  const assets = await prisma.asset.findMany({
    where: {
      teamId: ctx.team.id,
      projectId: ctx.project.id,
      trashedAt: trashed ? { not: null } : null,
      ...(modality && modality !== 'all' ? { modality } : {}),
      ...(uploads ? { toolBadge: 'Upload' } : toolBadge ? { toolBadge } : {}),
      ...(modelId ? { modelId } : {}),
      ...(query ? { prompt: { contains: query } } : {}),
      ...(collectionId
        ? { collectionAssets: { some: { collectionId } } }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 120,
  });

  return NextResponse.json({
    assets: assets.map((a) => ({
      ...a,
      isDeleted: Boolean(a.trashedAt),
      isUploaded: a.toolBadge === 'Upload',
    })),
  });
}

export async function POST(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const asset = await prisma.asset.create({
    data: {
      teamId: ctx.team.id,
      projectId: ctx.project.id,
      userId: ctx.user.id,
      modality: String(body.modality || 'image'),
      toolBadge: String(body.toolBadge || 'Upload'),
      title: String(body.title || 'Uploaded Asset').slice(0, 80),
      prompt: String(body.prompt || body.title || 'Uploaded studio reference asset'),
      modelId: String(body.modelId || 'upload'),
      modelName: String(body.modelName || 'Direct Upload'),
      mimeType: String(body.mimeType || 'image/svg+xml'),
      width: Number(body.width || 1024),
      height: Number(body.height || 1024),
      dataUrl: String(body.dataUrl || ''),
      artifactPayload: String(body.artifactPayload || ''),
      tagsJson: JSON.stringify(body.tags || ['upload']),
      publishedToExplore: Boolean(body.publishedToExplore),
    },
  });

  return NextResponse.json({ asset }, { status: 201 });
}

export async function PATCH(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const assetId = String(body.id || '');
  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
  }

  const existing = await prisma.asset.findFirst({
    where: { id: assetId, teamId: ctx.team.id },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.action === 'trash') data.trashedAt = new Date();
  if (body.action === 'restore') data.trashedAt = null;
  if (typeof body.publishedToExplore === 'boolean') {
    data.publishedToExplore = body.publishedToExplore;
  }
  if (typeof body.title === 'string') data.title = body.title.trim();
  if (Array.isArray(body.tags)) data.tagsJson = JSON.stringify(body.tags);

  const asset = await prisma.asset.update({
    where: { id: existing.id },
    data,
  });

  if (typeof body.collectionId === 'string' && body.collectionId) {
    await prisma.collectionAsset.upsert({
      where: {
        collectionId_assetId: {
          collectionId: body.collectionId,
          assetId: existing.id,
        },
      },
      update: {},
      create: {
        collectionId: body.collectionId,
        assetId: existing.id,
      },
    });
  }

  return NextResponse.json({
    asset: {
      ...asset,
      isDeleted: Boolean(asset.trashedAt),
      isUploaded: asset.toolBadge === 'Upload',
    },
  });
}

export async function DELETE(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
  }

  await prisma.asset.deleteMany({
    where: { id, teamId: ctx.team.id },
  });

  return NextResponse.json({ ok: true });
}
