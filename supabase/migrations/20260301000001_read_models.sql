-- ==========================================
-- Read Models (Views)
-- ==========================================
-- In the "Event Sourcing-Lite" architecture, balances are not stored 
-- as stateful columns that get updated. Instead, they are dynamically 
-- calculated from the immutable transactions ledger.

-- We use WITH (security_invoker = true) for these views. This is CRITICAL.
-- It ensures that when a user queries the view, Postgres evaluates the 
-- query using the RLS policies of the underlying 'transactions' table 
-- as that specific user. 
-- 
-- As a result, User A's calculated balance for a budget will automatically 
-- include 'shared' transactions + User A's 'private' transactions, while 
-- perfectly ignoring User B's 'private' transactions.

-- 1. View: budget_balances
-- Aggregates the total balance for each budget.
CREATE OR REPLACE VIEW public.budget_balances WITH (security_invoker = true) AS
SELECT 
    family_id,
    budget_id,
    SUM(amount) AS balance,
    COUNT(id) AS transaction_count,
    MAX(date) AS last_activity_date
FROM 
    public.transactions
WHERE 
    budget_id IS NOT NULL
GROUP BY 
    family_id, 
    budget_id;

-- 2. View: unbudgeted_activity_balances
-- Aggregates spending for the "General Activity Stream" (transactions without a budget_id).
-- Useful for filtering and discovering spending trends by category.
CREATE OR REPLACE VIEW public.unbudgeted_activity_balances WITH (security_invoker = true) AS
SELECT 
    family_id,
    category,
    SUM(amount) AS total_amount,
    COUNT(id) AS transaction_count,
    MAX(date) AS last_activity_date
FROM 
    public.transactions
WHERE 
    budget_id IS NULL
GROUP BY 
    family_id, 
    category;

-- 3. View: member_activity_summary
-- Summarizes total activity per member to see who is spending what.
CREATE OR REPLACE VIEW public.member_activity_summary WITH (security_invoker = true) AS
SELECT 
    family_id,
    member_id,
    SUM(amount) AS total_amount,
    COUNT(id) AS transaction_count
FROM 
    public.transactions
GROUP BY 
    family_id, 
    member_id;
