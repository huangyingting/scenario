# Scenario (`scenario.com` & `app.scenario.com`) — Reverse-Engineering, Playwright Exploration & Feature Architecture Design Report

## 1. Executive Summary

This report documents the comprehensive Playwright exploration, bundle reverse-engineering, live API schema inspection (`https://api.cloud.scenario.com/v1`), and UI/UX design analysis of **Scenario** (`https://www.scenario.com/` and `https://app.scenario.com/`).

Scenario is an enterprise-grade, multi-modal AI game asset and creative production platform enabling studios and solo developers to:
1. **Generate** style-consistent 2D Images, Videos, 3D Meshes (GLB/FBX/OBJ/USDZ), PBR Tileable Textures, 360° Equirectangular Skyboxes, Audio (TTS, SFX, Music, Voice Clone, Lip Sync), and Text/Vision outputs.
2. **Edit & Refine** assets on an **Infinite Canvas** (`Sketch-to-Image`, `Inpainting`, `Outpainting/Expand`, `Live Real-Time Mode`) or with specialized post-processing pipelines (`Topaz Upscale/Enhance`, `PhotoRoom Remove Background`, `Vectorize SVG`, `Pixelate`, `3D Retexture`).
3. **Train & Compose Custom Models**: Train custom LoRA/style/character/concept models with automated dataset captioning and scoring, or blend up to 5 compatible LoRAs in **Compose a Model** (`/compose/new`) with granular weight sliders (`0.00–1.00`).
4. **Automate with Node-Based Workflows & Workflow Apps**: Author directed acyclic graphs (DAGs) across 16 node types in a ReactFlow canvas (`/workflows/[id]`) and publish one-click form runners (`/apps`) for non-technical team members.
5. **Govern Organizations, Projects & Compute Units (OSCU)**: Manage multi-tenant Organizations (`Teams`), isolated `Projects`, role-based access control (`admin`, `editor`, `reader`), Quality Gate / Brand Guardrails, Webhooks, API Keys, and On-Demand Scenario Compute Units (`OSCU`).

---

## 2. Playwright Exploration Coverage & Screenshot Inventory

All 75 high-resolution Playwright screenshots (`01` through `72` plus early authentication probes) were captured in `/home/azadmin/scenario/screenshots/` across both desktop (`1440×900`) and mobile (`390×844`) viewports:

