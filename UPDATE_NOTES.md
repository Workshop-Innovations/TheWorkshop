# Update Notes: Admin Access, Onboarding, Study Suite, Deploy Fix, Email Verification

Date: 4 November 2026
Status: all changes are in your working copy and **not committed or deployed yet**.

---

## ✅ YOUR TO-DO LIST (read this first)

1. **Remove `ADMIN_EMAIL` from your hosting dashboard's environment variables** (e.g. Render, backend service). It no longer does anything. I already removed it from your local `backend/.env`.
2. **Commit and push** these changes, then redeploy the backend and frontend. The backend build should now succeed (see section 4).
3. **Sign in with Google using your `@workshop.com.ng` account** after deploying. That gives you admin access. Do this before anything else, because the old `a@gmail.com` account loses admin on the next backend start.
4. **Fill in `SMTP_USERNAME` and `SMTP_PASSWORD`** in `backend/.env` (the other SMTP2GO settings are already there; see section 6).
5. **Add these environment variables to the backend on your hosting dashboard** (the live server doesn't read your local `.env`):
   ```
   SMTP_HOST=mail-eu.smtp2go.com
   SMTP_PORT=2525
   SMTP_USE_SSL=false
   SMTP_USERNAME=<your SMTP2GO username>
   SMTP_PASSWORD=<your SMTP2GO password>
   SMTP_FROM_EMAIL=signup@workshop.com.ng
   SMTP_FROM_NAME=The Workshop
   APP_URL=https://workshop.com.ng
   ```
   Email verification switches on as soon as `SMTP_HOST` is set, so add the username and password at the same time.
6. **In SMTP2GO, verify `workshop.com.ng` as a sender domain** (Sending → Verified Senders → add the domain and its DNS records). Without this, emails from `signup@workshop.com.ng` may be rejected or land in spam.
7. **After deploying, test it:** sign up with a new email address, check the email arrives, click the link, then sign in.
8. **Optional, recommended:** if the old default password `admin123` was ever used on the live site, change that account's password or deactivate it.
9. **Optional:** to deploy the Modal functions (grader, paper processor, upscaler) from your machine, install their tools with `pip install -r backend/requirements-modal.txt`.

---

## 1. Admin access: only official `@workshop.com.ng` accounts

**The problem:** a default admin account (`a@gmail.com` / `admin123`) was hard-coded in the setup scripts, and the `ADMIN_EMAIL` setting auto-promoted whatever address it held. Anyone with those details had admin access.

**How it works now:**
- Anyone who **signs in with Google using a verified `@workshop.com.ng` address** becomes an admin automatically.
- **Admins can still make other admins** (any email) from the admin dashboard, the same as before.
- Nobody else gets admin.

**Safety rules I added:**
- **`@workshop.com.ng` addresses can't register with a password.** They must use "Sign in with Google". Otherwise anyone could register `ceo@workshop.com.ng` with a password, and when the real owner later signed in with Google, the account would become admin while the attacker still knew its password.
- **Users can't change their own profile email to a `@workshop.com.ng` address** (admins can).
- **The default `a@gmail.com` account loses admin** automatically whenever the backend starts.
- **Hard-coded admin credentials are gone** from `setup_database.py`, `create_admin.py` and `seed_admin.py`. `create_admin.py` and `seed_admin.py` now require you to type the details on the command line.
- **`ADMIN_EMAIL` support has been removed.**

**Good to know:**
- If an admin removes admin from a `@workshop.com.ng` user, that user becomes admin again the next time they sign in with Google. Domain access is the default, as you asked.
- Staff who already registered a `@workshop.com.ng` account with a password become admin after signing in with Google once.
- The domain is set in one place: `OFFICIAL_ADMIN_DOMAIN` in `backend/app/dependencies.py`.

**Tested:** the old default account is refused (403), an official Google account gets in (200), a normal Gmail Google account is refused (403), and password sign-up with `@workshop.com.ng` is blocked.

---

## 2. Onboarding page: Google sign-up button missing

**Cause:** the "Create your account" step fades in after the previous step fades out. The code tried to draw the Google button the moment the step changed, before its container existed on the page, so Google drew nothing and the page ended at the "or" divider. The sign-in page has no animation, which is why it worked there.

**Fix:** the button is now drawn as soon as its container appears (`frontend/src/pages/Onboarding.jsx`).

---

## 3. Study Suite on phones

On screens narrower than **768px** (phones), the Study Suite page is now covered by a blurred overlay with a card that says:

> **Screen too narrow**: The Study Suite can only be used on a tablet or laptop screen. Please switch to a larger device to continue.

It has a **Back to Dashboard** button. Tablets (768px and wider) and laptops see the page normally. File: `frontend/src/pages/StudySuite.jsx`.

---

## 4. Backend deploy failure (fixed)

**Error you saw:** `No matching distribution found for litellm==1.40.0`. That version is no longer available on PyPI.

**What I changed in `backend/requirements.txt`:**
- **Removed `litellm` and `modal`.** The web server never uses them. They're only used by the separate Modal scripts (`modal_grader.py`, `modal_paper_processor.py`, `app/modal_upscaler.py`), which you deploy with `modal deploy`, and the grader already installs litellm inside Modal itself. They're now in a separate file, `backend/requirements-modal.txt`, for your own machine.
- **`supabase` 2.7.0 → 2.27.3.** The old version clashed with `httpx==0.28.1`, so the build would have failed next even with litellm fixed. 2.27.3 is the version you already run locally.
- **`pydantic` 2.11.5 → 2.12.5**, plus matching `pydantic_core` 2.41.5, `typing_extensions` 4.15.0 and `typing-inspection` 0.4.2, because the newer supabase needs them. These are also the versions you already run locally.

**Tested:** a full `pip install --dry-run` of the requirements now resolves with no conflicts.

---

## 5. Email verification (built and ready; switches on when you add SMTP)

**What happens once SMTP is configured:**
1. Someone signs up with email and password.
2. They get an email with a **Verify email** button. The link lasts 24 hours.
3. Until they click it, signing in shows: *"Please verify your email address…"* with a **Resend verification email** button.
4. The link opens a new page, `/verify-email`, which confirms them and sends them to sign in.

**Details:**
- **No one is locked out:** all existing accounts are automatically marked as verified. The database column is added on startup, so no manual migration is needed.
- **Google sign-ins and admin-created accounts** count as verified automatically.
- **Changing your email** in your profile requires verifying the new address before you can sign in with it.
- **Onboarding:** after creating an account, people see a "Check your inbox" screen instead of the plan picker. They can choose a plan later from the Pricing page.
- **Without SMTP settings, verification is off** and new accounts are verified automatically, so sign-ups keep working until you're ready.
- **Resend is rate-limited** and gives the same reply whether or not an account exists, so it can't be used to find out who has signed up.

---

## 6. SMTP2GO setup (done, except the login details)

I added these to your local `backend/.env`:

| Setting | Value |
|---|---|
| `SMTP_HOST` | `mail-eu.smtp2go.com` |
| `SMTP_PORT` | `2525` (encrypted with TLS/STARTTLS) |
| `SMTP_USE_SSL` | `false` (correct for 2525; only use `true` with port 465, 8465 or 443) |
| `SMTP_USERNAME` | **empty: you fill this in** |
| `SMTP_PASSWORD` | **empty: you fill this in** |
| `SMTP_FROM_EMAIL` | `signup@workshop.com.ng` |
| `SMTP_FROM_NAME` | `The Workshop` |

- **Why port 2525:** many hosts (including Render) block the standard mail ports 25, 465 and 587, but 2525 is usually open. If 2525 ever fails on the server, try `SMTP_PORT=8025` (still `SMTP_USE_SSL=false`), or `SMTP_PORT=8465` with `SMTP_USE_SSL=true`.
- **Connection checked:** from your machine, `mail-eu.smtp2go.com:2525` connected and started TLS. No login was tried and no email was sent.
- **Local behaviour:** because `SMTP_HOST` is now set in your local `.env`, local sign-ups require email verification too. Until you add the username and password, emails can't be sent and new local accounts can't sign in. To switch verification off locally, comment out the `SMTP_HOST` line.
- **Local links:** `APP_URL` is left unset locally, so links point to `http://localhost:5173`. On the live server, set `APP_URL=https://workshop.com.ng`.
- **If emails don't arrive:** the backend logs `Failed to send email` with the reason (usually wrong login details or an unverified sender domain). SMTP2GO's dashboard also shows every send attempt under Reports → Activity.

**Tested:** sign-up with and without SMTP, blocked sign-in before verifying, resend, invalid or tampered links rejected, valid link works, then sign-in succeeds, and the email is built and sent correctly (tested against a fake mail server).

---

## Files changed

**Backend**
- `app/dependencies.py`: official-domain check
- `app/routes/google_auth.py`: auto-admin for `@workshop.com.ng`, marks Google users verified
- `app/main.py`: removed `ADMIN_EMAIL`, demotes `a@gmail.com`, blocks `@workshop.com.ng` password sign-ups, verification on sign-up and sign-in, new `/auth/verify-email` and `/auth/resend-verification` endpoints
- `app/routes/users.py`: email-change rules, admin-created users verified
- `app/schemas.py`: new `email_verified` field
- `app/database.py`: adds the `email_verified` column automatically on startup
- `app/email_service.py` (new): sends email over SMTP, creates verification links
- `requirements.txt`: deploy fix; `requirements-modal.txt` (new)
- `create_admin.py`, `seed_admin.py`, `setup_database.py`: no hard-coded credentials
- `.env.example`: `ADMIN_EMAIL` removed, SMTP settings added

**Frontend**
- `pages/Onboarding.jsx`: Google button fix, "Check your inbox" screen
- `pages/StudySuite.jsx`: phone overlay
- `pages/Login.jsx`: "Resend verification email" button
- `pages/Register.jsx`: verification message
- `pages/VerifyEmail.jsx` (new) and `App.jsx` (route)

The frontend builds without errors. I haven't tested the new screens in a real browser, so please check the onboarding page, the Study Suite on a phone, and (once SMTP is on) the full sign-up email flow after deploying.
