-- New-user walkthrough columns on the user table.
-- The backend also adds these on startup (database._apply_migrations); run this in the
-- Supabase SQL Editor if startup migrations time out there.
-- Existing accounts get welcome_seen = TRUE so only new sign-ups see the welcome.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS welcome_seen BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS tour_status VARCHAR(20) NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS checklist_dismissed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS onboarding_flags VARCHAR NULL;