| # | Screenshot File | Target URL / Route | Observed UI & Behavioral Details |
|---|---|---|---|
| 01 | `01-marketing-home-desktop.png` | `https://www.scenario.com/` | Marketing hero ("Control Consistency Scale"), multi-modal showcase (Images, 3D, Video, Audio, Custom Models, Workflows), enterprise studio logos, dark glassmorphic cards |
| 02 | `02-marketing-home-mobile.png` | `https://www.scenario.com/` (`390×844`) | Responsive mobile header with hamburger drawer, stacked feature cards, mobile CTA |
| 03 | `03-app-login-desktop.png` | `https://app.scenario.com/login` | Split-screen dark login layout: left auth panel (`Continue with Google`, `Discord`, `Apple`, `Email`), right rotating artwork showcase |
| 04 | `04-app-login-email-step.png` | `https://app.scenario.com/login` | Email address entry state with client-side validation |
| 05 | `05-app-login-otp-step.png` | `https://app.scenario.com/login/factor-one` | 6-digit OTP verification input state with resend countdown |
| 06 | `06-app-post-otp-onboarding.png` | `https://app.scenario.com/onboarding` | Post-auth workspace initialization & onboarding state |
| 07 | `07-app-home-dashboard.png` | `https://app.scenario.com/` | Authenticated Home Dashboard: Top nav bar (`56px`), "What do you want to make?" hero prompt bar with `+`, model pill (`Gemini 3.1`), aspect ratio (`1:1`), `↑` submit, quick-action chips (`Create an image`, `Generate a video`, `Train a model`, `Explore all tools`), and promotional feature carousel ("Previs to Picture") |
| 08 | `08-app-home-tools-and-workflows.png` | `https://app.scenario.com/` (scrolled `850px`) | **Tools** horizontal dock (`Images`, `Video`, `3D`, `Audio`, `Enhance`, `Remove Background`, `Canvas`, `Textures`, `Skyboxes`), **Workflows** filterable tabs (`All`, `Get Started`, `Characters`, `Environments`, `Props`, `Post-Processing`, `Video & Animation`, `Game Art`, `3D & Worldbuilding`), workflow cards with Before/After split previews |
| 09 | `09-app-home-models-and-community.png` | `https://app.scenario.com/` (scrolled `1750px`) | Featured Models & Community Explore feed on dashboard |
| 10 | `10-app-nav-create-dropdown.png` | `https://app.scenario.com/` (`Create ▾` menu) | **Create Mega-Menu** with 4 columns: **GENERATE** (`Images`, `Videos`, `3D`, `Audio`, `Text`, `Skyboxes`, `Textures`), **EDIT** (`Upscale`, `Remove Background`, `Canvas`, `Pixelate`, `Vectorize`), **AUTOMATE** (`Workflows`, `Workflow Apps`), **TRAIN** (`Model Training`, `Compose a Model`) |
| 11 | `11-app-create-image-studio.png` | `/create?mode=image` | Left `380px` generation dock (`Images ▾`, `Select a Model`, `Prompt` with AI Spark `✦`, aspect ratio, sample count, steps, guidance, seed, `Generate` CTA); Right asset feed with search, filters, zoom slider, date headers |
| 12 | `12-app-create-video-studio.png` | `/create?mode=video` | Video Studio (`Videos ▾`, `Seedance 2.5` / `Kling V4` / `Veo 3.1`, start/end frame upload, duration `5s–30s`, resolution `720p/1080p/4K`, camera motion, audio toggle) |
| 13 | `13-app-create-3d-studio.png` | `/create?mode=3d` | 3D Studio (`3D ▾`, `Hunyuan3D` / `Tripo 3D` / `Trellis`, input image/prompt, output format `GLB/FBX/OBJ/USDZ`, PBR maps toggle, target polycount) |
| 14 | `14-app-create-audio-studio.png` | `/create?mode=audio` | Audio Studio (`Audio ▾`, sub-modes: `Text to Speech`, `Music`, `Sound Effects`, `Voice Clone`, `Lip Sync`, duration, voice/style selector, waveform player) |
| 15 | `15-app-create-text-studio.png` | `/create?mode=text` | Text & Vision LLM Studio (`Text ▾`, multimodal attachment for image/video/audio analysis, system prompt, temperature, token limit, structured markdown response) |
| 16 | `16-app-create-textures-studio.png` | `/create?modelId=model_scenario-texture` | Seamless PBR Texture Generator (`Scenario Texture`, seamless tiling check, PBR map generation: Albedo, Normal, Height, Roughness, Metallic, AO) |
| 17 | `17-app-create-skyboxes-studio.png` | `/create?modelId=model_scenario-skybox-gpt` | 360° Equirectangular Skybox Studio (`Scenario Skybox`, 360° panorama preview, HDRI/equirectangular export) |
| 18 | `18-app-edit-upscale-enhance.png` | `/create?modelId=model_topaz-image-upscale` | Enhance & Upscale Studio (`Topaz Image Upscale`, `2x/4x` scale factor, creativity/sharpen/denoise sliders, before/after comparison slider) |
| 19 | `19-app-edit-remove-background.png` | `/create?modelId=model_photoroom-background-removal` | Background Removal Studio (`PhotoRoom Background Removal`, alpha matting mode, transparent checkerboard preview) |
| 20 | `20-app-canvas-editor.png` | `/canvas/new` | Infinite Canvas Editor: top bar (`Untitled`, `Export`, `Settings`), left floating tool rail (`Select`, `Generation Frame`, `Pan`, `Upload`, `Brush`, `Inpaint Mask`, `Eraser`, `Color`, `Layers`, `Undo/Redo`, `100%`), bottom floating prompt bar + `Live` toggle |
| 21 | `21-app-workflows-library.png` | `/workflows` | Workflows Library: Hero banner ("Turn Complex Processes Into Reusable Workflows"), `New Workflow` CTA, category filter pills, search, `Your Workflows` & `Scenario Templates` grids |
| 22 | `22-app-workflow-apps-gallery.png` | `/apps` | Workflow Apps Gallery ("Skip the Graph, Keep the Power"), Before/After split cards (`Swap Character`, `Remove Objects`, `Relight Scene`, `Make Game Ready`) |
| 23 | `23-app-workflow-node-editor.png` | `/workflows/new` | Visual Node Editor: Top bar (`× New Workflow`, `🚀 Edit App`, `▷ Run`, `⋯`), dotted dark canvas, `Text 1` node (blue top accent, character counter, output port), `Image Generator 1` node (green top accent, model selector `GPT Image 2.5 Flare`, output port), right floating toolbar (`NEW ✦`, `+`, `↖`, `✋`, `↶`, `↷`, `⊕`, `⊖`) |
| 24 | `24-app-models-library.png` | `/models` | Models Hub ("Every Model You Need, In One Place"), `+ New Model` button, tabs (`All Models`, `Your Models`, `Public Models`, `Base Models`, `LoRA Models`), category chips (`Characters`, `Environments`, `Isometric`, `Pixel Art`, `UI & Icons`, `Textures`, `3D`, `Video`), model cards with privacy badge (`Public`/`Private`) |
| 25 | `25-app-model-trainings.png` | `/models/trainings` | Model Trainings ("Lock In Your Style — Train A Model"), `Start Training` & `How it works` buttons, sort selector, training jobs list / empty state |
| 26 | `26-app-model-compose.png` | `/compose/new` | Compose a Model ("Create Distinct Styles by Combining Models"): Left composition builder (`Name`, `Base Model`, `Model Components` up to 5 LoRAs with weights, `Test`, `Save Composition`); Right model browser (`Style`, `Subject`, `Theme`, `Asset Category`) |
| 27 | `27-app-assets-library.png` | `/assets` | Asset Hub ("All your generated content, in one place"), `+ Create`, `↑ Upload ▾`, 9-icon modality dock (`Image`, `Video`, `3D`, `Audio`, `Text`, `Skybox`, `Texture`, `Canvas`, `Trash`), filter pills (`All`, `Date`, `Tags`, `Models`, `Collection`), zoom slider, asset grid with modality badges (`Txt2Img`, `Img23d`, `Upscale`) |
| 28 | `28-app-collections.png` | `/collections` | Collections page: `+ New Collection` button, search bar, zoom slider, sort dropdown, collection cards |
| 29 | `29-app-explore-community.png` | `/explore` | Community Explore ("Explore. Remix. Create. Ready-to-use models and assets across every medium."), modality dock, tag/model filters, remixable community gallery |
| 30 | `30-app-pricing-plans.png` | `/pricing` | Organization Billing & Plans overview (`Pro`, `$60/month`, `10 seats`, `15,250` Compute Units Available across buckets, Monthly allowance progress bar, Auto-Refill setup, `Buy compute units`) |
| 31 | `31-app-settings-user-profile.png` | `/settings/user-profile` | Settings sidebar (`ORGANIZATION`, `PROJECT`, `YOU`) + User Profile (`Profile picture`, `Email address`) + floating `What's New` changelog drawer |
| 32 | `32-app-settings-organization.png` | `/settings/organization-general` | Organization General settings (`Organization Logo`, `Organization Name`, `Organization ID` with `Copy` button, Scenario SDK docs link) |
| 33 | `33-app-settings-plans-billing.png` | `/settings/organization-plans` | Organization Billing, Compute Units buckets, Auto-Refill, and Usage Alerts |
| 34 | `34-app-mobile-dashboard.png` | `/` (`390×844`) | Mobile responsive dashboard with compact top bar, collapsible drawer icon, mobile hero prompt box |
| 35 | `35-app-mobile-create-studio.png` | `/create?mode=image` (`390×844`) | Mobile Create Studio with full-width stacked parameter controls and sticky bottom `Generate` button |
| 36 | `36-app-nav-assets-dropdown.png` | `/` (`Assets ▾` menu) | Top navigation `Assets ▾` dropdown (`My Assets`, `Collections`, `Upload`) |
| 37 | `37-app-nav-models-dropdown.png` | `/` (`Models ▾` menu) | Top navigation `Models ▾` dropdown (`Public Models`, `My Models`, `Train a Model`, `Compose a Model`) |
| 38 | `38-app-nav-workflows-dropdown.png` | `/` (`Workflows ▾` menu) | Top navigation `Workflows ▾` dropdown (`Workflows`, `Workflow Apps`, `Reviews`, `New Workflow`) |
| 39 | `39-app-nav-more-dropdown.png` | `/` (`More ▾` menu) | Top navigation `More ▾` dropdown (`Explore`, `Pricing`, `Documentation`, `Discord`, `API`) |
| 40 | `40-app-ai-agent-spark-drawer.png` | `/` (`✦` AI Agent drawer) | Global Scenario AI Agent drawer (`Claude Sonnet 4` / `GPT-5 Creative Agent`, conversation threads, standing instructions) |
| 41 | `41-app-create-world-studio.png` | `/create?mode=world` | **Create · World** Studio: 360° panorama skyboxes, skybox upscaling, and explorable 3D worlds as Gaussian splats (`model_scenario-skybox-gpt`) |
| 42 | `42-app-create-model-picker-modal.png` | `/create?mode=image` | **Model Picker Modal**: `Image \| Video \| Audio \| 3D \| World \| Text` mode tabs, `My models \| Scenario Models \| Third-Party Models`, `Capabilities` filter, `Sort by` |
| 43 | `43-app-edit-expand-reframe.png` | `/create?mode=image&modelId=model_scenario-gemini-reframe` | **Expand / Reframe** Studio (`Gemini 3.1 Flash Reframe`, `Target Aspect Ratio`, `Content Credential` toggle) |
| 44 | `44-app-edit-vectorize-svg.png` | `/create?modelId=model_visioncortex-vtracer` | **Vectorize** Studio (`model_visioncortex-vtracer`, raster-to-SVG vectorization) |
| 45 | `45-app-edit-pixelate.png` | `/create?modelId=model_sc-pixelate` | **Pixelate** Studio (`model_sc-pixelate`, `Image`, `Prompt`, `Pixel Grid Size` `2–64`, `Adapt Input Image` toggle) |
| 46 | `46-app-canvas-live-mode.png` | `/canvas/new?live=true` | **Infinite Canvas Live Mode** + floating bottom-left `What's New` release notes drawer (`Skills v0.60.1`, `MCP Server v0.36.0`, `Kling V4`) |
| 47 | `47-app-workflow-node-editor-clean.png` | `/workflows/new` | Clean **Visual Node Editor** (`Create your first node`, left node dock, bottom zoom/fit controls, right-hand **Workflow AI Agent** chat panel `Ask anything...` with `Claude Opus 4.7`) |
| 48 | `48-app-workflow-app-runner-modal.png` | `/apps/[id]` | **Workflow App Runner** executing a multi-step character turnaround & PBR workflow |
| 49 | `49-app-new-model-modal.png` | `/models/list?privacy=project` | **New Model 3-Card Modal**: `Train your own model` (`Start Training`), `Compose models` (`Start Composing`), and `Upload a model` (import `.safetensors`, `.zip`, `.gzip`, `.gz` from computer or HuggingFace / CivitAI URL) |
| 50 | `50-app-model-training-wizard.png` | `/models/trainings` | **Step 1: Choose a Model** Training Wizard (`IMAGE TRAINING`: `Flux 2`, `Flux 2 Edit`, `Qwen Image`, `Qwen Edit`, `Z-Image`, `Flux 1 Dev`, `Flux Kontext` + `AUDIO TRAINING` voice cloning) |
| 51 | `51-app-reviews-human-in-the-loop.png` | `/reviews` | **Reviews** page: Human-in-the-loop `Approval` and `Choose` selection pauses with `Author: Me ×` filter |
| 52 | `52-app-recent-tasks-monitor.png` | `/recent-tasks` | **Recent Tasks** page: Background job queue (`Generations`, `Edits`, `Enhancements`, `Model Trainings`, `Uploads/Downloads`, `Bulk Downloads`) with `Active` filter and `Refresh` button |
| 53 | `53-app-assets-canvases-tab.png` | `/assets?tab=canvas` | Asset Hub **Canvases** tab (`Level 1 Environment Concept Board`) + 9-icon modality bar |
| 54 | `54-app-assets-deleted-trash.png` | `/assets?tab=deleted` | Asset Hub **Recently Deleted** tab (30-day soft-delete retention window) |
| 55 | `55-app-models-deleted-trash.png` | `/models/list?privacy=project&tab=deleted` | Model Hub **Recently Deleted** tab (`Platform \| Project` switcher, 9 modality filters, 30-day retention) |
| 56 | `56-app-explore-asset-detail-modal.png` | `/explore/asset/[id]` | **Explore Asset Detail** page showing 3D mushroom house render, prompt, and `MODEL: Gemini 3.1` badge |
| 57 | `57-app-settings-org-members.png` | `/settings/organization-members` | **Organization · Members**: `Default usage limit` card, `+ Invite Members`, `Import CSV`, member CU usage bars (`1,850 / 25,000 CU`), `Invitation Pending` status |
| 58 | `58-app-settings-org-projects.png` | `/settings/organization-projects` | **Organization · Projects**: `+ New Project`, project table with `Members`, `Overrides`, and `Project Usage` progress bars (`3,100 / 25,000 CU`) |
| 59 | `59-app-settings-org-analytics.png` | `/settings/organization-analytics` | **Organization · Analytics**: `Analytics API key`, date range picker, `Usage breakdown` (`Model \| Category`, `Compute Units \| Jobs`), `Usage per model` |
| 60 | `60-app-settings-org-activity-trail.png` | `/settings/organization-activity-trail` | **Organization · Activity Trail**: Audit log search, date range, project/event filters, CSV export, `Hover to preview` inspector |
| 61 | `61-app-settings-org-models.png` | `/settings/organization-models` | **Organization · Models**: `Automatically enable new models`, `Display disabled models (admins only)`, `Disable All Models` / `Enable All Models`, model governance table |
| 62 | `62-app-settings-org-quality-gate.png` | `/settings/organization-quality-gate` | **Organization · Quality Gate**: Detect AI slop & verify generations against Brand Brief (`Run automatically`, `Brand brief`) |
| 63 | `63-app-settings-org-ip-detection.png` | `/settings/organization-ip-detection` | **Organization · IP Detection**: Screen jobs for IP matches (`Enforcement: Disabled / Fail open / Fail closed`, `Filters`) |
| 64 | `64-app-settings-org-watermark.png` | `/settings/organization-watermark` | **Organization · Watermark**: Apply organization/project watermark (`Tiled`, `Center`, `Top Left`, `Bottom Left`, etc.) to generated images and videos |
| 65 | `65-app-settings-org-external-keys.png` | `/settings/organization-external-keys` | **Organization · External Keys (BYOK)**: `OpenAI`, `Anthropic`, `Google Vertex AI` credentials with `External Cost + 50%` markup & `Minimum Post-Processing Fees` (`Image 1 CU`, `Video 5 CU`, `Audio 2 CU`, `3D 3 CU`, `Text 0.5 CU`) |
| 66 | `66-app-settings-org-agent.png` | `/settings/organization-agent` | **Organization · Agent**: Shared `Organization Instructions` + 3-level standing context (`Organization`, `Project`, `You` Instructions & Memory) |
| 67 | `67-app-settings-org-api-keys.png` | `/settings/organization-api-keys` | **Organization · API Keys**: `+ Add API Key`, usage progress bar (`420 / 10,000 CU`), plus `Explore Scenario MCP`, `Explore Scenario SDK`, and `Scenario API documentation` cards |
| 68 | `68-app-settings-org-webhooks.png` | `/settings/organization-webhooks` | **Organization & Project Webhooks**: Signed POST callbacks for job state changes and credit threshold alerts |
| 69 | `69-app-settings-org-compute-planner.png` | `/settings/organization-compute-planner` | **Organization · Compute Planner**: Interactive CU cost calculator across `Generate Image`, `Generate 3D`, `Generate Video`, `Generate Audio`, `Upscale`, `Training`, `Pixelization`, `Vectorization`, `Edit with prompts`, `Skybox` |
| 70 | `70-app-settings-project-visibility.png` | `/settings/project-visibility` | **Project · Visibility**: `Collaborative` ("Everyone can view and reuse all project assets") vs `Solo` ("Creators can access only their own assets; admins see all") |
| 71 | `71-app-settings-user-content-safety.png` | `/settings/user-content-safety` | **You · Content Safety**: Automatic NSFW screening + 11 toggleable hidden categories (`Alcohol`, `Drugs`, `Explicit Imagery`, `Gambling`, `Hate Symbols`, `Offensive Content`, `Non-Explicit Imagery`, `Swimwear/Underwear`, `Tobacco`, `Violence`, `Disturbing Imagery`) |
| 72 | `72-app-settings-user-file-naming.png` | `/settings/user-file-naming` | **You · File Naming**: Custom filename templates (`<description>-<id>.png`) for `Single Download` and `Bulk Download` with token chips (`description`, `id`, `seed`, `num`, `prompt`, `model`) |

