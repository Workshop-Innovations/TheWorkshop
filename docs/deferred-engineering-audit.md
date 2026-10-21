# Deferred engineering audit

The original comprehensive product/engineering/AI audit remains separate from this cleanup. Keep the school exam focus, compare WAEC and JAMB pilot opportunities, verify actual NECO/Cambridge coverage and treat recurring AI cost as a constraint—not a free-capacity promise.

## Still requiring investigation

- Global browser `progressData` and cosmetic preferences still need an ownership/migration policy for shared devices. Timer storage is account-specific. Do not silently assign another user's legacy data.
- Session logging needs server idempotency and a deliberate offline/retry policy; multiple tabs can still diverge.
- Assessment correctness, answer exposure, grading fallback behavior and historical attempts need dedicated tests. CRUD success does not validate grading.
- The collaboration provider remains large. Request cancellation, stale group/member responses, pagination, unlimited offline catch-up, moderation and multi-tab presence need focused refactoring and permission coverage.
- Database migrations remain legacy scripts. Table creation is not migration versioning. PostgreSQL constraints, upgrade/rollback and backup restoration must be tested on a clone.
- AI routes now share usage accounting, validate selected output and bound uploads, but real educational quality, grounding, provider privacy, scanned PDFs, timeouts and failure/retry economics remain unverified. Boundaries are regression-tested with stubs, not live models.
- Live storage failure recovery, orphaned files, subscription/payment webhooks, email verification, token revocation and data-entry authentication need broader integration/security verification.
- Dependency advisories and older Passlib/Supabase deprecations need triage before public release. Avoid broad forced upgrades without tests. Remaining frontend hook/HMR warnings need deliberate lifecycle changes rather than blindly adding dependencies.
- Native mobile behavior and full data-entry journeys were not covered by this web cleanup. Production legal/privacy content is still needed; dead footer links were removed rather than inventing policies.

## Preserve the original audit contract

Deliver in order: executive assessment; architecture/data flows; feature inventory/status; prioritized findings; existing-feature improvements; users/positioning/competitors; ranked opportunities/rejections; AI architecture/evaluation/free-tier economics; justified modernization; viability/student validation; staged roadmap; unresolved decisions; one focused first milestone.

Use all seven statuses: Working and reasonably complete; Working but needing improvements; Partially implemented; Broken; Placeholder or mock implementation; Planned but absent; Unable to verify.

Separate evidence, inference and recommendation. Use roadmap categories Fix immediately, Improve existing functionality, Build next, Validate with users, Later, Do not build, with scope, complexity, dependencies, risks, acceptance criteria, verification and launch necessity.

Evaluate the seven-day exam, unfamiliar-topic and group-preparation journeys. Research current primary sources for Gemini, Groq, OpenRouter, Hugging Face, Ollama and self-hosting; model requests/tokens/concurrency/storage/quotas for solo testing, 50 and 500 learners. Report measured AI results only when actually executed. No Redis, worker system, framework rewrite or database replacement is justified solely by this cleanup.
