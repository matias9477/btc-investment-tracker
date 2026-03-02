-- Migration: Add Google Sheets configuration columns to user_settings
-- Run this in the Supabase SQL Editor

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS sheets_url text;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS sheets_col_date text DEFAULT 'A';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS sheets_col_price text DEFAULT 'B';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS sheets_col_amount text DEFAULT 'C';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS sheets_col_spent text DEFAULT 'D';
