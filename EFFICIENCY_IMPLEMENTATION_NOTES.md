# Efficiency Improvements: What Was Done

Date: 4 November 2026
Covers every item in `EFFICIENCY_IMPROVEMENTS.md`.
Status: all changes are in your working copy and **not committed or deployed yet**.

---

## ✅ YOUR TO-DO LIST (read this first)

1. **Deploy the backend first, then the frontend.** The new frontend calls new backend endpoints. If it goes live first, a few things (progress totals, timer sync, picture upload) quietly fall back or wait until the backend catches up. Nothing breaks, but backend-first is cleaner.
2. **Create a public storage bucket called `avatars` in Supabase** (Storage → New bucket → name `avatars`, tick **Public bucket**). New profile pictures are stored there.
   - Until it exists, picture uploads fail with an error message.
   - If `SUPABASE_URL`/`SUPABASE_KEY` aren't set at all, the app falls back to the old behaviour (saving the picture in the database).
3. **Move existing profile pictures out of the database** (once, after the bucket exists). From the `backend` folder, with your production database and Supabase settings in `backend/.env`:
   ```
   python migrate_profile_pics.py          # dry run: lists what it would move
   python migrate_profile_pics.py --apply  # does it
   ```
   It's safe to run more than once.
4. **Optional, Render health check:** set the service's Health Check Path to `/api/system/ready`. It returns an error status when the database is unreachable, so Render can react. Keep any uptime pinger on `/api/system/health` (always returns 200).
5. **Read "Important things I found" below.** The first item (real-time chat with 4 server workers) affects users today and needs a decision from you.
6. **Optional settings** (backend environment variables; the defaults are fine):

| Variable | Default | What it does |
|---|---|---|
| `DB_POOL_SIZE` | `5` | Database connections kept open per worker |
| `DB_MAX_OVERFLOW` | `5` | Extra connections allowed under load, per worker |
| `CONTENT_CACHE_TTL` | `300` | Seconds subjects/topics/papers stay cached (`0` turns caching off) |
| `RATE_LIMIT_TRUST_FORWARDED` | `false` | Set to `true` on Render (see "Important things I found", item 2) |
| `AVATAR_BUCKET` | `avatars` | Supabase bucket used for profile pictures |

No database commands are needed: the new columns and indexes are added automatically the first time the new backend starts.

---

## Summary

| # | Improvement | Status |
|---|---|---|
| 1 | Profile pictures out of the database | ✅ Done (needs the `avatars` bucket and the migration script) |
| 2 | Pagination on list endpoints | ✅ Done |
| 3 | Cache subjects/papers | ✅ Done |
| 4 | Fix N+1 queries in community | ✅ Done (some were already fixed earlier; the rest are now done) |
| 5 | Rate limiting | ✅ Done (login/register limits already existed; added AI, chat, payment and upload limits) |
| 6 | Shared Supabase client | ✅ Already done before today (`utils.get_supabase`), no change needed |
| 7 | Badge checks in the background | ✅ Done |
| 8 | Database connection pool settings | ✅ Done |
| 9 | Split frontend vendor chunks | ✅ Already done before today (`vite.config.js`), no change needed |
| 10 | Composite indexes | ✅ Done (created automatically on startup) |
| 11 | Pomodoro sync across devices | ✅ Done |
| 12 | Soft deletes | ✅ Done for messages, shared notes and study groups |
| 13 | Database readiness check | ✅ Done (`/api/system/ready`, plus `/api/system/live`) |
| 14 | WebSocket rooms | ✅ Done |
| 15 | Error boundary per page | ✅ Done |

**Bonus bug fixed:** "Total Pomodoros", "Total Focus" and the streak on the Progress page were capped. They were counted from the session history, which only returns the latest 50 sessions, so anyone with more than 50 pomodoros saw wrong totals. They're now computed by the database from the full history.

---

## Details

### 1. Profile pictures → Supabase Storage
- **New endpoints:** `POST /api/v1/users/me/profile-pic` uploads an image (JPG/PNG/WebP/GIF, max 2MB) to the `avatars` bucket and saves only its URL. `DELETE` on the same path removes it.
- **Old pictures are tidied up:** replacing or removing a picture deletes the old file from storage.
- **Website:** the cropper and Dashboard upload work the same for users, but now upload a file instead of saving a large text blob.
- **Fallback:** if storage isn't configured on the server (503), the website automatically uses the old method, so nothing breaks.
- **The old method still works:** `PATCH /users/me` still accepts a base64 picture, so older clients keep working.
- **Mobile app:** `mobile/src/context/AuthContext.js` still uses the old base64 method. It works, but those pictures go back into the database. Update it to call the new endpoint when you next work on the mobile app.

