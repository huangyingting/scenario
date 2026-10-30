import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedWorkspaceContext } from '@/lib/auth';

export async function GET(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const webhooks = await prisma.webhookEndpoint.findMany({
    where: { teamId: ctx.team.id, projectId: ctx.project.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    webhooks: webhooks.map((wh) => ({
      ...wh,
      events: wh.eventsJson,
      secretHash: `${wh.secret.slice(0, 12)}...`,
      lastTestStatus: wh.lastStatus,
    })),
  });
}

export async function PATCH(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const id = String(body.id || '');
  if (!id) {
    return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 });
  }
  const webhook = await prisma.webhookEndpoint.update({
    where: { id },
    data: {
      lastTriggeredAt: new Date(),
      lastStatus: 200,
    },
  });
  return NextResponse.json({ webhook });
}

export async function POST(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const url = String(body.url || '').trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return NextResponse.json({ error: 'Valid HTTP/HTTPS webhook URL is required' }, { status: 400 });
  }

  const webhook = await prisma.webhookEndpoint.create({
    data: {
      teamId: ctx.team.id,
      projectId: ctx.project.id,
      url,
      secret: `whsec_${randomBytes(16).toString('hex')}`,
      eventsJson: JSON.stringify(
        body.events || ['inference.completed', 'training.completed', 'workflow.completed']
      ),
      active: true,
    },
  });

  return NextResponse.json({ webhook }, { status: 201 });
}

export async function DELETE(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 });
  }

  await prisma.webhookEndpoint.deleteMany({
    where: { id, teamId: ctx.team.id },
  });

  return NextResponse.json({ ok: true });
}
