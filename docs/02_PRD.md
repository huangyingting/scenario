# Product Requirements Document (PRD) — Scenario Platform

## 1. Product Vision & Scope

**Scenario** is an end-to-end AI creative production and game asset engineering platform built for game studios, creative teams, and technical artists. It unifies custom AI model training, multi-modal asset generation (2D, Video, 3D, Audio, Text, PBR Textures, 360° Skyboxes), an Infinite Canvas editor, a visual DAG Workflow builder, and enterprise workspace governance under an **invite-only admission model**.

### Strict Production Policy (No Dummy Data / No Demo Accounts)
- The database initializes with **zero pre-seeded demo users** and **zero fake user-generated galleries**.
- Account creation requires a valid, unrevoked, non-expired single-use or multi-use **Invitation Code** issued by an authorized administrator (or bootstrapped via the CLI admin provisioning tool `scripts/bootstrap-admin.ts`).
- Built-in system catalog entries (base AI model definitions, node type schemas, and starter workflow graph blueprints) are clearly separated from user-generated data; all user assets, custom trainings, compositions, collections, canvases, and workflow runs are genuinely created and persisted through user actions.

---

## 2. Target Personas

1. **Art Director / Technical Artist (`Workspace Admin` / `Editor`)**:
   - Trains custom style & character LoRA models, composes multi-LoRA style blends, configures Quality Gate brand guardrails, and builds node workflows for the studio.
2. **Production Artist / Game Designer (`Workspace Editor`)**:
   - Generates 2D concepts, sprites, seamless PBR textures, 360° skyboxes, 3D meshes, and sound effects; refines assets on the Infinite Canvas; runs published Workflow Apps.
3. **Reviewer / Producer (`Workspace Reader`)**:
   - Browses the Asset Hub and Collections, inspects generation provenance, and approves or rejects paused `approval` nodes in workflow runs.
4. **Platform Security Administrator (`ADMIN` / `SUPER_ADMIN`)**:
   - Issues, rotates, and revokes single-use/expiring invitation codes, assigns system roles, manages user lifecycle status (`ACTIVE`, `SUSPENDED`), and audits security logs.

---

## 3. Functional Requirements

### FR-1: Invite-Only Authentication, RBAC & Account Governance
- **FR-1.1**: Users can sign in at `/login` with email + password (plus optional 6-digit verification challenge flow).
- **FR-1.2**: Users can register at `/register` **only** by supplying a valid invitation code (`SCEN-XXXX-XXXX-XXXX`), email, display name, and strong password.
- **FR-1.3**: Invitation codes enforce single-use (`maxUses = 1`) or bounded multi-use limits, optional email binding (`boundEmail`), expiration timestamps (`expiresAt`), immediate revocation (`REVOKED`), and code rotation.
- **FR-1.4**: Every registration, login, failed invite check, code issuance, rotation, revocation, and role change writes an immutable audit log entry.
- **FR-1.5**: System administrators can manage invitations and audit trails in `/settings/invitations` (and `/admin/invitations`).

### FR-2: Multi-Tenant Organizations, Projects & Compute Units (OSCU)
- **FR-2.1**: Every authenticated user has an active Organization (`Team`) and `Project` context displayed in the top breadcrumb selector (`Organization > Project`).
- **FR-2.2**: Users can create additional Projects, switch between Projects, manage Project privacy (`private` / `workspace`), and configure Project Quality Gate guardrails (banned terms, required style tags, minimum resolution).
- **FR-2.3**: Organizations track Compute Units (`OSCU`) across allowance and top-up buckets. Every inference job, model training, or workflow run calculates and deducts its exact `OSCU` cost and records an `OscuTransaction`.

### FR-3: Multi-Modal Creation & Post-Processing Studio (`/create`)
- **FR-3.1**: Unified studio interface with left `380px` parameter dock and right chronological/filterable asset viewport.
- **FR-3.2**: Supports 7 generation modes:
  - **Images** (`mode=image`): Model selector, prompt, negative prompt, AI Prompt Spark enhancer (`✦`), reference image upload & influence strength, aspect ratio (`1:1`, `16:9`, `9:16`, `4:3`, `3:4`), sample count (`1–8`), inference steps (`10–50`), guidance scale (`1.0–15.0`), seed.
  - **Videos** (`mode=video`): Duration (`5s`, `10s`, `15s`, `30s`), resolution (`720p`, `1080p`, `4K`), camera motion (`Static`, `Pan`, `Orbit`, `Zoom In`, `Crane`), frame rate (`24fps`, `30fps`, `60fps`), native audio toggle, start/end frame reference.
  - **3D** (`mode=3d`): Output format (`GLB`, `FBX`, `OBJ`, `USDZ`), texture resolution (`1K`, `2K`, `4K`), PBR maps toggle (`Albedo`, `Normal`, `Metallic`, `Roughness`), target polycount (`Low 5k`, `Medium 25k`, `High 100k`, `Quad Remesh`), interactive 3D mesh wireframe/shaded viewer & `.obj`/`.gltf` download.
  - **Audio** (`mode=audio`): Sub-modes (`Text to Speech`, `Sound Effects`, `Music`, `Voice Clone`, `Lip Sync`), voice/instrument preset, duration, real playable `.wav` audio synthesis & waveform visualizer.
  - **Text** (`mode=text`): Vision/Text assistant with system instructions, temperature, max tokens, and structured output copy/export.
  - **Textures** (`mode=texture` / `model_scenario-texture`): Seamless tiling toggle (`X/Y Repeat`), 2×2 tiled preview mode, and full PBR map channel generation (`Albedo`, `Normal`, `Height`, `Roughness`, `AO`).
  - **Skyboxes** (`mode=skybox` / `model_scenario-skybox-gpt`): 360° equirectangular panorama synthesis with interactive 360° pan/yaw preview viewer.