### 2. Pagination
- **Flashcard collections and sets:** now `limit`/`offset`, default 100, max 200, newest first. Collections' cards load in one extra query instead of one per collection.
- **`/subjects`, `/topics`, `/papers`:** accept optional `limit`/`offset`. Without them they return everything, as before, so existing pages are unaffected.
- **Smaller subject and paper lists:**
  - `/subjects` and `/subjects/{id}` no longer include every past paper's full text. Each paper has `has_content: true/false` instead.
  - `/papers?include_content=false` returns the same lightweight list. The Past Papers page now uses it.
  - Opening a paper (`/papers/{id}`) still loads the full text.
  - The admin dashboard still uses the full list, since it edits the text.
- **Session history:** `/log/sessions` was already paginated. The new `/log/summary` gives totals and per-day numbers without downloading the history.

### 3. Content cache
- **What's cached:** subjects, topics and the lightweight paper list, in memory for 5 minutes.
- **When it clears:** every admin create/update/delete of a subject, topic or paper, diagram uploads, and data-entry uploads.
- **Limitation:**
  - Each of the 4 server workers has its own cache. An admin edit clears it immediately only in the worker that handled the edit; the others catch up within 5 minutes.
  - Papers processed by the Modal paper processor (which writes to the database directly) can also take up to 5 minutes to show as available.
  - If this matters, lower `CONTENT_CACHE_TTL`.
- **Tested:** the second request for subjects made **0 database queries**.

### 4. N+1 query fixes (community)
These now load users, votes, counts and badges in a fixed number of batched queries, whatever the list size:
- **Thread view** (replies and votes): tested at 7 queries in total for 5 replies.
- **Direct messages:** the conversation list (other user plus last message) and the message list (senders).
- **Study groups:** the community list (member counts and "am I a member"), group details (members) and "my groups".
- **Peer review and notes:** shared notes (creators), peer-review submissions (authors, feedback count, average rating) and feedback (reviewers).
- **Reputation:** a user's badges.

The members list, channel messages and leaderboard had already been fixed earlier.

### 5. Rate limiting
| What | Limit | Counted per |
|---|---|---|
| AI tutor chat, quiz, flashcards, paper grading, flashcards-from-file | 10/minute | user |
| Channel messages, replies, DMs | 30/minute | user |
| Payment initialize | 3/minute | user |
| Uploads (tutor documents, profile pictures) | 10/minute | user |
| Login 5/min, register 3/min, verify-email 10/min, resend 3/min | (already existed) | IP address |

Counting per user means students on the same school network don't use up each other's allowance. When the limit is hit, the API returns status 429 ("Too Many Requests").

### 7. Badges in the background
Badge checks run after the message or vote response has been sent, so sending is faster. The check also fetches only badges the user doesn't have yet.

### 8. Connection pool
- **Settings:** up to 5 + 5 connections per worker, which is 40 in total with 4 workers. That's inside Supabase's free-tier limit of about 60.
- **Stale connections:** connections are tested before use (Supabase silently drops idle ones, which caused occasional errors) and replaced every 5 minutes.

### 10. Composite indexes
Created automatically on startup, and safe to run repeatedly:
- **Channel messages:** channel + time.
- **Direct messages:** conversation + time.
- **Votes:** user + message.
- **Session logs:** user + time, and user + session key.

### 11. Pomodoro sync across devices
- **How it works:**
  - The timer state (mode, end time or paused time, count) is saved to the server whenever you start, pause, reset or switch modes.
  - When the app loads, or when you come back to the tab or app, it picks up a newer timer from another device.
  - The newest change wins, so an old device can't overwrite a newer one.
- **No double counting:** each finished pomodoro carries an ID (its end time). If two devices both finish the same synced pomodoro, the server counts it once.
- **Not synced:** coins, rewards, tasks and "today" tiles are still stored only on each device, as before. Syncing those would be a bigger change.

