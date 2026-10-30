# Implementation Plan & Task Backlog — Scenario Platform

## 1. Phased Implementation Plan

### Phase 1: Exploration & Documentation (Completed)
- Reverse-engineer `scenario.com` and `app.scenario.com` client chunks, provider trees, and live `api.cloud.scenario.com/v1` endpoints.
- Capture 35 desktop and mobile Playwright screenshots documenting all studio modes, navigation menus, workflows, model trainings, compositions, assets, collections, explore, pricing, and settings.
- Produce ADR, PRD, Technical Specification, System Architecture & Data Model, Implementation Plan, Acceptance Criteria & Feature Parity Matrix, and Invite-Only Admission Specification.

### Phase 2: Project Scaffolding & Dual Prisma Database Setup
- Initialize Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 project in `/home/azadmin/scenario`.
- Configure `prisma/schema.prisma` (SQLite for local development) and `prisma/schema.postgresql.prisma` (PostgreSQL for production) with all 19 domain models.
- Generate Prisma Client and apply initial SQLite migration (`prisma/migrations/0001_init/migration.sql`).
- Verify zero pre-seeded user accounts or dummy user assets exist in the database.

### Phase 3: Invite-Only Admission, NextAuth RBAC & CLI Bootstrap
- Implement `src/lib/account-admission/*`:
  - Cryptographic invitation code generator (`SCEN-XXXX-XXXX-XXXX`) and normalizer.
  - Validation service checking `ACTIVE` status, `expiresAt`, `boundEmail`, and `usedCount < maxUses`.
  - Transactional redemption service (`redeemInvitationAndCreateUser`) that atomically increments `usedCount`, marks single-use invitations `CONSUMED`, creates the `User`, provisions their `Organization` (`Team`), default `Project`, and `15,000 OSCU` allowance bucket, and writes `InvitationRedemption`, `InvitationAuditLog`, and `AuditLog`.
  - Invitation lifecycle management (`issueInvitation`, `revokeInvitation`, `rotateInvitation`).
- Implement `scripts/bootstrap-admin.ts` for CLI-only provisioning of the initial `SUPER_ADMIN` / `ADMIN` account and optional starter invitation code.
- Configure NextAuth v4 (`src/lib/auth.ts` and `/api/auth/[...nextauth]/route.ts`) + `/api/auth/register` + `/api/v1/invitations/*`.

### Phase 4: Core Backend Engines & `/api/v1/*` Endpoints
- **System Catalog Registry (`src/lib/system-catalog.ts`)**: Built-in AI base model definitions (`FLUX.1 Dev`, `Gemini 3.1`, `Seedance 2.5`, `Kling V4`, `Hunyuan3D 2.5`, `Scenario Texture`, `Scenario Skybox`, `Topaz Image Upscale`, `PhotoRoom Background Removal`, `Vectorize SVG`, `Pixelate Retro`) and starter DAG workflow templates.
- **Multi-Modal Synthesis Engine (`src/lib/generation-engine.ts`)**:
  - Deterministic, seed-reproducible generation across all 11 modalities (`image`, `video`, `3d`, `audio`, `text`, `texture`, `skybox`, `upscale`, `remove-bg`, `vectorize`, `pixelate`).
  - Produces rich SVG/PNG artwork, animated multi-frame video previews, downloadable Wavefront `.obj` / `.gltf` 3D geometry, playable RIFF PCM `.wav` audio files, seamless PBR texture maps (`Albedo`, `Normal`, `Height`, `Roughness`, `AO`), and 360° equirectangular skybox panoramas.
  - Enforces Project Quality Gate guardrails and deducts `OSCU` credits from `OscuBucket`.
- **Topological Workflow DAG Engine (`src/lib/workflow-engine.ts`)**:
  - Executes all 16 Scenario node types (`text`, `asset`, `model`, `llm`, `modelInput`, `aspectRatio`, `transformText`, `splitText`, `joinTexts`, `ifElse`, `forEach`, `forEachEnd`, `groupItems`, `sliceAssets`, `approval`, `stickyNote`), handles approval pauses/resumes, and tracks node-by-node telemetry.

