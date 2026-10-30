# Technical Specification — Scenario Platform

## 1. Technology Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Authentication**: NextAuth.js v4 (`next-auth`) with JWT strategy + custom Invite-Only Admission Service
- **ORM & Databases**:
  - **Prisma 7** (`@prisma/client`)
  - **Local Development / E2E**: SQLite (`better-sqlite3` + `@prisma/adapter-better-sqlite3`) via `prisma/schema.prisma`
  - **Production**: PostgreSQL (`pg` + `@prisma/adapter-pg`) via `prisma/schema.postgresql.prisma`
- **Styling & UI**: Tailwind CSS v4 + Scenario Dark Design System (`#0b0b0c` canvas, `#141417` panels, `#26262b` borders, `#0099ff` electric blue accent) + Lucide icons
- **Testing**: Vitest (unit & integration tests) + Playwright (end-to-end browser verification)

---

## 2. Application Route Map

### 2.1 Public & Authentication Routes
| Route | Description | Auth Policy |
|---|---|---|
| `/` | Marketing Landing Page (when unauthenticated) OR Authenticated Home Dashboard (when signed in, matching `scenario.com` + `app.scenario.com`) | Public / Hybrid |
| `/login` | Split-screen Scenario Sign-In page with email/password + optional 2FA OTP step | Public (redirects if authenticated) |
| `/register` | Invite-Only Registration page with live Invitation Code validation (`GET /api/v1/invitations/validate`) | Public (requires valid Invite Code) |

### 2.2 Authenticated Workspace & Studio Routes
| Route | Description | Minimum Role |
|---|---|---|
| `/dashboard` | Authenticated Home Dashboard ("What do you want to make?", Tools Dock, Workflows & Models Showcase) | `USER` (`reader`) |
| `/create` | Multi-Modal Studio (`?mode=image\|video\|3d\|audio\|text\|texture\|skybox\|upscale\|remove-bg\|vectorize\|pixelate&modelId=...`) | `USER` (`editor` to generate) |
| `/canvas` & `/canvas/[id]` | Infinite Canvas Editor with Generation Frame, Sketch/Brush, Inpaint Mask, Layers, and Live Mode | `USER` (`editor`) |
| `/workflows` | Workflows Library (User Workflows + System Blueprints + JSON Import) | `USER` (`reader`) |
| `/workflows/[id]` | Visual Node-Based DAG Editor (16 node types, interactive port wiring, live topological runner) | `USER` (`editor`) |
| `/apps` | Workflow Apps Gallery & Form Runner (Before/After preview cards, simplified parameter form execution) | `USER` (`editor`) |
| `/models` | Models Hub (`All Models`, `Your Models`, `Base Models`, `LoRA Models`, `Composed Models`) | `USER` (`reader`) |
| `/models/trainings` | Custom LoRA Model Training Studio (Dataset upload/builder, auto-captioning, quality score, training progress) | `USER` (`editor`) |
| `/compose/new` | Compose a Model Studio (Base Model + up to 5 weighted LoRA components + live test preview) | `USER` (`editor`) |
| `/assets` | Unified Asset Hub (9-modality icon dock, search, tag/model/collection filters, Trash bin, batch actions) | `USER` (`reader`) |
| `/collections` | Asset Collections Manager (create, curate, filter, and export asset collections) | `USER` (`reader`) |
| `/explore` | Community & Workspace Public Explore Feed (one-click `Remix` into `/create`) | `USER` (`reader`) |
| `/pricing` | Compute Units (OSCU) Plans, Allowance Buckets, Auto-Refill & Top-Up | `USER` (`reader`) |
| `/settings/[section]` | Unified Settings (`user-profile`, `organization-general`, `organization-members`, `organization-projects`, `organization-plans`, `project-guardrails`, `api-keys`, `webhooks`, `invitations`, `audit-logs`) | `USER` / `ADMIN` |

---

## 3. REST API Contract (`/api/v1/*`)

### 3.1 Identity & Invite-Only Admission
- `GET /api/v1/invitations/validate?code=SCEN-...&email=...`
  - Returns `{ valid: boolean, status: string, role?: string, expiresAt?: string, boundEmail?: string, remainingUses?: number, reason?: string }`.
