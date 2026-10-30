import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedWorkspaceContext } from '@/lib/auth';

export async function GET(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKeys = await prisma.apiKey.findMany({
    where: { teamId: ctx.team.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    apiKeys: apiKeys.map((k) => ({
      ...k,
      scopes: k.scopesJson,
      status: k.revokedAt ? 'revoked' : 'active',
    })),
  });
}

export async function POST(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body.name || 'Production SDK Key').trim();
  const rawSecret = `scen_live_${randomBytes(18).toString('hex')}`;
  const keyHash = createHash('sha256').update(rawSecret).digest('hex');
  const keyPrefix = `${rawSecret.slice(0, 14)}...${rawSecret.slice(-4)}`;

  const apiKey = await prisma.apiKey.create({
    data: {
      teamId: ctx.team.id,
      userId: ctx.user.id,
      name,
      keyPrefix,
      keyHash,
      scopesJson: JSON.stringify(
        body.scopes || ['inferences:write', 'assets:read', 'workflows:run', 'models:read']
      ),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: ctx.user.id,
      actorEmail: ctx.user.email,
      teamId: ctx.team.id,
      action: 'api_key.created',
      targetType: 'ApiKey',
      targetId: apiKey.id,
      detailsJson: JSON.stringify({ name, keyPrefix }),
    },
  });

  return NextResponse.json({ apiKey, secretKey: rawSecret }, { status: 201 });
}

export async function DELETE(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'API Key ID required' }, { status: 400 });
  }

  await prisma.apiKey.updateMany({
    where: { id, teamId: ctx.team.id },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
