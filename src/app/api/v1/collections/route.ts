import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedWorkspaceContext } from '@/lib/auth';

export async function GET(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const collections = await prisma.collection.findMany({
    where: { teamId: ctx.team.id, projectId: ctx.project.id },
    include: {
      items: {
        include: { asset: true },
        orderBy: { addedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ collections });
}

export async function POST(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body.name || '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
  }

  const collection = await prisma.collection.create({
    data: {
      teamId: ctx.team.id,
      projectId: ctx.project.id,
      userId: ctx.user.id,
      name,
      description: String(body.description || '').trim(),
      privacy: String(body.privacy || 'private'),
    },
  });

  if (body.assetId) {
    await prisma.collectionAsset.create({
      data: {
        collectionId: collection.id,
        assetId: String(body.assetId),
      },
    }).catch(() => {});
  }

  return NextResponse.json({ collection }, { status: 201 });
}

export async function PATCH(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const collectionId = String(body.collectionId || '');
  const assetId = String(body.assetId || '');

  if (body.action === 'add_asset' && collectionId && assetId) {
    const item = await prisma.collectionAsset.upsert({
      where: {
        collectionId_assetId: { collectionId, assetId },
      },
      create: { collectionId, assetId },
      update: {},
    });
    return NextResponse.json({ item });
  }

  if (body.action === 'remove_asset' && collectionId && assetId) {
    await prisma.collectionAsset.deleteMany({
      where: { collectionId, assetId },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid collection action' }, { status: 400 });
}

export async function DELETE(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Collection ID required' }, { status: 400 });
  }

  await prisma.collection.deleteMany({
    where: { id, teamId: ctx.team.id },
  });

  return NextResponse.json({ ok: true });
}
