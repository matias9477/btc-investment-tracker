-- Migration: Add cell reference field for reading BTC balance directly from the spreadsheet
-- Run this in the Supabase SQL Editor

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS manual_btc_balance_cell text;
