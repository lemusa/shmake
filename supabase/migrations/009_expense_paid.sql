-- Add paid/unpaid tracking + invoice/due date to expenses
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_date date,
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS due_date date;

CREATE INDEX IF NOT EXISTS idx_expenses_paid ON expenses(paid);
CREATE INDEX IF NOT EXISTS idx_expenses_due ON expenses(due_date);
