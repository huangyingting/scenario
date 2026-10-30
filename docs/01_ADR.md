# Architecture Decision Records (ADR)

## ADR-001: Next.js App Router + TypeScript Full-Stack Architecture

- **Status**: Accepted
- **Context**: Scenario requires both high-conversion public marketing pages (`/`, `/pricing`, `/explore-public`), secure authentication flows (`/login`, `/register`), and a deeply interactive, low-latency studio workspace (`/create`, `/canvas/[id]`, `/workflows/[id]`, `/models`, `/assets`, `/settings/*`) backed by a unified `/api/v1/*` REST API.
- **Decision**: Use Next.js (App Router) with React 19 and TypeScript in strict mode. Route Handlers under `src/app/api/v1/*` implement the Scenario REST API contract, while client studio views use shared workspace context providers (`WorkspaceProvider`) that mirror Scenario's `UserProvider`, `TeamProjectProvider`, and `LimitsProvider`.
- **Consequences**: Unified deployment artifact, zero CORS overhead between studio UI and `/api/v1/*`, strong end-to-end TypeScript types, and clean separation between server-enforced security boundaries and rich client-side editors.

---

## ADR-002: Dual Database Engine Strategy (SQLite for Local Dev, PostgreSQL for Production)

- **Status**: Accepted
- **Context**: The project requires zero-friction local development and testing using SQLite while supporting concurrent multi-tenant production deployments on PostgreSQL using Prisma 7.
- **Decision**: Maintain two synchronized Prisma schemas (`prisma/schema.prisma` targeting SQLite with `@prisma/adapter-better-sqlite3` and `prisma/schema.postgresql.prisma` targeting PostgreSQL with `@prisma/adapter-pg`), paired with a runtime adapter selector in `src/lib/prisma.ts` (following the proven pattern in `../Arcade`).
- **Consequences**: Local setup, unit tests, and Playwright E2E suites run deterministically against local SQLite databases without external container dependencies, while production deployments switch seamlessly to PostgreSQL via `DATABASE_URL`.

---

## ADR-003: Invite-Only Account Admission with Single-Use/Expiring Codes, RBAC, Revocation & Audit Logging

- **Status**: Accepted
- **Context**: Public unguarded sign-up must be disabled. Every account created through `/register` or `/api/auth/register` must present a valid, unrevoked, non-expired invitation code, and every lifecycle transition must be recorded in an immutable audit log. Zero dummy accounts or pre-seeded demo users may exist in the database.
- **Decision**:
  1. Implement a dedicated account-admission domain (`src/lib/account-admission/*`) modeled on `../Arcade` and extended for Scenario's multi-tenant Organization/Project RBAC.
  2. Invitation codes are normalized (uppercase, trimmed), cryptographically generated (`SCEN-XXXX-XXXX-XXXX`), and support `role` assignment (`USER`, `ADMIN`, `SUPER_ADMIN`), optional `targetWorkspaceRole` (`admin`, `editor`, `reader`), `maxUses` (default `1` for strict single-use), `expiresAt` timestamp, `boundEmail` restriction, and immediate `REVOKED` state transitions.
  3. Consuming an invitation code executes inside a serializable/atomic Prisma interactive transaction (`$transaction`) using conditional `updateMany` guards (`status: "ACTIVE"`, `usedCount < maxUses`) to prevent race-condition double redemption, creates the `User`, provisions their initial `Organization` (`Team`), default `Project`, and initial Compute Unit (`OSCU`) allowance bucket, updates the invitation status to `CONSUMED` when `usedCount == maxUses`, and writes both `InvitationAuditLog` and `AuditLog` entries.
  4. Initial administrator provisioning is performed exclusively via a CLI bootstrap script (`scripts/bootstrap-admin.ts`) using explicit environment variables or CLI flags—never via hardcoded dummy accounts.
- **Consequences**: Eliminates unauthorized signups, prevents race-condition replay of single-use codes, provides full administrative traceability, and strictly honors the "no dummy data / no demo user accounts" requirement.

---

