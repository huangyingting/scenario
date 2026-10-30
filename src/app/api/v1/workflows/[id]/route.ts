import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedWorkspaceContext } from '@/lib/auth';
import { WORKFLOW_NODE_SCHEMAS } from '@/lib/system-catalog';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  let workflow = await prisma.workflow.findFirst({
    where: { id, teamId: ctx.team.id },
    include: {
      runs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!workflow && (id === 'new' || id.startsWith('tpl_'))) {
    workflow = await prisma.workflow.findFirst({
      where: { teamId: ctx.team.id, projectId: ctx.project.id },
      include: { runs: { orderBy: { createdAt: 'desc' }, take: 10 } },
      orderBy: { updatedAt: 'desc' },
    });
    if (!workflow) {
      const created = await prisma.workflow.create({
        data: {
          teamId: ctx.team.id,
          projectId: ctx.project.id,
          authorId: ctx.user.id,
          name: 'Isometric Game Asset DAG',
          description: 'Prompt -> FLUX.1 Generator -> Alpha Background Removal',
          category: 'Characters',
          isPublishedApp: true,
          oscuEstimate: 15,
          nodesJson: JSON.stringify([
            {
              id: 'node_text_1',
              type: 'text',
              label: 'Text Prompt',
              position: { x: 80, y: 160 },
              config: { value: 'Isometric dark fantasy paladin relic armor' },
              data: { label: 'Text Prompt', text: 'Isometric dark fantasy paladin relic armor' },
            },
            {
              id: 'node_model_1',
              type: 'model',
              label: 'AI Model Generator',
              position: { x: 380, y: 160 },
              config: { modelId: 'model_flux-1-dev', modality: 'image', aspectRatio: '1:1' },
              data: { label: 'AI Model Generator', modelId: 'model_flux-1-dev', modality: 'image', aspectRatio: '1:1' },
            },
          ]),
          edgesJson: JSON.stringify([
            { id: 'e_1', source: 'node_text_1', target: 'node_model_1' },
          ]),
        },
        include: { runs: true },
      });
      workflow = created;
    }
  }

  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  // Normalize nodes so both .data and .config/.label exist for UI editor
  let normalizedNodes: Array<Record<string, unknown>> = [];
  try {
    const rawNodes = JSON.parse(workflow.nodesJson || '[]');
    normalizedNodes = rawNodes.map((n: Record<string, unknown>) => {
      const dataObj = (n.data as Record<string, unknown>) || {};
      const cfgObj = (n.config as Record<string, unknown>) || dataObj;
      return {
        ...n,
        label: n.label || dataObj.label || n.type || 'Node',
        config: cfgObj,
        data: { ...cfgObj, ...dataObj },
      };
    });
  } catch {
    normalizedNodes = [];
  }

  return NextResponse.json({
    workflow: {
      ...workflow,
      nodesJson: JSON.stringify(normalizedNodes),
    },
    nodeSchemas: WORKFLOW_NODE_SCHEMAS,
  });
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

  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if (typeof body.description === 'string') data.description = body.description.trim();
  if (typeof body.category === 'string') data.category = body.category;
  if (typeof body.isPublishedApp === 'boolean') data.isPublishedApp = body.isPublishedApp;
  if (Array.isArray(body.nodes)) data.nodesJson = JSON.stringify(body.nodes);
  if (Array.isArray(body.edges)) data.edgesJson = JSON.stringify(body.edges);
  if (Array.isArray(body.inputKeys)) data.inputKeysJson = JSON.stringify(body.inputKeys);

  const workflow = await prisma.workflow.update({
    where: { id },
    data,
  });

  return NextResponse.json({ workflow });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  await prisma.workflow.deleteMany({
    where: { id, teamId: ctx.team.id },
  });

  return NextResponse.json({ ok: true });
}
