-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentTeamId" TEXT,
    "currentProjectId" TEXT,
    "onboarded" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InvitationCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "workspaceRole" TEXT NOT NULL DEFAULT 'admin',
    "targetTeamId" TEXT,
    "boundEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME,
    "revokedAt" DATETIME,
    "revokedReason" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvitationCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvitationRedemption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invitationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "redeemedEmail" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "redeemedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvitationRedemption_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "InvitationCode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvitationRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvitationAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invitationId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "codeAttempt" TEXT,
    "emailAttempt" TEXT,
    "reason" TEXT,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvitationAuditLog_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "InvitationCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InvitationAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "teamId" TEXT,
    "projectId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "detailsJson" TEXT NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'pro',
    "seatsLimit" INTEGER NOT NULL DEFAULT 10,
    "oscuAllowance" INTEGER NOT NULL DEFAULT 15000,
    "oscuBalance" INTEGER NOT NULL DEFAULT 15000,
    "autoRefillEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoRefillThreshold" INTEGER NOT NULL DEFAULT 1000,
    "autoRefillAmount" INTEGER NOT NULL DEFAULT 5000,
    "usageAlertThreshold" INTEGER NOT NULL DEFAULT 80,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganizationMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT 'Main Game Production Workspace',
    "privacy" TEXT NOT NULL DEFAULT 'private',
    "guardrailsJson" TEXT NOT NULL DEFAULT '{"bannedTerms":[],"requiredStyleSuffix":"","minResolution":512,"requireQualityGate":false}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OscuBucket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalUnits" INTEGER NOT NULL,
    "remainingUnits" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OscuBucket_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OscuTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OscuTransaction_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OscuTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT,
    "projectId" TEXT,
    "authorId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'lora',
    "modality" TEXT NOT NULL DEFAULT 'image',
    "baseModelFamily" TEXT NOT NULL DEFAULT 'FLUX.1',
    "category" TEXT NOT NULL DEFAULT 'Characters',
    "privacy" TEXT NOT NULL DEFAULT 'private',
    "triggerWord" TEXT,
    "thumbnailUrl" TEXT,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "componentsJson" TEXT NOT NULL DEFAULT '[]',
    "oscuCost" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiModel_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AiModel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AiModel_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModelTrainingJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trainingClass" TEXT NOT NULL DEFAULT 'Style',
    "baseModel" TEXT NOT NULL DEFAULT 'FLUX.1 Dev',
    "triggerWord" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "epochs" INTEGER NOT NULL DEFAULT 12,
    "currentEpoch" INTEGER NOT NULL DEFAULT 12,
    "learningRate" REAL NOT NULL DEFAULT 0.0004,
    "datasetScore" INTEGER NOT NULL DEFAULT 92,
    "datasetItemsJson" TEXT NOT NULL DEFAULT '[]',
    "metricsJson" TEXT NOT NULL DEFAULT '[]',
    "outputModelId" TEXT,
    "oscuCost" INTEGER NOT NULL DEFAULT 250,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "ModelTrainingJob_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModelTrainingJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModelTrainingJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InferenceJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT NOT NULL DEFAULT '',
    "parametersJson" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "oscuCost" INTEGER NOT NULL DEFAULT 10,
    "durationMs" INTEGER NOT NULL DEFAULT 420,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "InferenceJob_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InferenceJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InferenceJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inferenceJobId" TEXT,
    "modality" TEXT NOT NULL,
    "toolBadge" TEXT NOT NULL DEFAULT 'Txt2Img',
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT NOT NULL DEFAULT '',
    "modelId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/svg+xml',
    "width" INTEGER NOT NULL DEFAULT 1024,
    "height" INTEGER NOT NULL DEFAULT 1024,
    "durationSec" INTEGER,
    "seed" INTEGER NOT NULL DEFAULT 1000,
    "dataUrl" TEXT NOT NULL,
    "artifactPayload" TEXT NOT NULL DEFAULT '',
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "publishedToExplore" BOOLEAN NOT NULL DEFAULT false,
    "trashedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Asset_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Asset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Asset_inferenceJobId_fkey" FOREIGN KEY ("inferenceJobId") REFERENCES "InferenceJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "privacy" TEXT NOT NULL DEFAULT 'private',
    "coverUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Collection_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Collection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollectionAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collectionId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollectionAsset_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollectionAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'Characters',
    "privacy" TEXT NOT NULL DEFAULT 'private',
    "isPublishedApp" BOOLEAN NOT NULL DEFAULT true,
    "beforeImageUrl" TEXT,
    "afterImageUrl" TEXT,
    "nodesJson" TEXT NOT NULL DEFAULT '[]',
    "edgesJson" TEXT NOT NULL DEFAULT '[]',
    "inputKeysJson" TEXT NOT NULL DEFAULT '[]',
    "nodeGroupsJson" TEXT NOT NULL DEFAULT '[]',
    "oscuEstimate" INTEGER NOT NULL DEFAULT 20,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workflow_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Workflow_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Workflow_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "inputsJson" TEXT NOT NULL DEFAULT '{}',
    "nodeStatesJson" TEXT NOT NULL DEFAULT '{}',
    "outputAssetIdsJson" TEXT NOT NULL DEFAULT '[]',
    "oscuSpent" INTEGER NOT NULL DEFAULT 20,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "WorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowRun_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CanvasProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Untitled Canvas',
    "width" INTEGER NOT NULL DEFAULT 1920,
    "height" INTEGER NOT NULL DEFAULT 1080,
    "zoom" REAL NOT NULL DEFAULT 1.0,
    "panX" REAL NOT NULL DEFAULT 0,
    "panY" REAL NOT NULL DEFAULT 0,
    "liveMode" BOOLEAN NOT NULL DEFAULT false,
    "frameJson" TEXT NOT NULL DEFAULT '{"x":240,"y":120,"width":512,"height":512,"prompt":"Isometric arcane sanctuary","modelId":"model_flux-1-dev"}',
    "layersJson" TEXT NOT NULL DEFAULT '[{"id":"layer_base","name":"Base Sketch","visible":true,"locked":false,"opacity":1}]',
    "strokesJson" TEXT NOT NULL DEFAULT '[]',
    "thumbnailUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CanvasProject_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CanvasProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CanvasProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "scopesJson" TEXT NOT NULL DEFAULT '["inferences:write","assets:read","workflows:run","models:read"]',
    "lastUsedAt" DATETIME,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiKey_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "eventsJson" TEXT NOT NULL DEFAULT '["inference.completed","training.completed","workflow.completed"]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" DATETIME,
    "lastStatus" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WebhookEndpoint_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WebhookEndpoint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "InvitationCode_code_key" ON "InvitationCode"("code");

