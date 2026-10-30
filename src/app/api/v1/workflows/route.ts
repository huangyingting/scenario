import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedWorkspaceContext } from '@/lib/auth';
import { SYSTEM_WORKFLOW_TEMPLATES, WORKFLOW_NODE_SCHEMAS } from '@/lib/system-catalog';

export async function GET(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let workflows = await prisma.workflow.findMany({
    where: { teamId: ctx.team.id, projectId: ctx.project.id },
    include: {
      runs: {
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Provision starter system blueprint workflows into the project if none exist yet
  if (workflows.length === 0) {
    for (const tpl of SYSTEM_WORKFLOW_TEMPLATES) {
      await prisma.workflow.create({
        data: {
          teamId: ctx.team.id,
          projectId: ctx.project.id,
          authorId: ctx.user.id,
          name: tpl.name,
          description: tpl.description,
          category: tpl.category,
          privacy: 'private',
          isPublishedApp: true,
          oscuEstimate: tpl.oscuEstimate,
          inputKeysJson: JSON.stringify(tpl.inputKeys),
          nodesJson: JSON.stringify(tpl.nodes),
          edgesJson: JSON.stringify(tpl.edges),
        },
      });
    }
    workflows = await prisma.workflow.findMany({
      where: { teamId: ctx.team.id, projectId: ctx.project.id },
      include: { runs: { orderBy: { createdAt: 'desc' }, take: 3 } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  const recentRuns = await prisma.workflowRun.findMany({
    where: { teamId: ctx.team.id, projectId: ctx.project.id },
    include: { workflow: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({
    workflows,
    customWorkflows: workflows,
    systemTemplates: SYSTEM_WORKFLOW_TEMPLATES.map((t) => ({
      ...t,
      isPublishedApp: true,
      isSystemTemplate: true,
      nodesJson: JSON.stringify(t.nodes),
      edgesJson: JSON.stringify(t.edges),
    })),
    recentRuns: recentRuns.map((r) => ({
      ...r,
      totalOscuCost: r.oscuSpent,
    })),
    nodeSchemas: WORKFLOW_NODE_SCHEMAS,
    templates: SYSTEM_WORKFLOW_TEMPLATES,
  });
}

export async function POST(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const defaultNodes = body.nodes || [
    {
      id: 'node_text_1',
      type: 'text',
      position: { x: 80, y: 180 },
      data: {
        label: 'Text 1',
        text: 'A crystal palace reflecting a galaxy nebulae in deep space, highly detailed, 8k resolution, cinematic lighting',
      },
    },
    {
      id: 'node_model_1',
      type: 'model',
      position: { x: 460, y: 150 },
      data: {
        label: 'Image Generator 1',
        modelId: 'model_gpt-image-2-5-flare',
        modality: 'image',
        aspectRatio: '1:1',
      },
    },
  ];
  const defaultEdges = body.edges || [
    {
      id: 'e_text1_model1',
      source: 'node_text_1',
      target: 'node_model_1',
      sourceHandle: 'text',
      targetHandle: 'prompt',
    },
  ];

  const workflow = await prisma.workflow.create({
    data: {
      teamId: ctx.team.id,
      projectId: ctx.project.id,
      authorId: ctx.user.id,
      name: String(body.name || 'New Workflow').trim(),
      description: String(body.description || 'Custom multi-node generation workflow').trim(),
      category: String(body.category || 'Characters'),
      privacy: String(body.privacy || 'private'),
      isPublishedApp: body.isPublishedApp !== false,
      oscuEstimate: Number(body.oscuEstimate || 20),
      nodesJson: JSON.stringify(defaultNodes),
      edgesJson: JSON.stringify(defaultEdges),
      inputKeysJson: JSON.stringify(
        body.inputKeys || [
          {
            nodeId: defaultNodes[0]?.id || 'node_text_1',
            parameterPath: 'text',
            name: 'Primary Prompt',
            defaultValue: defaultNodes[0]?.data?.text || '',
          },
        ]
      ),
    },
  });

  return NextResponse.json({ workflow }, { status: 201 });
}
