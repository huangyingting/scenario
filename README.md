# Scenario — Full-Stack Generative AI Game Engine Platform Clone

Production-grade full-stack application replicating **`https://www.scenario.com`** and **`https://app.scenario.com`**, built with **Next.js 16 (App Router)**, **TypeScript 5**, **Tailwind CSS**, **NextAuth v4**, and **Prisma 7** (`@prisma/adapter-better-sqlite3` for local development and `@prisma/adapter-pg` for PostgreSQL production), enhanced with **Invite-Only Account Admission, Single-Use/Expiring Invitation Codes, Role-Based Access Control (RBAC), Instant Revocation/Rotation, and Immutable Audit Logging**.

---

## Architecture & Documentation Suite

All reverse-engineering findings, 35 live Playwright captures (`screenshots/01-*.png` through `35-*.png`), and architectural specifications are available in:

- [`SCENARIO_FEATURE_ARCHITECTURE_DESIGN_REPORT.md`](./SCENARIO_FEATURE_ARCHITECTURE_DESIGN_REPORT.md) — Executive Feature & Architecture Reverse-Engineering Report
- [`docs/01_ADR.md`](./docs/01_ADR.md) — Architecture Decision Records (ADR-001 through ADR-010)
- [`docs/02_PRD.md`](./docs/02_PRD.md) — Product Requirements Document (Personas, Epics, Functional & Non-Functional Requirements)
- [`docs/03_TECHNICAL_SPEC.md`](./docs/03_TECHNICAL_SPEC.md) — Technical Specification (Multi-Modal Engines, 16-Node DAG Engine, Invite-Only Security, REST API Contracts)
- [`docs/04_ARCHITECTURE_AND_DATA_MODEL.md`](./docs/04_ARCHITECTURE_AND_DATA_MODEL.md) — System Topology, Dual Prisma 7 ER Model (19 tables), and Sequence Flows
- [`docs/05_IMPLEMENTATION_PLAN_AND_BACKLOG.md`](./docs/05_IMPLEMENTATION_PLAN_AND_BACKLOG.md) — Phased Implementation Plan & 45-Task Engineering Backlog
- [`docs/06_ACCEPTANCE_CRITERIA_AND_PARITY.md`](./docs/06_ACCEPTANCE_CRITERIA_AND_PARITY.md) — Gherkin Acceptance Criteria & 1:1 Feature Parity Matrix
- [`docs/NEXTAUTH_INVITE_ONLY_SPEC.md`](./docs/NEXTAUTH_INVITE_ONLY_SPEC.md) — Invite-Only Account Admission & Audit Specification

---

## Zero Dummy Data & Invite-Only Bootstrap

This application ships with **zero pre-seeded dummy users or demo assets**. Accounts can only be created via:
1. The CLI bootstrap utility (`npm run bootstrap:admin`) to provision the initial `SUPER_ADMIN` or generate a single-use `SCEN-XXXX-XXXX-XXXX` invitation code.
2. Redeeming an active, non-expired, non-revoked invitation code at `/register`.

### Quick Start (Local SQLite Development)

```bash
# 1. Install dependencies & generate Prisma Client
npm install
npx prisma generate

# 2. Initialize SQLite database schema (zero dummy data)
npm run db:push

# 3. Bootstrap initial Super Admin or generate an Invite Code
npm run bootstrap:admin -- --email admin@studio.com --password "StrongPassword!123" --name "Studio Admin"

# 4. Run development server
npm run dev
```

### Production PostgreSQL Deployment

Set `DATABASE_URL="postgresql://user:pass@host:5432/scenario?schema=public"` and run:

```bash
npm run db:generate:postgres
npm run build
npm run start
```
