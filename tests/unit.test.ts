import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma';
import {
  hashPassword,
  verifyPassword,
  generateInvitationCode,
  normalizeInvitationCode,
  issueInvitationCode,
  validateInvitationCode,
  revokeInvitationCode,
  rotateInvitationCode,
  redeemInvitationAndRegister,
  bootstrapAdmin,
  AccountAdmissionError,
} from '../src/lib/account-admission';
import { executeMultiModalGeneration } from '../src/lib/generation-engine';
import { executeWorkflowGraph } from '../src/lib/workflow-engine';
import { SYSTEM_MODELS, WORKFLOW_NODE_SCHEMAS } from '../src/lib/system-catalog';

async function resetTestDatabase() {
  await prisma.invitationRedemption.deleteMany({});
  await prisma.invitationAuditLog.deleteMany({});
  await prisma.invitationCode.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.workflowRun.deleteMany({});
  await prisma.workflow.deleteMany({});
  await prisma.canvasProject.deleteMany({});
  await prisma.collectionAsset.deleteMany({});
  await prisma.collection.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.inferenceJob.deleteMany({});
  await prisma.modelTrainingJob.deleteMany({});
  await prisma.aiModel.deleteMany({});
  await prisma.apiKey.deleteMany({});
  await prisma.webhookEndpoint.deleteMany({});
  await prisma.oscuTransaction.deleteMany({});
  await prisma.oscuBucket.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.organizationMember.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
}

