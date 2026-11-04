# Moving the Backend to a New Render Service

Date: 4 November 2026

This guide covers two things:

1. **The server now runs 1 worker instead of 4** (code change, already done).
2. **Step-by-step instructions for moving the backend to a new Render service in a better region.** The frontend (Cloudflare) and the database (Supabase) stay where they are.

Nothing has been committed yet. Commit and push the changes before you create the new service, because Render deploys from GitHub.

---

## Part 1: One worker (done)

**File changed:** `backend/start.sh`

```bash
exec gunicorn app.main:app -w 1 -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:${PORT:-8000} --timeout 120 --graceful-timeout 30
```

**Why:** each worker keeps its own list of people connected to live chat. With 4 workers, a message only reached the people connected to the same worker as the sender, so others often saw it only after refreshing. With 1 worker, everyone is connected to the same place, so live chat, the content cache and the rate limits all behave consistently.

**Is 1 worker enough?** Yes, for now. The worker is asynchronous, so it handles many requests at the same time. If the app outgrows it later, the fix is to add Redis so several workers can share chat messages. Don't just raise `-w` again.

**Important: make sure Render actually uses this file.** Render runs whatever is in the service's **Start Command** box, which can ignore `start.sh` entirely. On the new service, set the Start Command to exactly:

```
bash start.sh
```

