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

## Does it work on both phone and PC in a browser?

Yes. Everything (welcome screen, tour, checklist, page tips and "Take the tour again") works in any browser on phones, tablets and computers. It changes shape to fit the screen:

| Screen width | What the user gets |
|---|---|
| Phone (under 640px) | Welcome screen slides up from the bottom. The tour opens the menu drawer and points at the links inside it, and its explanation card sits in whichever half of the screen isn't being highlighted. Tips run along the bottom of the screen. |
| Tablet / small laptop (640px–1279px) | Same drawer-based tour as phones, with a centred welcome card. |
| Desktop (1280px and wider) | Centred welcome card. The tour points at the links in the top nav bar. Tips sit in the bottom-left corner. |

Progress is saved to the account, not the device. A user who finishes the tour on their PC won't see it again on their phone.

**Tested:** in Chrome (headless) at phone (390px), small laptop (1024px) and desktop (1280px) widths.

**Not tested yet:** a real iPhone (Safari) or a real Android phone. Please check one of each during step 4 above.

**Doesn't cover:** the native mobile app built with Expo in `mobile/`. That's a separate app and needs its own version later. Opening the website in a phone's browser is fully covered.

**One existing limit:** the Study Suite page is blocked on phone-width screens (this was already the case). The tour and the checklist mention that it works on tablets and laptops.

## Fixed: Google sign-ups were asked their study goal twice

**Why it happened:** on the signup page (`/onboarding`), step 1 asks "What are you studying for?" and step 2 offers "Sign up with Google". The Google button only sent Google's login token to the server. The goal picked in step 1 was never sent, so the account was created without one, and the Dashboard welcome screen asked for it again.

**The fix:**
- `frontend/src/pages/Onboarding.jsx`: the Google button now sends the chosen goal along with the Google token.
- `backend/app/routes/google_auth.py`: the server now accepts that goal and saves it on the account. It only fills in an empty goal. An existing account that already has one keeps it.

**Expected behaviour after the fix:**
- **Google signup from the signup page** (goal picked first): the welcome screen skips the goal question.
- **"Sign in with Google" on the Login or Register page** (no goal picked yet): the welcome screen still asks for the goal once. That is intended.
- **Photo:** the welcome screen still asks for one, because the account doesn't copy the Google profile photo. It can be skipped.

**Deploy:** both the backend and the frontend need redeploying for this fix, backend first. If only the frontend goes out, the server ignores the goal and the bug stays.
