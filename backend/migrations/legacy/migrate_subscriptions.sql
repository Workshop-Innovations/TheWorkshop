-- =======================================================
-- Subscription Migration — Run this in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard → SQL Editor
-- =======================================================

-- Add subscription tier (default: basic)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR DEFAULT 'basic';

-- Add subscription expiry date
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMP WITH TIME ZONE;

-- Add Paystack customer tracking
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS paystack_customer_id VARCHAR;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS paystack_subscription_code VARCHAR;

-- Add daily AI usage tracking
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS ai_queries_today INTEGER DEFAULT 0;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS last_ai_query_date DATE;

-- Verify: Show current columns on the user table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user'
ORDER BY ordinal_position;
