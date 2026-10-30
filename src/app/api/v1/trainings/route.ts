import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedWorkspaceContext } from '@/lib/auth';

export async function GET(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const trainings = await prisma.modelTrainingJob.findMany({
    where: { teamId: ctx.team.id, projectId: ctx.project.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    trainings: trainings.map((t) => ({
      ...t,
      triggerToken: t.triggerWord,
      datasetCount: 24,
      autoCaption: true,
      lossCurveJson: t.metricsJson,
      resultingModelId: t.outputModelId,
    })),
  });
}

export async function POST(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (ctx.workspaceRole === 'reader') {
    return NextResponse.json({ error: 'Editor or Admin required to train models' }, { status: 403 });
  }

  const body = await req.json();
  const name = String(body.name || '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Model training name is required' }, { status: 400 });
  }

  const trainingClass = String(body.trainingClass || 'Style');
  const baseModel = String(body.baseModel || 'FLUX.1 Dev');
  const epochs = Math.min(Math.max(Number(body.epochs || 12), 4), 40);
  const learningRate = Number(body.learningRate || 0.0004);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const triggerWord = String(
    body.triggerWord || body.triggerToken || `scen_${slug.slice(0, 12)}`
  );
  const oscuCost = epochs * 20;

  const datasetItems = Array.isArray(body.datasetItems)
    ? body.datasetItems
    : [
        { id: 'ds_1', caption: `${triggerWord}, front view orthographic turnaround, clean studio lighting`, score: 96 },
        { id: 'ds_2', caption: `${triggerWord}, isometric 3/4 game camera angle, PBR material detail`, score: 94 },
        { id: 'ds_3', caption: `${triggerWord}, action pose silhouette with emissive accents`, score: 92 },
        { id: 'ds_4', caption: `${triggerWord}, close-up surface texture and ornate trim`, score: 95 },
      ];

  const datasetScore = Math.min(
    99,
    Math.max(
      78,
      Math.round(
        datasetItems.reduce((acc: number, item: { score?: number }) => acc + Number(item.score || 92), 0) /
          Math.max(1, datasetItems.length)
      )
    )
  );

  const metrics = Array.from({ length: epochs }, (_, idx) => {
    const ep = idx + 1;
    const loss = Number((0.42 * Math.exp(-ep * 0.14) + 0.045).toFixed(4));
    const valLoss = Number((loss + 0.012).toFixed(4));
    return { epoch: ep, loss, valLoss };
  });

  const result = await prisma.$transaction(async (tx) => {
    const trainedModel = await tx.aiModel.create({
      data: {
        teamId: ctx.team.id,
        projectId: ctx.project.id,
        authorId: ctx.user.id,
        slug: `lora-${slug}-${Date.now().toString(36)}`,
        name,
        description: `Custom trained ${trainingClass} LoRA on ${baseModel} (Trigger: ${triggerWord})`,
        type: 'lora',
        modality: 'image',
        baseModelFamily: baseModel.includes('FLUX') ? 'FLUX.1' : baseModel,
        category: trainingClass === 'Character' ? 'Characters' : trainingClass === 'Environment' ? 'Environments' : 'Isometric',
        privacy: 'private',
        triggerWord,
        tagsJson: JSON.stringify(['Trained LoRA', trainingClass, baseModel, triggerWord]),
        oscuCost: 10,
      },
    });

    const training = await tx.modelTrainingJob.create({
      data: {
        teamId: ctx.team.id,
        projectId: ctx.project.id,
        userId: ctx.user.id,
        name,
        trainingClass,
        baseModel,
        triggerWord,
        status: 'COMPLETED',
        epochs,
        currentEpoch: epochs,
        learningRate,
        datasetScore,
        datasetItemsJson: JSON.stringify(datasetItems),
        metricsJson: JSON.stringify(metrics),
        outputModelId: trainedModel.id,
        oscuCost,
        completedAt: new Date(),
      },
    });

    const org = await tx.organization.findUniqueOrThrow({ where: { id: ctx.team.id } });
    const nextBalance = Math.max(0, org.oscuBalance - oscuCost);
    await tx.organization.update({
      where: { id: ctx.team.id },
      data: { oscuBalance: nextBalance },
    });

    await tx.oscuTransaction.create({
      data: {
        teamId: ctx.team.id,
        projectId: ctx.project.id,
        userId: ctx.user.id,
        amount: -oscuCost,
        balanceAfter: nextBalance,
        reason: 'TRAINING',
        description: `LoRA Model Training: ${name} (${epochs} epochs)`,
        referenceId: training.id,
      },
    });

    return { training, model: trainedModel };
  });

  return NextResponse.json(result, { status: 201 });
}
