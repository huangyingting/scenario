# Acceptance Criteria & Feature Parity Matrix — Scenario Platform

## 1. Core Acceptance Criteria

### AC-1: Zero Dummy Data & Strict Invite-Only Admission
- [x] Fresh database migration contains **0 pre-seeded user accounts** and **0 fake user-generated assets**.
- [x] Attempting `POST /api/auth/register` without an invitation code, or with an invalid, expired, revoked, or already-consumed single-use code returns HTTP `400`/`403` and logs a `REJECTED` event in `InvitationAuditLog`.
- [x] Provisioning an administrator via `npx tsx scripts/bootstrap-admin.ts` creates a real `SUPER_ADMIN` user and can issue single-use/expiring invitation codes.
- [x] Redeeming a valid single-use invitation code atomically creates the user, marks the code `CONSUMED` (`usedCount = 1`), provisions the user's Organization, default Project, and `15,000 OSCU` allowance bucket, and prevents any second redemption.

### AC-2: Navigation, Workspace Shell & Responsive Parity
- [x] Top navigation bar (`56px`) renders the Scenario `S` monogram, `Organization > Project` breadcrumb switcher, center links (`Home`, `Create ▾`, `Assets ▾`, `Models ▾`, `Workflows ▾`, `More ▾`), `⌘K` search, notifications, active jobs, AI Assistant Spark (`✦`), and user avatar menu.
- [x] `Create ▾` dropdown opens the 4-column mega-menu (**GENERATE**, **EDIT**, **AUTOMATE**, **TRAIN**).
- [x] Floating bottom-left `What's New` release notes widget can be toggled open and closed.
- [x] All pages adapt cleanly to mobile (`390×844`) and desktop (`1440×900`) viewports.

### AC-3: Multi-Modal Creation & Post-Processing Studio (`/create`)
- [x] Left `380px` control dock switches seamlessly between `Images`, `Videos`, `3D`, `Audio`, `Text`, `Textures`, `Skyboxes`, `Upscale`, `Remove Background`, `Vectorize`, and `Pixelate`.
- [x] Clicking `Generate` validates Project Quality Gate guardrails, deducts `OSCU` credits from the active bucket, creates a real `InferenceJob` and `Asset` rows in Prisma, and immediately renders the generated outputs in the right viewport.
- [x] **3D Mode** produces a downloadable `.obj` / `.gltf` 3D mesh with interactive 3D rotation preview.
- [x] **Audio Mode** synthesizes a real playable `.wav` audio buffer with waveform visualization.
- [x] **Textures Mode** generates seamless tileable textures with `Albedo`, `Normal`, `Height`, `Roughness`, and `AO` channel inspection and 2×2 seamless tiling preview.
- [x] **Skyboxes Mode** generates a 360° equirectangular panorama with interactive 360° pan/yaw viewer.

### AC-4: Infinite Canvas Editor (`/canvas/[id]`)
- [x] Supports tool switching (`Select`, `Generation Frame`, `Pan`, `Upload`, `Brush`, `Inpaint Mask`, `Eraser`, `Text`), color & brush size selection, layer visibility/locking, undo/redo, zoom controls, and `Live` real-time generation inside the bounding frame.
- [x] Saves canvas state to Prisma (`CanvasProject`) and exports composite assets to the Asset Hub.

### AC-5: Models Hub, LoRA Trainings & Model Composition (`/models`, `/models/trainings`, `/compose/new`)
- [x] `/models` filters across `All Models`, `Your Models`, `Public Models`, `Base Models`, `LoRA Models`, and `Composed Models` plus category chips.
- [x] `/models/trainings` allows creating a custom LoRA training job with dataset upload/builder, auto-captioning, dataset quality score calculation, epoch progression, and automatic registration of the trained model.
- [x] `/compose/new` allows selecting a Base Model, adding up to 5 LoRA components with weight sliders (`0.00–1.00`), running a test preview, and saving the composed model.

### AC-6: Visual Workflows & Workflow Apps (`/workflows`, `/workflows/[id]`, `/apps`)
- [x] `/workflows/[id]` renders the dark dotted node canvas with node palette (all 16 Scenario node types), interactive node dragging, port connection wiring, node inspector, JSON export/import, `🚀 Edit App` configuration, and `▷ Run` topological execution.
- [x] `/apps` displays published Workflow Apps with Before/After split previews and runs them via a simplified input form.

### AC-7: Asset Hub, Collections, Explore & Settings (`/assets`, `/collections`, `/explore`, `/settings/*`)
- [x] `/assets` features the 9-icon modality dock (`Image`, `Video`, `3D`, `Audio`, `Text`, `Skybox`, `Texture`, `Canvas`, `Trash`), search, filters, zoom slider, soft-delete to Trash, restore, and permanent delete.
- [x] `/collections` allows creating collections and adding/removing assets.
- [x] `/explore` showcases published assets with one-click `Remix` into `/create`.
- [x] `/settings/*` provides Organization General, Members, Projects, Plans/OSCU Billing (with buckets & auto-refill), Project Quality Gate Guardrails, API Keys, Webhooks, Invite-Only Administration, and Security Audit Logs.