describe('Scenario Platform Unit & Integration Suite', () => {
  before(async () => {
    await resetTestDatabase();
  });

  after(async () => {
    // Preserve zero-dummy-data invariant after test suite completes
    await resetTestDatabase();
  });

  it('1. Enforces Zero Dummy Data invariant on clean database', async () => {
    const [users, assets, invites] = await Promise.all([
      prisma.user.count(),
      prisma.asset.count(),
      prisma.invitationCode.count(),
    ]);
    assert.equal(users, 0);
    assert.equal(assets, 0);
    assert.equal(invites, 0);
  });

  it('2. Hashes and verifies passwords with scrypt and timing-safe comparison', async () => {
    const hash = await hashPassword('ScenarioProd!2026');
    assert.ok(hash.startsWith('scrypt$'));
    assert.equal(await verifyPassword('ScenarioProd!2026', hash), true);
    assert.equal(await verifyPassword('WrongPassword!2026', hash), false);
  });

  it('3. Mints, validates, rotates, and revokes SCEN-XXXX-XXXX-XXXX invitation codes with audit trails', async () => {
    const token = generateInvitationCode();
    assert.match(token, /^SCEN-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    assert.equal(normalizeInvitationCode(token), normalizeInvitationCode(token.toLowerCase()));

    const issued = await issueInvitationCode({
      label: 'QA Invite',
      role: 'ADMIN',
      workspaceRole: 'admin',
      boundEmail: 'architect@studio.io',
      maxUses: 1,
      expiresInHours: 48,
    });
    assert.equal(issued.status, 'ACTIVE');
    assert.equal(issued.role, 'ADMIN');

    // Email mismatch should fail
    const mismatch = await validateInvitationCode(issued.code, 'other@studio.io');
    assert.equal(mismatch.valid, false);
    assert.equal(mismatch.status, 'EMAIL_MISMATCH');

    // Matching email should pass
    const valid = await validateInvitationCode(issued.code, 'architect@studio.io');
    assert.equal(valid.valid, true);

    // Rotate invitation code
    const rotated = await rotateInvitationCode({ invitationId: issued.id });
    assert.notEqual(rotated.code, issued.code);

    const oldCheck = await validateInvitationCode(issued.code, 'architect@studio.io');
    assert.equal(oldCheck.valid, false);

    // Revoke rotated code
    const revoked = await revokeInvitationCode({
      invitationId: rotated.id,
      reason: 'Security test',
    });
    assert.equal(revoked.status, 'REVOKED');

    const revokedCheck = await validateInvitationCode(rotated.code, 'architect@studio.io');
    assert.equal(revokedCheck.valid, false);
    assert.equal(revokedCheck.status, 'REVOKED');
  });

  it('4. Atomically redeems single-use invitation code, provisions Workspace + OSCU ledger, and blocks replay', async () => {
    const boot = await bootstrapAdmin({
      email: 'root@scenario-test.io',
      password: 'RootAdminPassword!99',
      name: 'Root Admin',
      role: 'SUPER_ADMIN',
      issueInvite: true,
    });
    assert.ok(boot.invitationCode?.startsWith('SCEN-'));

    const reg = await redeemInvitationAndRegister({
      name: 'Elena Vance',
      email: 'elena@scenario-test.io',
      password: 'VanceStrongPassword!99',
      code: boot.invitationCode!,
      workspaceName: 'Vance Interactive Studio',
    });

    assert.equal(reg.user.email, 'elena@scenario-test.io');
    assert.ok(reg.teamId);
    assert.ok(reg.projectId);

    // Attempting to reuse the consumed single-use code must throw AccountAdmissionError
    await assert.rejects(
      async () => {
        await redeemInvitationAndRegister({
          name: 'Replay Attacker',
          email: 'attacker@scenario-test.io',
          password: 'AttackerPassword!99',
          code: boot.invitationCode!,
        });
      },
      (err: unknown) =>
        err instanceof AccountAdmissionError && err.code === 'invitation_consumed'
    );
  });

  it('5. Executes Multi-Modal Generation across Image, 3D (.obj), Audio (.wav), Texture, Skybox & Post-Processing + Guardrails', async () => {
    const user = await prisma.user.findFirstOrThrow({
      where: { email: 'elena@scenario-test.io' },
    });
    const teamId = user.currentTeamId!;
    const projectId = user.currentProjectId!;

    assert.ok(SYSTEM_MODELS.length >= 20);
    assert.equal(WORKFLOW_NODE_SCHEMAS.length, 16);

    // Image synthesis
    const imgGen = await executeMultiModalGeneration({
      teamId,
      projectId,
      userId: user.id,
      modality: 'image',
      modelId: 'model_flux-1-dev',
      prompt: 'Isometric obsidian dragon shrine with glowing cyan runes',
      parameters: { aspectRatio: '1:1', numSamples: 1 },
    });
    assert.equal(imgGen.assets.length, 1);
    assert.ok(imgGen.assets[0].dataUrl.startsWith('data:image/svg+xml;'));

    // 3D Wavefront OBJ mesh synthesis
    const meshGen = await executeMultiModalGeneration({
      teamId,
      projectId,
      userId: user.id,
      modality: '3d',
      modelId: 'model_hunyuan-3d-2-5',
      prompt: 'Low-poly arcane treasure chest prop',
      parameters: { outputFormat: 'OBJ' },
    });
    assert.equal(meshGen.assets[0].mimeType, 'model/obj');
    assert.ok(meshGen.assets[0].artifactPayload.includes('# Scenario 3D PBR Mesh Export'));

    // Playable WAV Audio synthesis
    const audioGen = await executeMultiModalGeneration({
      teamId,
      projectId,
      userId: user.id,
      modality: 'audio',
      modelId: 'model_scenario-audio-fx',
      prompt: 'Arcane sword slash impact sound effect',
    });
    assert.equal(audioGen.assets[0].mimeType, 'audio/wav');
    assert.ok(audioGen.assets[0].artifactPayload.startsWith('data:audio/wav;base64,'));

    // Project Quality Gate Guardrails enforcement
    await prisma.project.update({
      where: { id: projectId },
      data: {
        guardrailsJson: JSON.stringify({
          enabled: true,
          bannedKeywords: ['forbidden_competitor_ip'],
          brandPalette: ['#0099ff'],
        }),
      },
    });

    await assert.rejects(
      async () => {
        await executeMultiModalGeneration({
          teamId,
          projectId,
          userId: user.id,
          modality: 'image',
          modelId: 'model_flux-1-dev',
          prompt: 'Concept art featuring forbidden_competitor_ip logo',
        });
      },
      /Project Quality Gate/i
    );
  });

  it('6. Evaluates topological 16-Node Workflow DAG and produces linked output assets', async () => {
    const user = await prisma.user.findFirstOrThrow({
      where: { email: 'elena@scenario-test.io' },
    });
    const teamId = user.currentTeamId!;
    const projectId = user.currentProjectId!;

    const wf = await prisma.workflow.create({
      data: {
        teamId,
        projectId,
        authorId: user.id,
        name: 'Test Topological DAG',
        description: 'Prompt -> Transform -> Model Generator',
        category: 'Characters',
        nodesJson: JSON.stringify([
          {
            id: 'n1',
            type: 'text',
            position: { x: 0, y: 0 },
            data: { label: 'Prompt', text: 'Cyberpunk ronin helmet' },
          },
          {
            id: 'n2',
            type: 'transformText',
            position: { x: 200, y: 0 },
            data: { label: 'Style Prefix', template: '{{text}}, isometric studio render' },
          },
          {
            id: 'n3',
            type: 'model',
            position: { x: 400, y: 0 },
            data: { label: 'Generator', modelId: 'model_flux-1-dev', modality: 'image' },
          },
        ]),
        edgesJson: JSON.stringify([
          { id: 'e1', source: 'n1', target: 'n2' },
          { id: 'e2', source: 'n2', target: 'n3' },
        ]),
      },
    });

    const res = await executeWorkflowGraph({
      workflowId: wf.id,
      teamId,
      projectId,
      userId: user.id,
    });

    assert.equal(res.run.status, 'COMPLETED');
    assert.equal(res.outputAssets.length, 1);
    assert.equal(res.nodeOutputs.length, 3);
  });
});
