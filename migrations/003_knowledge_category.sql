-- ============================================================================
-- 003 — Portfolio: add "Knowledge" category for industry skills / domain expertise
-- ============================================================================
-- Knowledge entries are skills rather than projects: no year, no timeline,
-- rendered in their own section on the portfolio page.

INSERT INTO portfolio_categories (id, name, description, sort_order) VALUES
  (7, 'Knowledge', 'Industry-specific skills and domain expertise built over 20+ years in operations, manufacturing and technology — ongoing knowledge rather than discrete projects.', 6)
ON CONFLICT (name) DO NOTHING;

SELECT setval(pg_get_serial_sequence('portfolio_categories', 'id'), COALESCE((SELECT MAX(id) FROM portfolio_categories), 0));
