import { prisma } from './prisma';
import { executeMultiModalGeneration } from './generation-engine';

export type WorkflowNode = {
  id: string;
  type: string;
  label?: string;
  position: { x: number; y: number };
  data?: Record<string, unknown>;
  config?: Record<string, unknown>;
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
};

export type ExecuteWorkflowInput = {
  workflowId: string;
  teamId: string;
  projectId: string;
  userId: string;
  inputs?: Record<string, unknown>;
  approveGate?: boolean;
};

export async function executeWorkflowGraph(params: ExecuteWorkflowInput) {
  let workflow = await prisma.workflow.findFirst({
    where: { id: params.workflowId, teamId: params.teamId },
  });

  if (!workflow) {
    workflow = await prisma.workflow.findFirst({
      where: { teamId: params.teamId, projectId: params.projectId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  if (!workflow) {
    throw new Error('Workflow not found.');
  }

  const rawNodes = (JSON.parse(workflow.nodesJson || '[]') as WorkflowNode[]) || [];
  const nodes = rawNodes.map((n) => ({
    ...n,
    data: { ...(n.config || {}), ...(n.data || {}) },
  }));
  const edges = (JSON.parse(workflow.edgesJson || '[]') as WorkflowEdge[]) || [];
  const userInputs = params.inputs || {};

  // Build adjacency & in-degree for topological ordering
  const inDegree = new Map<string, number>();
  const outgoing = new Map<string, WorkflowEdge[]>();
  const incoming = new Map<string, WorkflowEdge[]>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    outgoing.set(n.id, []);
    incoming.set(n.id, []);
  }

  for (const e of edges) {
    if (inDegree.has(e.target) && outgoing.has(e.source)) {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      outgoing.get(e.source)!.push(e);
      incoming.get(e.target)!.push(e);
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const orderedIds: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    orderedIds.push(curr);
    for (const edge of outgoing.get(curr) || []) {
      const nextDeg = (inDegree.get(edge.target) || 1) - 1;
      inDegree.set(edge.target, nextDeg);
      if (nextDeg === 0) queue.push(edge.target);
    }
  }

  // Include any remaining nodes if graph had disconnected components
  for (const n of nodes) {
    if (!orderedIds.includes(n.id)) orderedIds.push(n.id);
  }

  const nodeStates: Record<
    string,
    {
      status: 'COMPLETED' | 'WAITING_APPROVAL' | 'SKIPPED';
      outputText?: string;
      outputAssetIds?: string[];
      outputDataUrl?: string;
    }
  > = {};
  const generatedAssetIds: string[] = [];
  let totalOscuSpent = 0;
  let runStatus: 'COMPLETED' | 'WAITING_APPROVAL' = 'COMPLETED';

  for (const nodeId of orderedIds) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    const incEdges = incoming.get(node.id) || [];
    const upstreamTexts = incEdges
      .map((e) => nodeStates[e.source]?.outputText)
      .filter(Boolean) as string[];
    const upstreamAssets = incEdges
      .flatMap((e) => nodeStates[e.source]?.outputAssetIds || []);

    const overrideVal =
      userInputs[node.id] ??
      userInputs[String(node.data?.label || '')] ??
      userInputs.prompt;

    switch (node.type) {
      case 'text': {
        const textVal = String(
          overrideVal ?? node.data?.text ?? node.data?.value ?? 'Stylized game asset'
        );
        nodeStates[node.id] = { status: 'COMPLETED', outputText: textVal };
        break;
      }
      case 'transformText': {
        const base = upstreamTexts[0] || String(node.data?.text || '');
        const template = String(node.data?.template || '{{text}}, ultra-detailed game production art');
        nodeStates[node.id] = {
          status: 'COMPLETED',
          outputText: template.replace('{{text}}', base),
        };
        break;
      }
      case 'splitText': {
        const base = upstreamTexts[0] || String(node.data?.text || '');
        const parts = base.split(',').map((s) => s.trim()).filter(Boolean);
        nodeStates[node.id] = {
          status: 'COMPLETED',
          outputText: parts.join(' | '),
        };
        break;
      }
      case 'joinTexts': {
        nodeStates[node.id] = {
          status: 'COMPLETED',
          outputText: upstreamTexts.join(', '),
        };
        break;
      }
      case 'llm': {
        const basePrompt = upstreamTexts[0] || String(overrideVal ?? node.data?.prompt ?? 'Game concept');
        const expanded = `${basePrompt} — [LLM Art-Directed Spec: dramatic rim lighting, physically-based materials, crisp silhouette, Unreal Engine 5 production ready]`;
        totalOscuSpent += 5;
        nodeStates[node.id] = { status: 'COMPLETED', outputText: expanded };
        break;
      }
      case 'approval': {
        if (node.data?.requirePause && !params.approveGate) {
          nodeStates[node.id] = {
            status: 'WAITING_APPROVAL',
            outputAssetIds: upstreamAssets,
          };
          runStatus = 'WAITING_APPROVAL';
        } else {
          nodeStates[node.id] = {
            status: 'COMPLETED',
            outputAssetIds: upstreamAssets,
            outputText: upstreamTexts[0],
          };
        }
        break;
      }
      case 'model': {
        if (runStatus === 'WAITING_APPROVAL') {
          nodeStates[node.id] = { status: 'SKIPPED' };
          break;
        }
        const prompt =
          upstreamTexts[0] ||
          String(overrideVal ?? node.data?.prompt ?? workflow.name);
        const modality = (String(node.data?.modality || 'image') as
          | 'image'
          | 'video'
          | '3d'
          | 'audio'
          | 'text'
          | 'texture'
          | 'skybox'
          | 'upscale'
          | 'remove-bg'
          | 'vectorize'
          | 'pixelate');
        const modelId = String(node.data?.modelId || 'model_flux-1-dev');

        const genResult = await executeMultiModalGeneration({
          teamId: params.teamId,
          projectId: params.projectId,
          userId: params.userId,
          modality,
          modelId,
          prompt,
          sourceAssetId: upstreamAssets[0],
          parameters: {
            aspectRatio: String(node.data?.aspectRatio || '1:1'),
            seamless: Boolean(node.data?.seamless),
            outputFormat: String(node.data?.outputFormat || 'GLB'),
          },
        });

        const assetIds = genResult.assets.map((a) => a.id);
        generatedAssetIds.push(...assetIds);
        totalOscuSpent += genResult.job.oscuCost;

        nodeStates[node.id] = {
          status: 'COMPLETED',
          outputText: prompt,
          outputAssetIds: assetIds,
          outputDataUrl: genResult.assets[0]?.dataUrl,
        };
        break;
      }
      default: {
        nodeStates[node.id] = {
          status: 'COMPLETED',
          outputText: upstreamTexts[0] || String(node.data?.text || ''),
          outputAssetIds: upstreamAssets,
        };
        break;
      }
    }
  }

  const workflowRun = await prisma.workflowRun.create({
    data: {
      workflowId: workflow.id,
      teamId: params.teamId,
      projectId: params.projectId,
      userId: params.userId,
      status: runStatus,
      inputsJson: JSON.stringify(userInputs),
      nodeStatesJson: JSON.stringify(nodeStates),
      outputAssetIdsJson: JSON.stringify(generatedAssetIds),
      oscuSpent: totalOscuSpent,
      completedAt: runStatus === 'COMPLETED' ? new Date() : null,
    },
  });

  const outputAssets = generatedAssetIds.length
    ? await prisma.asset.findMany({
        where: { id: { in: generatedAssetIds } },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const assetById = new Map(outputAssets.map((a) => [a.id, a]));
  const nodeOutputs = nodes.map((n) => {
    const st = nodeStates[n.id];
    const firstAssetId = st?.outputAssetIds?.[0];
    const asset = firstAssetId ? assetById.get(firstAssetId) : undefined;
    return {
      nodeId: n.id,
      label: String(n.label || n.data?.label || n.type),
      status: st?.status || 'COMPLETED',
      oscuUsed: n.type === 'model' ? 10 : n.type === 'llm' ? 5 : 0,
      asset: asset
        ? {
            id: asset.id,
            title: asset.title,
            dataUrl: asset.dataUrl,
            toolBadge: asset.toolBadge,
          }
        : undefined,
    };
  });

  return {
    run: workflowRun,
    nodeStates,
    nodeOutputs,
    outputAssets,
    oscuSpent: totalOscuSpent,
  };
}