### 12. Soft deletes
- **Messages:** deleting hides the message and its replies everywhere, but keeps them (with their votes) in the database.
- **Study groups:** deleting hides the group and its private channel. Memberships and messages are kept.
- **Shared notes:** new endpoint `DELETE /api/v1/community/notes/{id}` (the note's creator or a community owner/admin). There's **no delete button in the app yet**.
- **To restore something**, run this in the Supabase SQL editor:
  ```sql
  UPDATE message    SET deleted_at = NULL WHERE id = 123;          -- also its replies: WHERE parent_id = 123
  UPDATE studygroup SET deleted_at = NULL WHERE id = '<group id>';
  UPDATE sharednote SET deleted_at = NULL WHERE id = '<note id>';
  ```
- **Deleting a whole channel** (an admin action) still removes everything permanently, as before.

### 13. Health checks
- **`/api/system/live`:** the process is running (no database call).
- **`/api/system/ready`:** the database is reachable; returns 503 if not.
- **`/api/system/health`:** unchanged, always 200. Leave your uptime pinger on it.

### 14. WebSocket rooms
- **How it works:** the app tells the server which channel each tab is viewing. Full message, edit and delete events go only to tabs viewing that channel.
- **Everyone else:** other members get a tiny "new activity in channel X" ping, which is all they need for the unread dot.
- **Privacy:** private study-group channels still only reach their members.
- **During the deploy:** people with an old version of the site open won't see live messages until they refresh.

### 15. Error boundary per page
If one page crashes, only that page shows "This page ran into a problem", with **Try again** and **Go to dashboard** buttons. The menu and the rest of the app keep working, and going to another page clears the error. Before, a crash anywhere blanked the whole app until a reload.

---

## ⚠️ Important things I found (not fixed, need your decision)

1. **Real-time chat probably only partly works in production.**
   - `start.sh` runs 4 gunicorn workers, and each one keeps its own list of connected users.
   - A message sent through worker A only reaches people whose live connection happens to be on worker A, so others see it only after a refresh.
   - This was already the case before today's changes.
   - **Options:**
     - Run 1 worker: change `-w 4` to `-w 1` in `backend/start.sh`. Simplest, but less capacity.
     - Add Redis (Render has a managed Redis) so workers share messages. I can build this if you want.
2. **Login and sign-up limits may be shared by all users.**
   - Behind Render's proxy, every request can appear to come from the same address. If so, the "5 logins per minute" limit applies to everyone combined.
   - **To check:** after deploying, if people report "Too many requests" at login, set `RATE_LIMIT_TRUST_FORWARDED=true`.
   - That setting uses the real visitor address Render passes along. I left it off by default because I couldn't confirm Render's proxy setup from here.
3. **The mobile app still saves profile pictures the old way** (see item 1 above).

---

## Testing done
- **Automated backend test: 31/31 passed.**
  - Subject lists are smaller, served from cache, and refresh after admin edits.
  - Paper light/full modes and pagination work.
  - Badges are awarded in the background.
  - Thread, DM and group query counts no longer grow with the list size.
  - Soft deletes hide messages, notes and groups but keep the rows.
  - The progress summary is correct and doesn't double count.
  - Timer sync keeps the newest change.
  - Rate limits trigger at the right point, per user.
  - Picture upload falls back correctly.
  - The readiness check works.
  - WebSocket rooms deliver to the right tabs.
- **Startup on an existing database:** new columns and indexes were added automatically.
- **Earlier features still pass:** admin access and email verification.
- **Frontend:** builds without errors.
- **Not tested:**
  - In a real browser.
  - Against your live Postgres database (tests used SQLite).
  - Real uploads to Supabase Storage.

  Please check these after deploying: Community chat (including unread dots), Progress page totals, the Pomodoro timer on two devices, and changing your profile picture.

---

## Files changed

**Backend**
- `app/database.py`: pool settings, automatic column and index upgrades
- `app/schemas.py`: soft-delete fields, indexes, session key, timer table, lightweight paper model, summary models
- `app/rate_limit.py` (new): shared limiter, per-user limits
- `app/cache.py` (new): in-memory content cache
- `app/websocket_manager.py`, `app/routes/websocket.py`: channel rooms
- `app/routes/community.py`: N+1 fixes, soft deletes, background badges, rate limits, note delete endpoint
- `app/routes/subjects.py`: cached and lightweight lists, pagination, AI grading limit
- `app/routes/flashcards.py`: pagination, AI limit
- `app/routes/tutor.py`, `app/routes/subscriptions.py`: rate limits
- `app/routes/users.py`: profile picture upload/delete
- `app/routes/system.py`: `/live` and `/ready`
- `app/routes/upload.py`, `app/routes/data_entry.py`: clear the cache on paper changes
- `app/main.py`: progress summary, timer sync endpoints, session de-duplication
- `migrate_profile_pics.py` (new): one-time picture migration

**Frontend**
- `App.jsx`, `components/ErrorBoundary.jsx`: per-page error boundary
- `context/CommunityContext.jsx`: channel rooms and activity pings
- `context/PomodoroContext.jsx`, `services/progressService.js`: timer sync, summary totals, session keys
- `pages/Progress.jsx`: uses the summary (fixes the capped totals)
- `pages/PastPapers.jsx`: lightweight paper list
- `context/AuthContext.jsx`: profile pictures uploaded as files
