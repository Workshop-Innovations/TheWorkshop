# New-User Walkthrough: Options for Web (PC) and Mobile

A planning doc for showing new users around The Workshop after they sign up: where each part of the app is, what it does, and getting key setup done, such as uploading a profile picture. It has no code, only approaches, trade-offs and a recommendation.

---

## 1. Where things stand today

Knowing this up front shapes which options fit best.

| Area | Current behaviour |
|---|---|
| **Web signup** (`/onboarding`) | 3 steps: study goal (JAMB / WAEC / Uni / General) → account details → plan selection → `/pricing`. Then email verification. |
| **Google sign-in** | Skips the onboarding wizard, so these users may never pick a study goal or see any intro. |
| **Profile picture** | `ProfilePictureGate` covers **only `/community`** with a full-screen blocking prompt. Users who never open Community never get asked. |
| **Desktop navbar** | Dashboard, Papers, Revision Notes, Study Suite, Feedback, avatar → Profile. **Community and Focus Timer are not in the desktop nav**, only in the mobile hamburger menu. Tasks, Progress, Rewards and Materials have no nav entry at all. |
| **Mobile web** | Hamburger drawer: Dashboard, Past Papers, Revision Notes, Study Suite, Community, Focus Timer, Feedback, My Profile. |
| **Native app** (Expo, `mobile/`) | A 3-slide intro carousel *before* login (Welcome / Master Your Time / Learn Together). Bottom tabs after login: **Home, Study, Community, Profile**. |
| **User record** | Has `study_goal`, `profile_pic` and `email_verified`, but **nothing tracks onboarding or tour progress**. |

**What this means:**
- Any walkthrough needs somewhere to store "has this user finished or skipped the tour, and which steps are done". That should be on the backend so it carries over between PC and phone, not only in the browser's local storage.
- Some features are hard to find on desktop because they aren't in the nav. A tour can't point at a button that doesn't exist, so either add those links or make the tour go through the Dashboard.

---

## 2. What the walkthrough should achieve

1. **Orientation:** the user knows where Dashboard, Past Papers, Revision Notes, Study Suite (AI tutor and flashcards), Community, Focus Timer/Pomodoro, Tasks, Progress, Rewards and Profile are.
2. **Setup:** they upload a profile picture, confirm their study goal (needed for Google sign-ups), and verify their email.
3. **First value:** they do one real thing, e.g. open a past paper, start a focus session or ask the tutor a question. People who do one real action early come back far more than people who only watched a tour.
4. **Skippable but resumable:** never trap people; let them replay it from Profile/Help.

---

## 3. Approaches

### Option A: Guided spotlight tour ("coach marks")
The screen dims and each step highlights one real UI element with a tooltip ("This is Past Papers, where you practise real exam questions"). Next / Back / Skip buttons, plus a step counter (3 of 7).

**PC (web, desktop):**
- Highlight navbar items left to right, then the avatar (→ "upload your picture here").
- Tooltips can sit beside or below each nav item, since there's plenty of room.
- Optional: the last step navigates to the Dashboard and highlights a key widget.

**Mobile web:**
- Nav items are hidden in the hamburger, so the tour must **open the drawer itself** and highlight the items inside it, or just highlight the hamburger icon and say "everything lives here".
- Tooltips should be bottom sheets, not floating bubbles; small screens clip bubbles.

**Native app:**
- Highlight the 4 bottom tabs one by one (Home → Study → Community → Profile). This is the easiest platform for it: only 4 targets and they never move.

| Pros | Cons |
|---|---|
| Points to the real UI, so it's easy to understand | People click "Skip" fast; they remember little of it |
| Familiar pattern | Breaks easily when the layout changes (needs upkeep) |
| Works well for the 4 native tabs | Awkward with the hidden mobile-web menu |

---

### Option B: "Getting Started" checklist (on the Dashboard)
A card at the top of the Dashboard with a progress bar and ticks:

- ☐ Upload a profile picture
- ☐ Confirm your study goal
- ☐ Verify your email
- ☐ Open your first past paper
- ☐ Try a 25-min focus session
- ☐ Ask the Study Suite tutor a question
- ☐ Say hi in Community

Each item links straight to the right page or opens the right modal. The card hides itself when everything's done, or can be dismissed.

