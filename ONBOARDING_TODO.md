# Onboarding walkthrough: what you need to do

The web walkthrough is built but not deployed. You don't need any new environment variables, packages or settings. Here is what's left on your side.

## 1. Review and commit

Nothing is committed yet. Your own uncommitted changes to `BACKEND_MOVE_GUIDE.md` and `backend/app/main.py` are also in the working tree, so make sure each of those goes into the commit you mean it to. Claude can make the commit for you if you ask.

## 2. Deploy the backend before the frontend

The new frontend calls a new endpoint, `/api/v1/users/me/onboarding`. If the frontend goes live first, that call fails until the backend catches up. Users can still use the app normally in that window, but the walkthrough won't appear.

## 3. Check the database columns were added

When the backend starts, it should add four columns to the `user` table on its own:

- `welcome_seen`
- `tour_status`
- `checklist_dismissed`
- `onboarding_flags`

**To check:** open the Supabase Table Editor and look for those columns on the `user` table.

**If they're missing**, or the startup logs show a timeout:

1. Paste the contents of `backend/migrate_onboarding.sql` into the Supabase SQL Editor and run it. It's safe to run more than once.
2. Restart the backend.

## 4. Try it on the live site

Sign up with a fresh test account. Use one email signup and, if you can, one Google signup. Then check:

- [ ] The welcome screen appears on the Dashboard.
- [ ] You can upload a photo from the welcome screen.
- [ ] The tour runs on desktop.
- [ ] The tour runs on a phone.
- [ ] The Getting Started checklist ticks off as you do things.
- [ ] A tip appears the first time you open Past Papers and goes away after "Got it".
- [ ] "Take the tour again" on the Profile page restarts the tour.

Your existing account won't see the welcome screen, because existing accounts are marked as already welcomed. You'll still see the checklist and the page tips once.

## 5. Optional: let current users know

Existing users will notice the new checklist and tips. Desktop screens narrower than 1280px now show the hamburger menu instead of the full nav bar, which you might also want to mention.

## Not done yet (for later)

- No badge or points for finishing the checklist.
- The native mobile app (Expo) version hasn't been started. Photo upload there needs a camera/gallery picker library.

## Notes

- `pytest` was installed in your local `backend/venv` so the tests could run on your machine. It doesn't affect deployment.
- `npx eslint` reports "unused variable" errors on the new files. These are false alarms from your ESLint config, which doesn't count variables used only in JSX. The production build passes.
