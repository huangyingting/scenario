# NextAuth Invite-Only Registration, RBAC, Revocation & Audit Specification

## 1. Overview

In accordance with production security requirements and referencing the architecture in `../Arcade`, public self-registration without an invitation code is strictly prohibited. Every user account in Scenario is admitted through one of two auditable pathways:
1. **CLI Bootstrap Provisioning (`scripts/bootstrap-admin.ts`)**: Used by infrastructure operators to create the initial `SUPER_ADMIN` or `ADMIN` account and optionally mint the first invitation code.
2. **Invite-Only Registration (`/register` -> `POST /api/auth/register`)**: Requires a valid, unrevoked, non-expired `InvitationCode` with available redemption capacity (`usedCount < maxUses`).

---

## 2. Invitation Code Lifecycle & State Machine

```
                  ┌──────────────┐
   Admin Issues ──▶   ACTIVE     ├──────────────┐
                  └──┬───┬───┬───┘              │
                     │   │   │                  │ Admin Rotates
     usedCount ==    │   │   │ now >            │ (New cryptographic code,
       maxUses       │   │   │ expiresAt        │  audit event logged)
                     ▼   │   ▼                  ▼
              ┌──────────┐ ┌─────────┐   ┌──────────────┐
              │ CONSUMED │ │ EXPIRED │   │    ACTIVE    │
              └──────────┘ └─────────┘   └──────────────┘
                     ▲
                     │ Admin Revokes (Immediate)
              ┌──────┴───┐
              │ REVOKED  │
              └──────────┘
```

### 2.1 Code Format & Normalization
- Generated using Node's `crypto.randomBytes` over an unambiguous alphanumeric alphabet (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`) formatted as `SCEN-XXXX-XXXX-XXXX`.
- Input codes are normalized (`trim().toUpperCase()`) prior to lookup.

### 2.2 Validation Rules (`validateInvitationCode`)
An invitation code is valid if and only if:
1. A matching `InvitationCode` record exists.
2. `status === "ACTIVE"` (not `REVOKED`, `CONSUMED`, or `EXPIRED`).
3. `!revokedAt`.
4. `!expiresAt || new Date(expiresAt) > now` (if expired, the service transitions its effective status to `EXPIRED`).
5. `usedCount < maxUses`.
6. If `boundEmail` is set on the invitation, the registering user's normalized email matches `boundEmail.toLowerCase()` exactly.

### 2.3 Atomic Single-Use Redemption (`redeemInvitationAndCreateUser`)
To prevent TOCTOU (Time-of-Check to Time-of-Use) race conditions when two concurrent requests attempt to redeem the same single-use invitation code:
1. Inside `prisma.$transaction(async (tx) => { ... })`:
2. Execute a guarded conditional update:
   ```ts
   const updated = await tx.invitationCode.updateMany({
     where: {
       id: invitation.id,
       status: "ACTIVE",
       revokedAt: null,
       usedCount: { lt: invitation.maxUses },
       OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
     },
     data: {
       usedCount: { increment: 1 },
     },
   });
   if (updated.count !== 1) {
     throw new AdmissionError("INVITATION_EXHAUSTED_OR_INVALID", "Invitation code has already been used or is no longer active.");
   }
   ```
3. Re-read the updated `InvitationCode`; if `usedCount >= maxUses`, update `status = "CONSUMED"`.
4. Create the `User` record with Argon2/bcrypt password hash and assigned `role` (`USER` | `ADMIN` | `SUPER_ADMIN`).
5. Either join `targetTeamId` (if the invitation was scoped to an existing Organization) or create a dedicated `Organization`, `OrganizationMember` (`admin`), default `Project` (`Main Game Production`), and initial `OscuBucket` (`15,000 OSCU`).
6. Create the `InvitationRedemption` record, `InvitationAuditLog` (`action: "REDEEMED"`), and global `AuditLog` (`action: "user.registered_via_invite"`).

---

## 3. Role-Based Access Control (RBAC)

### 3.1 System-Level Roles (`User.role`)
- **`SUPER_ADMIN`**: Full platform governance; can issue/revoke/rotate invitations for any role (including `ADMIN` and `SUPER_ADMIN`), manage all users, inspect global security audit logs, and adjust organization compute limits.
- **`ADMIN`**: Can issue/revoke/rotate invitations for `USER` and `ADMIN` roles, view invitation audit trails, and manage organization workspaces.
- **`USER`**: Standard authenticated creative user; access is governed by their `OrganizationMember.role` within each workspace.

### 3.2 Workspace-Level Roles (`OrganizationMember.role`)
- **`admin`**: Can manage organization settings, members, billing/OSCU buckets, projects, API keys, webhooks, quality gates, models, workflows, and assets.
- **`editor`**: Can generate assets in `/create`, edit canvases in `/canvas`, train/compose models, and author/run workflows.
- **`reader`**: Read-only access to view assets, collections, models, and workflows, plus ability to review/approve `approval` nodes when permitted.

---

## 4. Audit Logging Specification

Every security-relevant operation writes to both `InvitationAuditLog` (for invite-specific events) and `AuditLog` (for platform-wide security governance):
- `invitation.issued` — Actor, code prefix, assigned role, maxUses, expiresAt, boundEmail.
- `invitation.validated` / `invitation.rejected` — Code attempted, candidate email, rejection reason, IP address.
- `invitation.redeemed` — Invitation ID, newly created User ID & email, workspace provisioned.
- `invitation.rotated` — Invitation ID, actor ID, previous code hash/prefix, new code.
- `invitation.revoked` — Invitation ID, actor ID, revocation reason.
- `auth.login.succeeded` / `auth.login.failed` — Actor email, IP address, reason.
- `user.role.updated` / `user.status.updated` — Actor ID, target User ID, old value, new value.
