# System Architecture & Data Model — Scenario Platform

## 1. High-Level System Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                         Client Presentation Layer                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌───────────────────────┐  │
│  │  Marketing & Auth   │  │ Multi-Modal Studios │  │  Automation & Admin   │  │
│  │  / , /login         │  │ /create (11 modes)  │  │  /workflows, /apps    │  │
│  │  /register (Invite) │  │ /canvas/[id]        │  │  /settings/*          │  │
│  │  /pricing           │  │ /models, /compose   │  │  /assets, /collections│  │
│  └──────────┬──────────┘  └──────────┬──────────┘  └───────────┬───────────┘  │
└─────────────┼────────────────────────┼─────────────────────────┼──────────────┘
              │                        │                         │
              ▼                        ▼                         ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                   Next.js App Router API Layer (/api/v1/*)                    │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌───────────────────────┐  │
│  │ Account Admission & │  │ Synthesis & Canvas  │  │ Topological Workflow  │  │
│  │ RBAC Policy Guard   │  │ Engine + Guardrails │  │ DAG Execution Engine  │  │
│  └──────────┬──────────┘  └──────────┬──────────┘  └───────────┬───────────┘  │
└─────────────┼────────────────────────┼─────────────────────────┼──────────────┘
              │                        │                         │
              ▼                        ▼                         ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                  Prisma 7 Dual-Engine Persistence Layer                       │
│  • Local Dev / CI / E2E: SQLite (`@prisma/adapter-better-sqlite3`)            │
│  • Production: PostgreSQL (`@prisma/adapter-pg`)                              │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema & Entity-Relationship Model

Both `prisma/schema.prisma` (SQLite) and `prisma/schema.postgresql.prisma` (PostgreSQL) define the exact same domain models:

### 2.1 Identity, Invite-Only Admission & Audit Entities
1. **`User`**:
   - `id` (CUID), `email` (unique), `name`, `passwordHash`, `avatarUrl`, `role` (`USER` | `ADMIN` | `SUPER_ADMIN`), `status` (`ACTIVE` | `SUSPENDED` | `DEACTIVATED`), `currentTeamId`, `currentProjectId`, `onboarded` (`Boolean`), `createdAt`, `updatedAt`.
2. **`InvitationCode`**:
   - `id` (CUID), `code` (unique, normalized `SCEN-XXXX-XXXX-XXXX`), `label`, `role` (`USER` | `ADMIN` | `SUPER_ADMIN`), `workspaceRole` (`admin` | `editor` | `reader`), `targetTeamId` (optional), `boundEmail` (optional), `status` (`ACTIVE` | `CONSUMED` | `EXPIRED` | `REVOKED`), `maxUses` (default `1`), `usedCount` (default `0`), `expiresAt`, `revokedAt`, `revokedReason`, `createdById`, `createdAt`, `updatedAt`.
3. **`InvitationRedemption`**:
   - `id` (CUID), `invitationId`, `userId`, `redeemedEmail`, `ipAddress`, `userAgent`, `redeemedAt`.
4. **`InvitationAuditLog`**:
   - `id` (CUID), `invitationId`, `actorId`, `action` (`ISSUED` | `VALIDATED` | `REDEEMED` | `REJECTED` | `ROTATED` | `REVOKED`), `metadataJson`, `ipAddress`, `createdAt`.
5. **`AuditLog`**:
   - `id` (CUID), `actorId`, `actorEmail`, `teamId`, `projectId`, `action`, `targetType`, `targetId`, `severity` (`INFO` | `WARN` | `CRITICAL`), `detailsJson`, `ipAddress`, `createdAt`.

### 2.2 Multi-Tenant Workspace, Project & Compute Unit (`OSCU`) Entities
6. **`Organization` (`Team`)**:
   - `id` (CUID), `slug` (unique), `name`, `logoUrl`, `plan` (`pro` | `studio` | `enterprise`), `seatsLimit` (default `10`), `oscuAllowance` (default `15000`), `oscuBalance` (default `15000`), `autoRefillEnabled`, `autoRefillThreshold`, `autoRefillAmount`, `createdAt`, `updatedAt`.
7. **`OrganizationMember`**:
   - `id` (CUID), `teamId`, `userId`, `role` (`admin` | `editor` | `reader`), `joinedAt` (`@@unique([teamId, userId])`).
8. **`Project`**:
   - `id` (CUID), `teamId`, `name`, `description`, `privacy` (`private` | `workspace` | `public`), `guardrailsJson` (JSON storing `bannedTerms`, `requiredStyleTags`, `minWidth`, `minHeight`, `autoWatermark`), `createdAt`, `updatedAt`.
9. **`OscuBucket`**:
   - `id` (CUID), `teamId`, `name` (e.g., `"Monthly allowance"`, `"Top-up batch"`), `totalUnits`, `remainingUnits`, `expiresAt`, `priority` (`Int`), `createdAt`.
10. **`OscuTransaction`**:
    - `id` (CUID), `teamId`, `projectId`, `userId`, `amount` (negative for debit, positive for credit/top-up), `balanceAfter`, `reason` (`INFERENCE` | `TRAINING` | `WORKFLOW_RUN` | `TOP_UP` | `INITIAL_GRANT`), `referenceId`, `createdAt`.

### 2.3 AI Models, Trainings & Compositions
11. **`AiModel`**:
    - `id` (CUID), `teamId` (nullable for system base models), `projectId` (nullable), `authorId` (nullable), `slug`, `name`, `description`, `type` (`base` | `lora` | `composed` | `utility`), `modality` (`image` | `video` | `3d` | `audio` | `text` | `texture` | `skybox` | `edit`), `baseModelFamily` (`FLUX.1` | `SDXL` | `Gemini` | `Seedance` | `Kling` | `Hunyuan3D` | `Scenario`), `category` (`Characters` | `Environments` | `Isometric` | `Pixel Art` | `UI & Icons` | `Textures` | `3D` | `Video` | `Post-Processing`), `privacy` (`public` | `private`), `triggerWord`, `thumbnailUrl`, `tagsJson`, `componentsJson` (for `composed` LoRA blends: `[{ modelId, name, weight }]`), `oscuCost` (`Int`), `createdAt`, `updatedAt`.
12. **`ModelTrainingJob`**:
    - `id` (CUID), `teamId`, `projectId`, `userId`, `name`, `trainingClass` (`Style` | `Character` | `Prop` | `Environment` | `UI`), `baseModel`, `triggerWord`, `status` (`PREPARING` | `TRAINING` | `COMPLETED` | `FAILED`), `epochs` (`Int`), `currentEpoch` (`Int`), `learningRate` (`Float`), `datasetScore` (`Int`), `datasetItemsJson` (`[{ id, caption, width, height, score, dataUrl }]`), `metricsJson` (`[{ epoch, loss, valLoss }]`), `outputModelId`, `oscuCost`, `createdAt`, `completedAt`.

### 2.4 Multi-Modal Inferences, Assets & Collections
13. **`InferenceJob`**:
    - `id` (CUID), `teamId`, `projectId`, `userId`, `modality`, `modelId`, `modelName`, `prompt`, `negativePrompt`, `parametersJson`, `status` (`QUEUED` | `RUNNING` | `COMPLETED` | `FAILED`), `oscuCost`, `durationMs`, `createdAt`, `completedAt`.
14. **`Asset`**:
    - `id` (CUID), `teamId`, `projectId`, `userId`, `inferenceJobId` (nullable), `modality` (`image` | `video` | `3d` | `audio` | `text` | `skybox` | `texture` | `canvas`), `toolBadge` (`Txt2Img` | `Img2Video` | `Img23d` | `AudioSynth` | `TextLLM` | `PBRTexture` | `Skybox360` | `Upscale` | `RemoveBG` | `Vectorize` | `Pixelate` | `CanvasExport`), `title`, `prompt`, `negativePrompt`, `modelId`, `modelName`, `mimeType`, `width`, `height`, `durationSec`, `seed`, `dataUrl`, `artifactPayload` (stores SVG/OBJ/GLTF/WAV/PBR maps or structured markdown), `tagsJson`, `metadataJson`, `publishedToExplore` (`Boolean`), `trashedAt` (nullable `DateTime` for Trash bin support), `createdAt`, `updatedAt`.
15. **`Collection`** & **`CollectionAsset`**:
    - `Collection`: `id`, `teamId`, `projectId`, `userId`, `name`, `description`, `privacy` (`private` | `public`), `coverUrl`, `createdAt`, `updatedAt`.
    - `CollectionAsset`: `id`, `collectionId`, `assetId`, `addedAt` (`@@unique([collectionId, assetId])`).

### 2.5 Visual Workflows, Workflow Runs, Canvases, API Keys & Webhooks
16. **`Workflow`**:
    - `id`, `teamId`, `projectId`, `authorId`, `name`, `description`, `category`, `privacy` (`private` | `public`), `isPublishedApp` (`Boolean`), `beforeImageUrl`, `afterImageUrl`, `nodesJson`, `edgesJson`, `inputKeysJson`, `nodeGroupsJson`, `oscuEstimate`, `createdAt`, `updatedAt`.
17. **`WorkflowRun`**:
    - `id`, `workflowId`, `teamId`, `projectId`, `userId`, `status` (`RUNNING` | `WAITING_APPROVAL` | `COMPLETED` | `FAILED`), `inputsJson`, `nodeStatesJson`, `outputAssetIdsJson`, `oscuSpent`, `createdAt`, `completedAt`.
18. **`CanvasProject`**:
    - `id`, `teamId`, `projectId`, `userId`, `name`, `width`, `height`, `zoom`, `panX`, `panY`, `liveMode` (`Boolean`), `frameJson`, `layersJson`, `strokesJson`, `thumbnailUrl`, `createdAt`, `updatedAt`.
19. **`ApiKey`** & **`WebhookEndpoint`**:
    - `ApiKey`: `id`, `teamId`, `userId`, `name`, `keyPrefix`, `keyHash`, `scopesJson`, `lastUsedAt`, `revokedAt`, `createdAt`.
    - `WebhookEndpoint`: `id`, `teamId`, `projectId`, `url`, `secret`, `eventsJson`, `active`, `lastTriggeredAt`, `lastStatus`, `createdAt`.