-- CreateIndex
CREATE INDEX "InvitationCode_status_idx" ON "InvitationCode"("status");

-- CreateIndex
CREATE INDEX "InvitationCode_boundEmail_idx" ON "InvitationCode"("boundEmail");

-- CreateIndex
CREATE INDEX "InvitationRedemption_invitationId_idx" ON "InvitationRedemption"("invitationId");

-- CreateIndex
CREATE INDEX "InvitationRedemption_userId_idx" ON "InvitationRedemption"("userId");

-- CreateIndex
CREATE INDEX "InvitationAuditLog_invitationId_idx" ON "InvitationAuditLog"("invitationId");

-- CreateIndex
CREATE INDEX "InvitationAuditLog_action_idx" ON "InvitationAuditLog"("action");

-- CreateIndex
CREATE INDEX "InvitationAuditLog_createdAt_idx" ON "InvitationAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_teamId_idx" ON "AuditLog"("teamId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_teamId_userId_key" ON "OrganizationMember"("teamId", "userId");

-- CreateIndex
CREATE INDEX "Project_teamId_idx" ON "Project"("teamId");

-- CreateIndex
CREATE INDEX "OscuBucket_teamId_idx" ON "OscuBucket"("teamId");

-- CreateIndex
CREATE INDEX "OscuTransaction_teamId_idx" ON "OscuTransaction"("teamId");

-- CreateIndex
CREATE INDEX "OscuTransaction_createdAt_idx" ON "OscuTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "AiModel_teamId_idx" ON "AiModel"("teamId");

-- CreateIndex
CREATE INDEX "AiModel_type_idx" ON "AiModel"("type");

-- CreateIndex
CREATE INDEX "AiModel_modality_idx" ON "AiModel"("modality");

-- CreateIndex
CREATE INDEX "ModelTrainingJob_teamId_projectId_idx" ON "ModelTrainingJob"("teamId", "projectId");

-- CreateIndex
CREATE INDEX "InferenceJob_teamId_projectId_idx" ON "InferenceJob"("teamId", "projectId");

-- CreateIndex
CREATE INDEX "InferenceJob_modality_idx" ON "InferenceJob"("modality");

-- CreateIndex
CREATE INDEX "InferenceJob_createdAt_idx" ON "InferenceJob"("createdAt");

-- CreateIndex
CREATE INDEX "Asset_teamId_projectId_idx" ON "Asset"("teamId", "projectId");

-- CreateIndex
CREATE INDEX "Asset_modality_idx" ON "Asset"("modality");

-- CreateIndex
CREATE INDEX "Asset_publishedToExplore_idx" ON "Asset"("publishedToExplore");

-- CreateIndex
CREATE INDEX "Asset_trashedAt_idx" ON "Asset"("trashedAt");

-- CreateIndex
CREATE INDEX "Asset_createdAt_idx" ON "Asset"("createdAt");

-- CreateIndex
CREATE INDEX "Collection_teamId_projectId_idx" ON "Collection"("teamId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionAsset_collectionId_assetId_key" ON "CollectionAsset"("collectionId", "assetId");

-- CreateIndex
CREATE INDEX "Workflow_teamId_projectId_idx" ON "Workflow"("teamId", "projectId");

-- CreateIndex
CREATE INDEX "Workflow_isPublishedApp_idx" ON "Workflow"("isPublishedApp");

-- CreateIndex
CREATE INDEX "WorkflowRun_workflowId_idx" ON "WorkflowRun"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowRun_teamId_projectId_idx" ON "WorkflowRun"("teamId", "projectId");

-- CreateIndex
CREATE INDEX "CanvasProject_teamId_projectId_idx" ON "CanvasProject"("teamId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_teamId_idx" ON "ApiKey"("teamId");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_teamId_projectId_idx" ON "WebhookEndpoint"("teamId", "projectId");