**PC:** a wide card or a right-hand sidebar panel on the Dashboard. You could also add a small "Setup 3/7" ring next to the avatar in the navbar so it can be reached from any page.

**Mobile web:** a collapsible card at the top of the Dashboard. Keep each row big enough to tap (a whole-row tap target).

**Native app:** a card at the top of the Home tab, and/or a badge dot on the Profile tab until setup is done.

**Tie-in with gamification:** the app already has reputation points, badges and a Rewards store. Finishing the checklist could award a "Getting Started" badge or some points, which pushes users to actually finish it.

| Pros | Cons |
|---|---|
| Users learn by *doing*, so it sticks | Doesn't explain the *layout* on its own |
| Not intrusive; users go at their own pace | Easy to ignore if there's no reward |
| Very good for the profile-picture goal | Needs a step-tracking store on the backend |
| Same concept on PC, web and native | |

---

### Option C: Welcome modal / carousel after signup
A one-time screen (3–5 slides) shown on the first Dashboard visit: "Here's what you can do": Papers, Revision Notes, Study Suite, Community, Focus Timer. The final slide is "Upload your photo" with the upload button right there.

**PC:** a centred modal with an illustration or screenshot per slide.

**Mobile web:** a full-screen sheet with swipeable slides.

**Native app:** you already have a carousel, but it shows **before** login. Options:
1. Keep it as marketing for logged-out users, and add a separate post-signup carousel focused on "where things are".
2. Or move it to after signup and rewrite the slides around real features and tabs.

| Pros | Cons |
|---|---|
| Quick to build, low upkeep | Only describes features, doesn't point at them |
| Good first impression / sets the tone | Users swipe through without reading |
| Easy place to put the photo upload | One-off; no help later |

---

### Option D: Contextual first-visit hints (just-in-time)
No upfront tour. The **first time** a user opens each page, they see a small dismissible tip for that page:
- Past Papers: "Filter by subject and year. Tap a paper to start."
- Study Suite: "Ask the AI tutor anything, or make flashcards."
- Community: "Join a channel, find friends, check the leaderboard."
- Focus Timer: "Start a session; it keeps running in the corner while you study (minimised Pomodoro)."

**PC:** small tooltip or pulsing dot beside the main control on the page.

**Mobile web / native:** a slim banner at the top of the screen or a small bottom sheet, dismissed with one tap.

| Pros | Cons |
|---|---|
| Info shows up when it's relevant | No "here's everything" overview |
| Spread out, so not overwhelming | Pages users never visit never get explained |
| Scales as you add features | Need to track "seen" for each page |

---

### Option E: Required setup wizard (blocking)
After email verification, the user must complete a short setup before reaching the app: profile picture → study goal → (optional) subjects they're taking → done.

**Where to put the profile picture step:**
- **Inside the existing `/onboarding` wizard** as a new step, between account details and the plan. The downside: they may not be logged in or verified yet at that point.
- **Or a first-login wizard** that runs once after verification or Google sign-in. This is cleaner, and it catches Google users who skip `/onboarding` today.
- **Or make `ProfilePictureGate` global** instead of Community-only. Simplest, but it's the most forceful option.

**PC:** a centred card wizard (same style as the current onboarding).

**Mobile web:** a full-screen wizard; use the phone's native file picker, which offers Camera or Photo Library.

**Native app:** a full-screen stack before the tabs. **Note:** the native app currently has no image-picker package, so photo upload there needs a camera/gallery picker library added, plus permission prompts.

| Pros | Cons |
|---|---|
| Guarantees a profile picture | Friction right at signup can cause drop-off |
| Catches Google sign-in users | Users resent being forced, especially without a "skip for now" |
| Simple to reason about | |

**Softer version:** allow "Skip for now", but keep reminding (the checklist item, an avatar placeholder with a "+" badge, and the existing gate still enforced on Community).

---

### Option F: Empty states that teach
Make every empty screen a mini-guide: no tasks yet → "Add your first task" with an example; no progress yet → "Finish a focus session to see your stats here"; default avatar → "Add a photo" button in its place.

Works the same on every platform and needs no tour system. It's a good **supporting layer** for any other option, though it isn't enough on its own.