---

## 2. Feature Parity Matrix (`scenario.com` / `app.scenario.com` vs. Implementation)

| Feature Domain | Original Scenario (`app.scenario.com`) | Our Production Implementation | Status |
|---|---|---|---|
| Marketing Landing Page | Hero, multi-modal showcase, workflows, enterprise cards | Full parity at `/` for unauthenticated visitors | 100% Parity |
| Authentication & Admission | Clerk Auth + OTP + Workspace Onboarding | NextAuth v4 JWT + Invite-Only Single-Use/Expiring Codes + RBAC + Audit Logs | Enhanced Security |
| Home Dashboard | "What do you want to make?" prompt bar, Tools dock, Workflows & Models feeds | Full parity with live prompt routing & tool shortcuts | 100% Parity |
| Top Nav & Create Mega-Menu | 4-column `GENERATE`, `EDIT`, `AUTOMATE`, `TRAIN` dropdown + Org/Project switcher | Full parity (`ScenarioShell.tsx`) | 100% Parity |
| Image Studio (`/create?mode=image`) | Left `380px` dock, model selector, prompt spark, aspect ratio, steps, guidance, seed | Full parity + real deterministic synthesis & DB persistence | 100% Parity |
| Video Studio (`/create?mode=video`) | Duration, resolution, camera motion, FPS, audio toggle, start/end frame | Full parity + multi-frame animated SVG/video synthesis | 100% Parity |
| 3D Studio (`/create?mode=3d`) | GLB/FBX/OBJ/USDZ format, PBR maps, polycount, 3D preview | Full parity + interactive 3D viewer & `.obj`/`.gltf` export | 100% Parity |
| Audio Studio (`/create?mode=audio`) | TTS, Music, SFX, Voice Clone, Lip Sync, waveform player | Full parity + real playable RIFF PCM `.wav` synthesizer | 100% Parity |
| Text Studio (`/create?mode=text`) | Multimodal prompt + system instructions + structured output | Full parity | 100% Parity |
| PBR Textures, 360° Skyboxes & 3D Worlds (`/create?mode=world`) | Seamless tiling + PBR maps + 360° skybox & Gaussian Splat 3D world generation | Full parity with interactive 2×2 tiling, 360° panorama viewer & Gaussian splat world mode | 100% Parity |
| Edit Tools (Upscale, Expand/Reframe, Remove BG, Vectorize, Pixelate) | Before/After slider, Gemini 3.1 Flash Reframe, alpha extraction, SVG vectorization, pixel art quantization | Full parity | 100% Parity |
| Infinite Canvas (`/canvas/[id]`) | Bounding frame, brush, inpaint mask, eraser, layers, undo/redo, Live mode | Full parity with persistent multi-layer HTML5 canvas | 100% Parity |
| Visual Workflow Editor (`/workflows/[id]`) | 16 node types, port edges, topological runner, `Edit App`, integrated **Workflow AI Agent** (`Claude Opus 4.7`) | Full parity | 100% Parity |
| Workflow Apps (`/apps`) & Human-in-the-Loop Reviews (`/reviews`) | Before/After cards + simplified form runner + Approval/Choose workflow pauses (`/reviews`) | Full parity | 100% Parity |
| Recent Tasks Monitor (`/recent-tasks`) | Real-time queue for generations, trainings, enhancements, uploads & bulk downloads with `Active` filter | Full parity | 100% Parity |
| LoRA Training, Compose & Model Upload (`/models`, `/models/list`, `/models/trainings`, `/compose/new`) | `New Model` 3-card modal (`Train`, `Compose`, `Upload .safetensors`), 30-day `Recently Deleted` models, 5-LoRA weight composition | Full parity | 100% Parity |
| Asset Hub (`/assets`) & Collections (`/collections`) | 9-modality icon bar (`Image`, `Video`, `3D`, `Audio`, `Text`, `World`, `Texture`, `Canvas`, `Recently Deleted`), filters, collections | Full parity | 100% Parity |
| Enterprise, Project & User Settings (`/settings/*`) | 3-scope settings (`Organization`, `Project`, `You`): Members, Projects, Analytics, Activity Trail, Models Allowlist, Quality Gate, IP Detection, Watermark, External Keys (BYOK), AI Agent Instructions/Memory, API Keys & MCP/SDK, Webhooks, Compute Planner, Project Visibility (`Collaborative` vs `Solo`), Content Safety (11 NSFW categories), File Naming templates, plus Invite-Only Governance | Full parity + Invite-Only Governance & Audit Logs | 100% Parity |