- **FR-3.3**: Supports 4 specialized Edit modes:
  - **Upscale & Enhance** (`mode=upscale`): `2x` / `4x` scale factor, detail/creativity/denoise sliders, interactive Before/After split comparison slider.
  - **Remove Background** (`mode=remove-bg`): Alpha subject isolation with transparent checkerboard preview.
  - **Vectorize** (`mode=vectorize`): Converts raster/concept assets into clean multi-path scalable `.svg` vector files.
  - **Pixelate** (`mode=pixelate`): Converts assets into palette-quantized (`8-bit`, `16-bit`, `32-bit`) crisp pixel art grids.

### FR-4: Infinite Canvas Editor (`/canvas`, `/canvas/[id]`)
- **FR-4.1**: Interactive HTML5/SVG Infinite Canvas with pan, zoom (`25%–400%`), movable **Bounding Generation Frame**, freehand brush/sketch layers, inpaint mask painting, eraser, color picker, text layer, image upload, undo/redo history stack, and **Live Real-Time Sketch-to-Image** generation inside the active bounding frame.
- **FR-4.2**: Canvas state persists to the database (`CanvasProject`) and exports composite PNG/SVG assets directly to the Asset Hub.

### FR-5: Models Hub, LoRA Training & Model Composition (`/models`, `/models/trainings`, `/compose/new`)
- **FR-5.1**: Browse system base models (`FLUX.1 Dev`, `Gemini 3.1`, `Seedance 2.5`, `Kling V4`, `Hunyuan3D 2.5`, `Scenario Texture`, `Scenario Skybox`, `Topaz Upscale`, `PhotoRoom BG Removal`) and custom project models.
- **FR-5.2**: **Train A Model** (`/models/trainings`): Create custom training jobs with training class (`Style`, `Character`, `Prop/Object`, `Environment`, `UI/Icon`), base model, trigger token, epochs/learning rate, dataset captioning & quality score analyzer, and epoch checkpoint progression.
- **FR-5.3**: **Compose a Model** (`/compose/new`): Combine a base model with up to 5 compatible LoRA components using weight sliders (`0.00–1.00`), run a live test generation, and save the composed model for immediate use in `/create` and `/workflows`.

### FR-6: Visual Node-Based Workflows & Workflow Apps (`/workflows`, `/workflows/[id]`, `/apps`)
- **FR-6.1**: Visual DAG editor supporting all 16 Scenario node types (`text`, `asset`, `model`, `llm`, `modelInput`, `aspectRatio`, `transformText`, `splitText`, `joinTexts`, `ifElse`, `forEach`, `forEachEnd`, `groupItems`, `sliceAssets`, `approval`, `stickyNote`).
- **FR-6.2**: Users can add/delete/drag nodes, wire edges between ports, edit node parameters, export/import workflow JSON, execute the graph (`▷ Run`) with live node status indicators, and publish the workflow as a simplified **Workflow App** (`/apps`) with customizable input fields.

### FR-7: Asset Hub, Collections & Explore (`/assets`, `/collections`, `/explore`)
- **FR-7.1**: Unified **Asset Hub** with the 9-icon modality bar (`Image`, `Video`, `3D`, `Audio`, `Text`, `Skybox`, `Texture`, `Canvas`, `Trash`), search by prompt, tag/model/collection filters, grid zoom slider, batch selection, soft-delete/restore from Trash, and asset detail drawer (with one-click `Upscale`, `Remove BG`, `Send to Canvas`, `Add to Collection`, `Download`).
- **FR-7.2**: **Collections** management to group assets into named boards and share or export manifests.
- **FR-7.3**: **Explore** gallery displaying public remixable assets (`publishedToExplore = true`) with one-click `Remix in Studio`.
