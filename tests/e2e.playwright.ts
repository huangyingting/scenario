import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { chromium } from 'playwright';
import { prisma } from '../src/lib/prisma';
import { issueInvitationCode } from '../src/lib/account-admission';

const PORT = 3199;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function cleanDatabase() {
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

async function waitForServer(url: string, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for server at ${url}`);
}

async function runE2E() {
  console.log('1. Resetting database to verify Zero Dummy Data invariant...');
  await cleanDatabase();

  console.log(`2. Starting Next.js production server on ${BASE_URL}...`);
  const server: ChildProcess = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(PORT),
      NEXTAUTH_URL: BASE_URL,
      NEXTAUTH_SECRET: 'scenario-e2e-test-secret-key-2026',
    },
    stdio: 'pipe',
  });

  const browser = await chromium.launch({ headless: true });

  try {
    await waitForServer(BASE_URL);
    console.log('✓ Server ready.');

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // Step 1: Verify Marketing Landing Page (/)
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const homeHeading = await page.textContent('body');
    assert.ok(homeHeading?.includes('Scenario'), 'Marketing landing page should render Scenario branding');
    console.log('✓ Marketing landing page (/) verified.');

    // Step 2: Verify Unauthenticated /dashboard redirects to /login
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    assert.ok(page.url().includes('/login'), 'Unauthenticated /dashboard should redirect to /login');
    console.log('✓ Unauthenticated route protection verified (/dashboard -> /login).');

    // Step 3: Verify Invite-Only Registration blocks invalid invitation codes
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
    await page.fill('input[name="code"]', 'SCEN-0000-0000-0000');
    await page.fill('input[name="email"]', 'director@studio-e2e.io');
    await page.fill('input[name="name"]', 'Marcus Sterling');
    await page.fill('input[name="workspaceName"]', 'Sterling Interactive');
    await page.fill('input[type="password"]', 'SterlingProd!2026');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    const bodyAfterInvalid = await page.textContent('body');
    assert.ok(
      bodyAfterInvalid?.toLowerCase().includes('not found') ||
        bodyAfterInvalid?.toLowerCase().includes('invalid'),
      'Invalid invite code must be rejected'
    );
    console.log('✓ Invalid invitation code rejection verified.');

    // Step 4: Issue real single-use SUPER_ADMIN invitation code and register via UI
    const issuedInvite = await issueInvitationCode({
      label: 'E2E Studio Founder Seat',
      role: 'SUPER_ADMIN',
      workspaceRole: 'admin',
      maxUses: 1,
      expiresInHours: 24,
    });

    await page.fill('input[name="code"]', issuedInvite.code);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 20000 });
    assert.ok(page.url().includes('/dashboard'), 'Valid registration should sign in and redirect to /dashboard');
    console.log('✓ Single-use invitation code registration & auto-login to /dashboard verified.');

    // Step 5: Verify Multi-Modal Create Studio (/create) & Live Asset Synthesis
    await page.goto(`${BASE_URL}/create?mode=image`, { waitUntil: 'networkidle' });
    await page.fill('textarea[name="prompt"]', 'Isometric dark fantasy obsidian throne with glowing cyan runes');
    await page.click('button:has-text("Generate")');
    await page.waitForTimeout(1800);
    const assetCountAfterGen = await prisma.asset.count();
    assert.ok(assetCountAfterGen >= 1, 'Generating in /create must persist an Asset in Prisma DB');
    console.log('✓ Multi-Modal Create Studio (/create) inference and DB persistence verified.');

    // Step 6: Verify Infinite Canvas (/canvas/new), Workflows (/workflows/new), Trainings (/models/trainings), Compose (/compose/new)
    for (const route of [
      '/canvas/new',
      '/workflows',
      '/workflows/new',
      '/apps',
      '/models',
      '/models/trainings',
      '/compose/new',
      '/assets',
      '/collections',
      '/explore',
      '/pricing',
      '/settings/invitations',
      '/settings/audit-logs',
    ]) {
      const resp = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
      assert.equal(resp?.status(), 200, `Route ${route} should return HTTP 200`);
    }
    console.log('✓ All 13 studio, workflow, training, compose, asset, pricing, and RBAC audit routes verified.');

    // Step 7: Verify Mobile Responsive Viewport (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/create`, { waitUntil: 'networkidle' });
    const mobileText = await page.textContent('body');
    assert.ok(mobileText?.includes('Generate'), 'Mobile viewport /create studio should render Generate CTA');
    console.log('✓ Mobile responsive viewport (390x844) verified.');
  } finally {
    await browser.close();
    if (server.pid) {
      process.kill(server.pid, 'SIGTERM');
    }
    // Clean up all E2E test records so database stays at 0 dummy users/data
    await cleanDatabase();
    const finalUsers = await prisma.user.count();
    assert.equal(finalUsers, 0, 'Database must remain clean with zero dummy users after E2E suite');
    console.log('✓ Post-E2E database cleanup verified (0 dummy users).');
    await prisma.$disconnect();
  }
}

runE2E()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('E2E failed:', err);
    process.exit(1);
  });