(If you keep the old service running for a while, check its Start Command too. If it says `gunicorn ... -w 4 ...`, it's still running 4 workers.)

**Also changed:** in `mobile/src/services/api.js`, the mobile app's production address was a placeholder (`your-production-url.theworkshop.app`). It's now `https://api.workshop.com.ng`.

---

## Part 2: Moving the backend

### Background you need to know

- **Render cannot change the region of an existing service.** That's why a new service is needed. The old one keeps running until you switch over, so there's no downtime.
- **Your database is in Supabase's `eu-north-1` region (Stockholm).** This comes from the `DATABASE_URL` in `backend/.env`.
- **Choose the Render region "Frankfurt (EU Central)".** It's the closest Render region to both your database and your users in Nigeria. Every API request makes several database queries, so a backend far from the database (for example, in the US) adds a delay to each one. This is most likely why the current setup feels slow.
- **Both services can safely use the same database at the same time.** The startup migrations (new columns and indexes) only run if they're missing, so the new service won't damage anything.
- **Your data admin app already uses `https://api.workshop.com.ng`** (in `data-app/src/App.jsx`). If that domain currently points at the old Render service, the cleanest switch is to move the domain to the new service. Steps 6 and 7 cover this.

### Step 1: Commit and push the code

Push the current changes to GitHub, the branch Render deploys from (`main`).

### Step 2: Write down everything from the old service

On the Render dashboard, open the **old** backend service.

1. **Settings tab:** note the Root Directory, Build Command, Start Command, plan/instance type and Health Check Path.
2. **Environment tab:** copy every variable and its value into a private note. **The values on the old service are what count, not your local `.env` file.** Production may have values that your local file doesn't, such as `GOOGLE_CLIENT_ID`, `DATA_ENTRY_TOKEN`, `PING_SECRET`, `MODAL_SHARED_SECRET` and `MODAL_UPSCALER_URL`.
3. **Settings → Custom Domains:** note any domains listed (probably `api.workshop.com.ng`).

### Step 3: Create the new service

Render dashboard → **New + → Web Service** → connect the same GitHub repository.

| Setting | Value |
|---|---|
| Name | e.g. `workshop-backend-eu` |
| **Region** | **Frankfurt (EU Central)** |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `bash start.sh` |
| Instance type | Same as the old one, or higher. **Avoid Free:** free instances go to sleep after 15 minutes without traffic, which disconnects live chat and makes the first request take about a minute. |
| Health Check Path (under Advanced) | `/api/system/ready` |

### Step 4: Add the environment variables

In the new service's **Environment** tab, add every variable from Step 2. Render's **"Add from .env"** button lets you paste them all at once. Pay attention to these:

| Variable | What to put | Notes |
|---|---|---|
| `SECRET_KEY` | **Exactly the same value as the old service** | If it's different, every user is logged out, and links in verification emails that were already sent stop working. |
| `DATABASE_URL` | Same as the old service | Same Supabase database. |
| `SUPABASE_URL`, `SUPABASE_KEY` | Same as the old service | Needed for file storage and profile pictures. |
| `FRONTEND_URLS` | `https://workshop.com.ng,https://data.workshop.com.ng` | Only these websites are allowed to call the API. If your site also loads from `https://www.workshop.com.ng` or a `*.pages.dev` address, add those too, separated by commas with no spaces. Leave out the `localhost` addresses in production. |
| `FRONTEND_URL` | `https://workshop.com.ng` | Where users are sent back to after paying with Paystack. Your local `.env` has `http://` (not https). Use **https**. |
| `APP_URL` | `https://workshop.com.ng` | **Important:** this is the website address used in verification email links. If it's missing, the app uses the first entry in `FRONTEND_URLS`. If that entry is `http://localhost:5173`, users get a broken verification link. |
| `PYTHON_VERSION` | `3.13.1` | Matches the version the requirements were tested with. |
| `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID` | Same as the old service | The AI tutor and Google sign-in. |
| `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_PLAN_PRO`, `PAYSTACK_PLAN_PREMIUM`, `PAYSTACK_PLAN_MAX` | Same as the old service | Payments. |
| `SMTP_HOST` | `mail-eu.smtp2go.com` | Email verification. Leaving `SMTP_HOST` empty turns verification off. |
| `SMTP_PORT` | `2525` | |
| `SMTP_USE_SSL` | `false` | |
| `SMTP_USERNAME`, `SMTP_PASSWORD` | Your SMTP2GO login | |
| `SMTP_FROM_EMAIL` | `signup@workshop.com.ng` | |
| `SMTP_FROM_NAME` | `Workshop Innovation` | |
| `MODAL_GRADER_URL`, `MODAL_PAPER_PROCESSOR_URL`, `MODAL_UPSCALER_URL`, `MODAL_SHARED_SECRET` | Same as the old service, if set | |
| `DATA_ENTRY_TOKEN`, `PING_SECRET` | Same as the old service, if set | |

Optional variables from the last update (leave them out unless you need them): `AVATAR_BUCKET` (default `avatars`), `CONTENT_CACHE_TTL` (default `300`), `DB_POOL_SIZE` / `DB_MAX_OVERFLOW` (default `5` / `5`), `RATE_LIMIT_TRUST_FORWARDED`.

You don't need to add `RENDER`. Render sets it automatically, and the app uses it to know it's running in production.

Click **Save** and let the first deploy run.

### Step 5: Test the new service on its own Render address

The new service gets an address like `https://workshop-backend-eu.onrender.com`. Open these in your browser:

1. `https://<new-address>/api/system/ready` should show `{"status":"ready","database":"connected"}`. If it shows an error, `DATABASE_URL` is wrong.
2. `https://<new-address>/docs` should show the API documentation page.
3. In the Render **Logs** tab, near the top, you should see a single `Booting worker with pid ...` line, not four. That confirms 1 worker is running.

The website can't use the new address yet, because the website still points at the old one. That's expected.

### Step 6: Point the API address at the new service

**Option A (recommended): the website already uses `api.workshop.com.ng`.**

1. **Old service:** Settings → Custom Domains → **delete** `api.workshop.com.ng`.
2. **New service:** Settings → Custom Domains → **Add** `api.workshop.com.ng`. Render shows the DNS record it wants, usually a **CNAME** pointing at `workshop-backend-eu.onrender.com`.
3. **Cloudflare dashboard** → `workshop.com.ng` → **DNS** → edit the existing `api` record:
   - Type `CNAME`, name `api`, target `<new-address>.onrender.com`.
   - **Proxy status: DNS only (grey cloud).** Render issues the HTTPS certificate itself, and Cloudflare's proxy (orange cloud) can block that. If you want the orange cloud later, wait until Render shows the domain as "Verified" and the certificate as issued, then set Cloudflare SSL/TLS mode to **Full (strict)**.
4. Wait until Render shows the domain as **Verified** with a certificate. This usually takes a few minutes and can take up to an hour.
5. Open `https://api.workshop.com.ng/api/system/ready`. It should show "ready". Then check the Logs tab of the **new** service to confirm the request arrived there.

With Option A, **the website, the data admin app and the mobile app need no changes**, because they all use `api.workshop.com.ng`.

**Option B: the website points directly at the old `...onrender.com` address.**

You can check: open the website, press F12 → **Network** tab, reload, and look at which address the API requests go to. If it's an `onrender.com` address:

1. Do Option A's steps first (so `api.workshop.com.ng` points at the new service). This is better long term: if you ever move the backend again, you only change one DNS record.
2. In **Cloudflare** → Workers & Pages → your frontend project → **Settings → Environment variables (Production)**, set:
   ```
   VITE_API_URL=https://api.workshop.com.ng
   ```
   No trailing slash. If you'd rather skip the custom domain, use the new `onrender.com` address instead.
3. **Redeploy the frontend** (Deployments → Retry deployment, or push a commit). Vite builds this address into the site, so changing the variable does nothing until the site is rebuilt.

Live chat uses the same address automatically. It turns `https://` into `wss://`, so there's nothing separate to set for it.

### Step 7: Update services that call the backend

| Where | What to change |
|---|---|
| **Paystack dashboard** → Settings → API Keys & Webhooks → **Webhook URL** | `https://api.workshop.com.ng/api/v1/subscriptions/webhook`. If it already shows this address and you used Option A, no change is needed. If it shows an `onrender.com` address, update it. **If it's wrong, subscriptions that renew automatically won't be recorded.** |
| **Uptime or keep-alive pinger** (cron-job.org, UptimeRobot, etc.), if you have one | Change the URL to the new address. Keep the same `X-Ping-Secret` header if you use `PING_SECRET`. |
| **Mobile app (Expo)** | If you build with `EXPO_PUBLIC_API_URL`, set it to `https://api.workshop.com.ng`. If it isn't set, the app now uses that address automatically. |
| **Google Cloud Console** (OAuth) | No change needed. Google sign-in only checks the *website* addresses, which haven't changed. |
| **Supabase** | No change needed. Optionally, open Database → Network Restrictions; if it's restricted to certain IP addresses, add Render Frankfurt's outbound IPs, which are shown on the new service's **Connect → Outbound** tab. |
| **Modal functions** | No change needed. They don't call the backend. |

### Step 8: Test the live website

Use the real website `https://workshop.com.ng`, ideally in a private/incognito window:

- [ ] Log in with email and password, and log in with Google.
- [ ] Sign up a new test account and confirm the verification email arrives and **its link opens `https://workshop.com.ng/verify-email...`**, not localhost.
- [ ] Open the dashboard, subjects, past papers and flashcards.
- [ ] Ask the AI tutor a question.
- [ ] Open the community in two browsers (or a phone and a laptop) with two accounts, and send a message. **It should appear on the other screen without refreshing.** This confirms the 1-worker fix.
- [ ] Change your profile picture.
- [ ] If you can, make a test payment in Paystack test mode.
- [ ] Watch the new service's **Logs** tab for red errors while you do this.

### Step 9: Retire the old service

1. Leave the old service alone for **2–3 days** in case you need to switch back. Switching back means re-adding the domain to the old service and pointing the DNS record back at it.
2. Then, on the old service: Settings → **Suspend Web Service**. Suspending stops it and stops billing while keeping the settings.
3. After a week with no problems, **Delete** it.

Note that the files the old service saved on its own disk (in the backend's `static` folder, served at `/static/...`) are not moved. Render deletes those files on every deploy anyway, so the new service is no worse off. Anything you need to keep should be stored in Supabase Storage.

---

## If something goes wrong

| Problem | Likely cause and fix |
|---|---|
| The deploy fails on a `pip install` error | Check `PYTHON_VERSION=3.13.1` is set and Root Directory is `backend`. |
| `/api/system/ready` returns 503 | `DATABASE_URL` is wrong or has a typo. Copy it again from the old service. |
| The website shows CORS errors in the browser console (F12), or "Failed to fetch" on every request | The site's exact address is missing from `FRONTEND_URLS`. Include `https://`, no trailing slash, commas with no spaces. Save, and Render redeploys. |
| Everyone was logged out after the switch | `SECRET_KEY` doesn't match the old one. Copy the old value in. |
| Verification emails link to localhost | Set `APP_URL=https://workshop.com.ng`. |
| Emails don't send at all | Check the `SMTP_*` variables. The Logs tab shows the SMTP error. |
| `api.workshop.com.ng` shows a certificate error | Set the Cloudflare DNS record to **DNS only (grey cloud)** and wait for Render to show "Certificate issued". |
| Live chat still needs a refresh | Check the Start Command is `bash start.sh`, and that the Logs show only one `Booting worker` line. |
| "Too many requests" when logging in, for everyone | Every visitor is probably appearing as the same address behind the proxy. Set `RATE_LIMIT_TRUST_FORWARDED=true`. |
| Users see "Login failed" right after the switch | The browser cached the old site build. Redeploy the frontend and hard-refresh (Ctrl+Shift+R). |

---

## Files changed in this update

- `backend/start.sh`: 1 worker, explicit timeouts, and `exec` so Render's stop/restart signals reach gunicorn directly.
- `mobile/src/services/api.js`: production fallback address changed to `https://api.workshop.com.ng`.
- `BACKEND_MOVE_GUIDE.md`: this file.
