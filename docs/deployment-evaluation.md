# Testing deployment preparation

Nothing is deployed. Configure all provider connections to the **testing** branch. `deploy/render.preview.yaml` is a preview example with manual deployments; it is not an active production configuration.

## Recommended setup

- **Cloudflare Pages:** root `frontend`, output `dist`, build `npm ci --ignore-scripts && npm run build:deploy`; set `VITE_API_URL` to the public HTTPS API origin. Only public values belong in `VITE_*`. SPA fallback works without a top-level 404.html; `_headers` handles static caching. Free limits include 500 builds/month and 20,000 files. [Pages limits](https://developers.cloudflare.com/pages/platform/limits/), [SPA serving](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- **Render Free API:** use a new isolated service, Python 3.12, root `backend`, one Uvicorn worker, `/healthz`. Free instances sleep after 15 idle minutes and have ephemeral filesystems; 750 instance hours/workspace/month. They are suitable for a preview, not a production reliability commitment. Frankfurt is a starting hypothesis for Nigerian users, not a measured latency result. [Free restrictions](https://render.com/docs/free), [regions](https://render.com/docs/regions)
- **Separate Supabase preview project:** use persistent PostgreSQL and a separate storage bucket for PDF originals. Preserve the production project. Backend authentication remains custom JWT, not Supabase Auth. Free includes a 500 MB database and 1 GB storage; inactive projects can pause. [Billing](https://supabase.com/docs/guides/platform/billing-on-supabase), [pausing](https://supabase.com/docs/guides/platform/free-project-pausing)

Render Free Postgres expires after 30 days, so do not use it for durable student data. Neon is a future database alternative, not a reason to migrate now. Vercel Hobby restricts personal/non-commercial usage and is not the default business recommendation. [Render](https://render.com/docs/free), [Neon](https://neon.com/pricing), [Vercel](https://vercel.com/docs/plans/hobby)

Published upgrade starting figures checked 2026-10-21: about $7/month for the smallest paid Render web compute and $25/month for Supabase Pro, before other projects, usage, workspace charges or taxes. Recheck before spending. No paid resources or real AI calls were enabled. [Render prices](https://render.com/pricing), [Supabase prices](https://supabase.com/pricing)

## When connecting accounts

1. Review and commit the testing branch. Create a new empty preview database, never a production connection for testing.
2. Import `deploy/render.preview.yaml` as the Blueprint path, or manually configure an equivalent service on testing. Provide private `DATABASE_URL`, generated `SECRET_KEY`, `APP_ENV=production` and exact HTTPS `FRONTEND_URLS`. Use SSL and a compatible Supabase session pooler when needed. [Connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
3. Reserve the Pages preview origin, allow that exact origin in API CORS, and set the frontend public API origin. Rebuild after changing Vite variables.
4. Leave Gemini, Paystack and Modal keys empty initially. Add only separate preview storage credentials if testing PDFs. Startup creates missing tables and default community memberships; it does not apply legacy migrations or promote admins automatically.
5. Check registration/login, profile, focus totals, papers, channel/DM access and reconnect, deep-link reload, allowed/rejected CORS and durable document access using synthetic accounts.
6. Measure warm and after-idle latency from Nigeria. Keep one API worker until socket delivery/presence is redesigned for multiple processes.

Local SQLite tests do not validate PostgreSQL migrations, provider connectivity, bucket permissions, actual CDN headers, cold starts or geographic latency. `/healthz` is process liveness, not a comprehensive database/provider health check. Legacy migration scripts require manual review against a backed-up clone before any future production use.
