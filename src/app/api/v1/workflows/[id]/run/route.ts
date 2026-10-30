import { NextResponse } from 'next/server';
import { getAuthenticatedWorkspaceContext } from '@/lib/auth';
import { executeWorkflowGraph } from '@/lib/workflow-engine';

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (ctx.workspaceRole === 'reader') {
    return NextResponse.json({ error: 'Editor or Admin required to run workflows' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const result = await executeWorkflowGraph({
      workflowId: id,
      teamId: ctx.team.id,
      projectId: ctx.project.id,
      userId: ctx.user.id,
      inputs: body.inputs || {},
      approveGate: Boolean(body.approveGate),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Workflow execution failed.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