## ADR-004: Auth.js / NextAuth v4 JWT Session Strategy with Real-Time Database Role & Status Verification

- **Status**: Accepted
- **Context**: Studio pages, API routes, and administrative endpoints require fast session resolution as well as immediate enforcement when an account is suspended or a role is changed.
- **Decision**: Configure NextAuth (`src/lib/auth.ts`) with `CredentialsProvider` (Argon2/bcryptjs password verification + account status checks) and JWT sessions enriched with `userId`, `role` (`USER` | `ADMIN` | `SUPER_ADMIN`), `currentTeamId`, and `currentProjectId`. Security-sensitive API helpers (`requireAuth`, `requireAdmin`, `requireWorkspaceRole`) verify user existence and active status against Prisma.
- **Consequences**: Compatible with both browser sessions and API clients while guaranteeing that deactivated users or revoked API keys are rejected immediately.

---

## ADR-005: Deterministic Procedural & Algorithmic Multi-Modal Generation Engine (Zero Dummy Placeholders)

- **Status**: Accepted
- **Context**: Scenario supports 11 distinct generation and editing modalities (`image`, `video`, `3d`, `audio`, `text`, `texture`, `skybox`, `upscale`, `remove-bg`, `vectorize`, `pixelate`). In a self-contained production environment without mandatory third-party GPU cluster keys, generations must still execute real algorithmic synthesis, produce valid downloadable media artifacts (high-resolution SVG/PNG data URLs, procedural WebBM/animated SVG video sequences, valid Wavefront `.obj` / glTF `.gltf` 3D meshes, synthesized RIFF `.wav` audio waveforms, seamless PBR tileable maps, and 360° equirectangular panoramas), deduct real Compute Units (`OSCU`), and persist complete `InferenceJob` and `Asset` records in Prisma. When optional external provider keys (`OPENAI_API_KEY`, `FAL_KEY`, `REPLICATE_API_TOKEN`) are configured, the engine can also route to upstream providers.
- **Decision**: Implement a pluggable, deterministic Multi-Modal Synthesis Engine (`src/lib/generation-engine.ts`) that:
  - Parses prompts, negative prompts, seeds, dimensions, aspect ratios, steps, guidance scales, and model weights/compositions.
  - Synthesizes authentic, prompt-responsive visual/3D/audio/text artifacts with distinct aesthetics per selected model (e.g., Isometric RPG, Pixel Art, Dark Fantasy Concept, PBR Seamless Material, 360° Skybox, Wireframe/PBR 3D Mesh, RIFF PCM `.wav` audio buffer).
  - Performs real image transformations for `remove-bg` (alpha channel extraction), `upscale` (high-definition detail pass), `vectorize` (multi-path SVG trace), and `pixelate` (palette-quantized pixel grid).
  - Atomically records `OscuTransaction` debit entries against the organization's active compute bucket and stores the resulting `Asset` rows in the database.
- **Consequences**: Every studio tool produces genuine, inspectable, downloadable, and remixable outputs persisted in SQLite/PostgreSQL with zero hardcoded dummy galleries.

---

## ADR-006: Topological DAG Execution Engine for Visual Workflows & Workflow Apps

- **Status**: Accepted
- **Context**: Scenario's `/workflows/[id]` node editor and `/apps` runner execute multi-step pipelines combining text manipulation, conditional logic, batch loops, LLM prompt expansion, and chained model inferences.
- **Decision**: Store workflow graphs as canonical JSON (`nodes`, `edges`, `inputKeys`, `nodeGroups`) in the `Workflow` table and execute runs via a server-side topological sort evaluator (`src/lib/workflow-engine.ts`). Each `WorkflowRun` records per-node execution status (`PENDING`, `RUNNING`, `COMPLETED`, `WAITING_APPROVAL`, `FAILED`), per-node input/output payloads, total `OSCU` consumed, and generated `Asset` IDs.
- **Consequences**: Identical execution semantics whether triggered from the visual node graph editor, the simplified Workflow App form runner, or the REST API (`POST /api/v1/workflows/[id]/run`).
