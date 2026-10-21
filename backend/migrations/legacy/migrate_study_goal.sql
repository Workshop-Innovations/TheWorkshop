-- Add study_goal column to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS study_goal VARCHAR;