---

## 3. Reverse-Engineered Client Architecture & API Specification

From the 73 client JavaScript chunks extracted from `app.scenario.com/_next/static/immutable/chunks/`:

### 3.1 Core Context Providers
- **`UserProvider` (chunk `413384`)**: Hydrates `/v1/me`, manages `currentTeamId`, `currentProjectId`, user onboarding state, and feature flags.
- **`TeamProjectProvider` (chunk `394215`)**: Fetches `/v1/teams` and `/v1/projects`, synchronizing URL query parameters (`?teamId=...&projectId=...`) with active workspace state and enforcing project-level role permissions (`admin`, `editor`, `reader`).
- **`LimitsProvider` (chunk `852010`)**: Polls `/v1/teams/{teamId}/limits` and `/v1/teams/{teamId}/subscriptions`, tracking available Compute Units (`OSCU`), seat counts, and concurrency limits (`maxConcurrentInferences`, `maxConcurrentTrainings`).

### 3.2 Workflow Node Graph Engine (chunk `246737` in `0qrdop2ctjxiv.js`)
The workflow editor uses a typed schema registry supporting 16 distinct node types:
1. `text` — Prompt / string literal node with character count and output handle.
2. `asset` — Media input node (upload or select existing image/video/3D/audio asset).
3. `model` — AI model execution node (supports `flux.1-dev`, `flux.1-pro`, `sdxl`, `gemini-3.1`, `seedance-2.5`, `kling-v4`, `hunyuan-3d`, `topaz-upscale`, `photoroom-remove-bg`, `scenario-texture`, `scenario-skybox`, etc.).
4. `llm` — Vision/Text LLM reasoning & prompt expansion node.
5. `modelInput` — Dynamic model reference node.
6. `aspectRatio` — Resolution & aspect ratio calculator node.
7. `transformText` — Regex/template string transformation node.
8. `splitText` — Delimiter-based text splitter producing array outputs.
9. `joinTexts` — Multi-input string concatenator.
10. `ifElse` — Conditional branching node.
11. `forEach` — Batch loop start node.
12. `forEachEnd` — Batch loop collector node.
13. `groupItems` — Array bundler node.
14. `sliceAssets` — Array pagination/slicing node.
15. `approval` — Human-in-the-loop quality gate / approval pause node.
16. `stickyNote` — Documentation & canvas annotation node.