### Phase 5: Frontend Studios, Editors & Responsive UI
- **Marketing & Auth UI**: `/` (hybrid marketing landing page + authenticated dashboard), `/login` (split-screen Scenario login), `/register` (invite-only sign-up with live code verification badge).
- **Workspace Shell (`src/components/layout/ScenarioShell.tsx`)**:
  - `56px` dark top navigation bar with Scenario `S` monogram, `Organization > Project` switcher modal, center navigation (`Home`, `Create ▾` 4-column mega-menu, `Assets ▾`, `Models ▾`, `Workflows ▾`, `More ▾`), `⌘K` Global Search Command Palette, Notifications popover, Active Jobs drawer, AI Assistant Spark (`✦`) drawer, User Profile menu, and floating `What's New` changelog drawer.
- **Studios & Pages**:
  - `/create`: Full 11-mode Creation & Edit Studio with 3D interactive wireframe/shaded mesh viewer, 360° interactive skybox viewer, PBR seamless 2×2 tiling inspector, playable audio waveform player, Before/After upscale slider, and AI Prompt Spark (`✦`).
  - `/canvas` & `/canvas/[id]`: HTML5 Infinite Canvas with movable Generation Frame, brush/sketch/mask/eraser tools, layer stack, undo/redo, and Live Sketch-to-Image synthesis.
  - `/workflows`, `/workflows/[id]`, `/apps`: Workflows Library, interactive Node Graph Editor (16 node types, port wiring, JSON export/import, live DAG execution), and Workflow Apps Form Runner.
  - `/models`, `/models/trainings`, `/compose/new`: Models Hub, Custom LoRA Training Wizard with dataset captioning & quality scorer, and Compose a Model multi-LoRA weight blender.
  - `/assets`, `/collections`, `/explore`, `/pricing`, `/settings/[section]`: Asset Hub (with 9-icon modality dock and Trash recovery), Collections, Community Explore with Remix, OSCU Billing & Plans, and Organization/Project/Security/Invite Admin Settings.

### Phase 6: Verification, Automated Tests & Playwright E2E Suite
- Unit tests (`tests/unit/*.test.ts`) verifying invite-only admission, single-use concurrency/atomic consumption, expiration, revocation, rotation, multi-modal synthesis, guardrails, and topological workflow DAG execution.
- Production build (`npm run build`) and lint verification.
- End-to-end Playwright suite (`tests/e2e/scenario.spec.ts`) exercising invite-only registration, login, multi-modal generation, model composition, LoRA training, infinite canvas, workflow execution, asset hub, and admin invite governance.

---

## 2. Prioritized Task Backlog

| ID | Epic | Task Title | Priority | Status |
|---|---|---|---|---|
| `BL-01` | Exploration | Playwright exploration of `scenario.com` & `app.scenario.com` (35 screenshots) | P0 | Done |
| `BL-02` | Docs | Author ADR, PRD, Tech Spec, Data Model, Backlog, Parity & Invite Spec | P0 | In Progress |
| `BL-03` | Database | Dual Prisma 7 setup (SQLite local + PostgreSQL prod) & migrations | P0 | Pending |
| `BL-04` | Security | Invite-only admission service, single-use/expiring codes, revocation, audit logs | P0 | Pending |
| `BL-05` | Security | CLI admin bootstrap script (`scripts/bootstrap-admin.ts`) & NextAuth JWT RBAC | P0 | Pending |
| `BL-06` | Engine | Deterministic Multi-Modal Synthesis Engine (11 modes + PBR/3D/Audio/Video) | P0 | Pending |
| `BL-07` | Engine | Topological 16-node Workflow DAG Execution Engine & App Runner | P0 | Pending |
| `BL-08` | UI Shell | Scenario Dark Top Nav, Create 4-Column Mega-Menu, Command Palette & AI Spark | P0 | Pending |
| `BL-09` | Studio | `/create` Studio (Images, Videos, 3D, Audio, Text, Textures, Skyboxes, Edit tools) | P0 | Pending |
| `BL-10` | Canvas | `/canvas/[id]` Infinite Canvas Editor with Sketch, Mask, Layers & Live Mode | P0 | Pending |
| `BL-11` | Models | `/models`, `/models/trainings` LoRA Trainer, and `/compose/new` LoRA Blender | P0 | Pending |
| `BL-12` | Workflows | `/workflows`, `/workflows/[id]` Visual Node Editor, and `/apps` Gallery | P0 | Pending |
| `BL-13` | Assets | `/assets` 9-Modality Hub, `/collections`, and `/explore` Remix Gallery | P0 | Pending |
| `BL-14` | Settings | `/settings/*` Org, Project Guardrails, OSCU Billing, API Keys, Webhooks & Invites | P0 | Pending |
| `BL-15` | QA | Vitest unit tests + Playwright E2E test suite + production build validation | P0 | Pending |