- `POST /api/auth/register`
  - Request: `{ code: string, email: string, name: string, password: string, workspaceName?: string }`
  - Atomically validates and consumes the invitation code, hashes the password, creates the `User`, provisions their `Organization`, `OrganizationMember` (`admin`), default `Project`, and initial `OscuBucket` (`15,000 OSCU`), and writes `InvitationAuditLog` + `AuditLog`.
- `GET /api/v1/invitations` (`ADMIN` / `SUPER_ADMIN` only)
  - Lists all invitation codes with status (`ACTIVE`, `CONSUMED`, `EXPIRED`, `REVOKED`), issuer, redemptions, and audit history.
- `POST /api/v1/invitations` (`ADMIN` / `SUPER_ADMIN` only)
  - Issues a new single-use or multi-use invitation code with role, expiration, and optional bound email.
- `PATCH /api/v1/invitations/[id]` (`ADMIN` / `SUPER_ADMIN` only)
  - Supports `action: "revoke"` (immediately invalidates the code) or `action: "rotate"` (generates a replacement cryptographic code and records the rotation audit event).

### 3.2 Workspace Context (`/api/v1/me`, `/api/v1/teams`, `/api/v1/projects`)
- `GET /api/v1/me` — Returns authenticated user, active organization, active project, OSCU balance, and permissions.
- `PATCH /api/v1/me` — Updates user display name, avatar URL, or switches `currentTeamId` / `currentProjectId`.
- `GET / POST / PATCH /api/v1/teams` — Manages organization settings, members, seat allocations, and OSCU top-up buckets.
- `GET / POST / PATCH / DELETE /api/v1/projects` — Manages projects, quality gate guardrails (`bannedWords`, `requiredStyleSuffix`, `minResolution`, `requireApproval`), API keys, and webhooks.

### 3.3 Multi-Modal Inference Engine (`/api/v1/inferences`)
- `POST /api/v1/inferences`
  - Request:
    ```json
    {
      "modality": "image | video | 3d | audio | text | texture | skybox | upscale | remove-bg | vectorize | pixelate",
      "modelId": "model_flux-1-dev",
      "prompt": "Isometric dark fantasy arcane forge with glowing runes",
      "negativePrompt": "blurry, low contrast, watermark",
      "parameters": {
        "aspectRatio": "1:1",
        "width": 1024,
        "height": 1024,
        "numSamples": 2,
        "steps": 28,
        "guidance": 3.5,
        "seed": 421337,
        "seamless": true,
        "durationSeconds": 5,
        "outputFormat": "GLB"
      },
      "sourceAssetId": "optional_asset_id_for_edit_modes"
    }
    ```
  - Enforces Project Quality Gate guardrails, calculates `OSCU` cost, deducts from the active `OscuBucket`, synthesizes the requested output artifacts, persists `InferenceJob` + `Asset` records, dispatches any registered project webhooks, and returns the created job and assets.

### 3.4 Models, Trainings & Compositions (`/api/v1/models`, `/api/v1/trainings`)
- `GET / POST / PATCH / DELETE /api/v1/models` — Returns system catalog models + user-trained LoRAs + user-composed models (`type: "base" | "lora" | "composed"`).
- `POST /api/v1/models/compose` — Validates up to 5 component models and weights (`0.0–1.0`), normalizes weights, and persists a new composed `AiModel`.
- `GET / POST / PATCH /api/v1/trainings` — Creates a LoRA training job with dataset items, auto-captions, dataset quality score (`0–100`), loss curve metrics, and automatically registers the trained LoRA model in the workspace upon completion.

### 3.5 Visual Workflows & Workflow Apps (`/api/v1/workflows`)
- `GET / POST / PATCH / DELETE /api/v1/workflows` — CRUD for DAG workflows (`nodes`, `edges`, `inputKeys`, `nodeGroups`, `isPublishedApp`).
- `POST /api/v1/workflows/[id]/run` — Executes the workflow DAG in topological order, resolving port connections (`sourceHandle` -> `targetHandle`), executing `text`, `transformText`, `splitText`, `joinTexts`, `ifElse`, `forEach`, `llm`, and `model` nodes, pausing at `approval` nodes when configured, and returning full per-node execution traces and generated assets.

### 3.6 Infinite Canvas (`/api/v1/canvases`)
- `GET / POST / PATCH / DELETE /api/v1/canvases` — Persists multi-layer canvas scenes (`layers`, `strokes`, `generationFrame`, `zoom`, `pan`) and supports in-frame Sketch-to-Image / Inpainting generation.