### 3.3 REST API Surface (`/api/v1/*`)
- `GET / PATCH /api/v1/me` — Current authenticated user profile & active workspace pointers.
- `GET / POST / PATCH /api/v1/teams` — Organization management, members, limits, and OSCU buckets.
- `GET / POST / PATCH / DELETE /api/v1/projects` — Project isolation, quality gates, and webhooks.
- `GET / POST / PATCH / DELETE /api/v1/models` — Public, base, LoRA, and composed models.
- `GET / POST / PATCH /api/v1/trainings` — Custom model training jobs, dataset images, auto-captioning, and epoch checkpoints.
- `GET / POST / DELETE /api/v1/inferences` — Multi-modal generation jobs (`image`, `video`, `3d`, `audio`, `text`, `texture`, `skybox`, `upscale`, `remove-bg`, `vectorize`, `pixelate`).
- `GET / POST / PATCH / DELETE /api/v1/assets` — Unified Asset Hub with modality, tag, model, date, collection, and trash filtering.
- `GET / POST / PATCH / DELETE /api/v1/collections` — Curated asset collections and batch sharing.
- `GET / POST / PATCH / DELETE /api/v1/workflows` & `/api/v1/workflows/[id]/run` — DAG workflow persistence, topological execution engine, and Workflow App runner.
- `GET / POST / PATCH / DELETE /api/v1/canvases` — Infinite Canvas projects, multi-layer strokes, generation frames, and inpaint masks.
- `GET / POST / PATCH /api/v1/invitations` & `/api/auth/register` — Invite-only account admission, single-use/expiring invitation codes, revocation, and immutable security audit logs.
