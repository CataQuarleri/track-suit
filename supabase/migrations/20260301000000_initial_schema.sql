-- Enable UUID extension just in case
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: families (The Tenant)
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table: members (The User)
-- The 'id' maps directly to Supabase's auth.users table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table: transactions (The Ledger)
-- 'account_id' and 'budget_id' are defined as UUIDs without foreign keys yet, 
-- these will be linked when accounts and budgets tables are created in a later migration.
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    account_id UUID,
    budget_id UUID,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    category TEXT,
    privacy TEXT NOT NULL CHECK (privacy IN ('shared', 'private')) DEFAULT 'shared',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Helper function to safely get the current user's family_id
-- We use SECURITY DEFINER to allow it to bypass RLS while querying the members table,
-- but strictly bind the output to the authenticated user's ID.
CREATE OR REPLACE FUNCTION public.get_current_user_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM public.members WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- RLS Policies: families
-- ==========================================
CREATE POLICY "Users can view their own family"
    ON public.families FOR SELECT
    USING (id = public.get_current_user_family_id());

-- ==========================================
-- RLS Policies: members
-- ==========================================
CREATE POLICY "Users can view members of their own family"
    ON public.members FOR SELECT
    USING (family_id = public.get_current_user_family_id());

CREATE POLICY "Users can update their own member profile"
    ON public.members FOR UPDATE
    USING (id = auth.uid());

-- ==========================================
-- RLS Policies: transactions
-- ==========================================
-- 1. Multi-Tenancy AND Privacy Model
-- Visible IF in the same family AND (is shared OR belongs to me)
CREATE POLICY "Users can view transactions based on family and privacy"
    ON public.transactions FOR SELECT
    USING (
        family_id = public.get_current_user_family_id()
        AND (
            privacy = 'shared'
            OR
            (privacy = 'private' AND member_id = auth.uid())
        )
    );

-- 2. Insert Model
-- Can only insert for their own family, and explicitly must be the creator.
CREATE POLICY "Users can insert their own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (
        family_id = public.get_current_user_family_id()
        AND member_id = auth.uid()
    );

-- NOTE: No UPDATE or DELETE policies are created for 'transactions'.
-- This enforces the "Event Sourcing-Lite" architecture blueprint where the
-- transaction ledger is an immutable, append-only record.
