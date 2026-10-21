# Interface and codebase cleanup

Prepared on local `testing`, based on `6c5f911`. Changes are staged but remain uncommitted for review; nothing has been pushed or deployed.

## Application changes

- Rebuilt the landing page around actual study workflows. Removed fabricated paper listings, “updated today” labels and unsupported marketing claims. Added working feature anchors and an accessible, responsive layout.
- Reworked dashboard hierarchy: primary focus action, compact real session totals and clear tool cards. Aligned profile/footer styling and removed links to nonexistent legal pages.
- Preserved the earlier shared profile, lazy route, session-summary, timer and collaboration fixes.
- Split all 28 database tables into `backend/app/models/` domain modules and request/response types into `backend/app/schemas/`. Router-local request classes also moved into schemas. All callers were updated; database table names, columns, types, nullability and foreign keys match the previous metadata. UUID defaults now exist on User creation.
- Extracted subscription policy, atomic daily AI usage accounting and bounded document parsing into services. Quiz/flashcard generation now checks shared quotas, validates output and refunds failed generation attempts. File generation uses one persistence transaction and attempts provider/local file cleanup.
- Tutor uploads reject unsupported/oversized/unreadable content. PDF originals require storage rather than recording an unsaved file path. Blocking PDF extraction runs outside the request event loop.
- Removed hardcoded admin provisioning and startup email-based promotion. Admin changes now require an explicit CLI action on an existing account. A real JWT secret is required locally as well as in hosted environments.
- Grouped frontend components by responsibility and centralized the API origin in `services/api.js`. Browser tooling is a development dependency. Optional Modal dependencies are separated from the API requirements; installed Supabase resolution is pinned.
- Removed redundant imports, generated commentary and decorative emoji from application source. Retained comments explaining non-obvious invariants and registration/cleanup behavior.

## Removed or relocated

Removed obsolete root repair/refactor scripts, empty dumps, frontend icon repair scripts, a page backup, an unused profile gate, empty frontend README, stale Tailwind v3 configuration, invalid frontend deployment file, debug scripts and insecure default-admin setup.

Preserved migration history under `backend/migrations/legacy/`, content under `backend/data/imports/`, manual operations under `backend/scripts/`, and optional Modal entrypoints under `backend/integrations/modal/`. None of these operations was executed.

Raw benchmark JSON, benchmark-only scripts and temporary verification artifacts were archived outside the repository. Permanent unit/API/browser regression tests remain under the applications' test directories. No screenshots, test databases, dependencies or build output belong in Git.

## Verification

- Backend: 15 isolated tests cover registration/login, profile validation, ownership, summary totals, content admin operations, collaboration persistence, configuration, AI quotas/output, file cleanup and upload boundaries. Provider responses/parsing are stubbed where indicated; this is not an AI quality evaluation or real Supabase test.
- Frontend: production build, two unit scenarios, lint and eight browser scenarios. Browser checks cover login, shared data requests, profile persistence/retry, channel HTTP acknowledgement, rejected sends, reconnect, timer persistence and 390px layouts.
- Python static checks: unresolved/duplicate names checked; unused imports cleaned. Models' SQL metadata compared before and after the split: 28 tables preserved.
- The data-entry app also passed a clean dependency install and production build.
- Existing frontend hook/HMR warnings and Python dependency deprecation warnings remain. No warnings were hidden by disabling rules.

Final results are summarized in the handoff. PostgreSQL/storage, live AI/payment providers, native mobile behavior and hosted deployment are not established by these local checks. The large collaboration provider and remaining request lifecycle concerns belong in the next focused refactor.