---

### Option G: Replayable help / "Take the tour again"
A "Help" or "Take the tour" entry in Profile (and the mobile drawer), plus a short FAQ. It isn't onboarding in itself, but it's what makes skipping safe for every other option.

---

## 4. Getting the profile picture: approaches ranked from soft to hard

1. **Placeholder nudge:** the default avatar shows a "+" or camera badge everywhere it appears (navbar, Profile tab).
2. **Checklist item:** top of the Getting Started list, with a reward.
3. **Welcome carousel last slide:** "Put a face to your name" with an upload button.
4. **Setup wizard step with "Skip for now".**
5. **Gate on social features** (what you have now, Community only). You could extend it to Peer Review, Study Groups and Leaderboard if they're reachable elsewhere.
6. **Global hard gate:** no app access without a photo. Not recommended; it's a lot of friction for students who just want to see a past paper.

**Mobile-specific details:**
- Offer both **"Take photo"** and **"Choose from gallery"**.
- Keep the crop step (already done on web with a cropper), and make it pinch-to-zoom friendly on touch.
- Compress before upload, since phone photos are large.
- On native, explain *why* before asking for camera or photo permission. A denied permission is hard to get back.

---

## 5. Recommended combo

The strongest setup is a **hybrid**:

1. **First login (all platforms):** a short **welcome modal/carousel (C)**, 3–4 slides max, ending on **profile picture upload** with "Skip for now". Also confirm the study goal here for Google sign-ups.
2. **Then, optionally, a short spotlight tour (A)**, offered with "Show me around" / "I'll explore myself":
   - PC: navbar items + avatar.
   - Mobile web: hamburger → drawer items.
   - Native: the 4 bottom tabs.
3. **Getting Started checklist (B)** on Dashboard/Home that stays until everything's done, with a badge or points reward. This is where the photo upload keeps getting nudged.
4. **Contextual first-visit hints (D)** on the bigger pages (Past Papers, Study Suite, Community, Focus Timer).
5. **Keep the Community photo gate** as the hard requirement for social features.
6. **"Take the tour again"** in Profile (G).

**Do these first, whichever option you pick:**
- Add **Community** and **Focus Timer** (and maybe Tasks/Progress/Rewards) to the **desktop navbar**, or group them under a "More" menu, so the tour has something to point at.
- Make sure Google sign-in users get the same first-login flow.

---

## 6. Data to store (backend, so it syncs across PC and phone)

- Has the user **seen the welcome screen**? (yes/no + date)
- **Tour status:** not started / completed / skipped
- **Checklist steps completed:** a list of step IDs (photo, goal, verified, first paper, first focus session, first tutor question, first community message)
- **Hints dismissed:** a list of page IDs
- Optionally **which platform they finished on**, for analytics

Most checklist items can be **worked out from data you already have** rather than stored separately: `profile_pic` set, `study_goal` set, `email_verified`, any session logs, any messages, any AI queries. Store only what can't be derived (tour seen/skipped, hints dismissed).

---

## 7. Things to measure

- % of new users who finish / skip the tour
- % with a profile picture after 1 day / 7 days (compare before and after launch)
- Checklist completion rate and which step people drop off at
- Day-1 and Day-7 return rate for users who did vs. didn't finish the checklist
- Split everything by **PC vs mobile web vs native**, since the experiences differ

---

## 8. Platform cheat sheet

| | PC (desktop web) | Mobile web | Native app |
|---|---|---|---|
| **Tour targets** | Navbar links + avatar | Hamburger → drawer items | 4 bottom tabs |
| **Tooltip style** | Floating bubble beside the item | Bottom sheet | Bottom sheet / overlay over the tab |
| **Welcome screen** | Centred modal | Full-screen swipe slides | Full-screen slides (post-login; the existing carousel is pre-login) |
| **Checklist placement** | Dashboard card or sidebar + navbar progress ring | Collapsible card on Dashboard | Card on Home tab + badge on Profile tab |
| **Photo upload** | File picker + cropper | Native picker (camera/gallery) + touch cropper | Needs image-picker library + permissions + cropper |
| **Main gotcha** | Some features missing from nav | Nav hidden behind the menu | No image picker yet; carousel is pre-login |
