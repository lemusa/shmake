-- Add supplier field to expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS supplier text;
