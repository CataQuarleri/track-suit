# TrackSuit Architecture & Context Blueprint

## 1. Core Philosophy & System Identity
TrackSuit is a PWA mobile-first financial communication and settlement tool. 

**The Problem:** Traditional budgeting apps force users to track every cent of income and assign it to a category. When users share a credit card but pay it off from individual or shared accounts, standard apps fail to clearly communicate *which specific purchases* a lump-sum credit card payment actually covered.

**The Solution:** TrackSuit focuses on tracking targeted expenses ("Budgets") and creating a clear paper trail for credit card settlements. It does not require tracking income. It is a "Budget Tracker" and a "Settlement Engine."

## 2. Multi-Tenancy & User Isolation (The Family Model)
The system is built to support infinite scaling of groups and users, completely isolated from one another.
* **The Tenant (`Family`):** The top-level grouping entity. Contains one or more members, any piece of financial data that is "shared" is available for all members in the family.
* **The User (`Member`):** A user is part of one `Family` and can see the "shared" data of said family as well as it's own "private" financial data.
* **Data Isolation:** All database queries and Row Level Security (RLS) policies must validate against the `family_id` to ensure users can never access or leak data to another family.
### Privacy Model (Intra-Family RLS)
Beyond the strict `Family` isolation, entities must respect an internal privacy model enforced by PostgreSQL RLS.
* **Logic:** A user can mark any Account, Budget, or Transaction as either `shared` or `private`.
* **Implementation:** `shared` items are visible to all members of the `family_id`. `private` items are strictly visible only to the `member_id` who created them, allowing users to track shared household budgets alongside private money in the same app.

## 3. Technical Stack & Architectural Patterns
* **Frontend:** PWA - React (Vite) with TypeScript.
* **Styling:** Strictly modern Vanilla CSS (Custom properties, Flexbox/Grid, Container Queries). No utility frameworks like Tailwind or Bootstrap are permitted.
* **Frontend Architecture:** Feature-Sliced Design (FSD). The directory is organized by domain (e.g., `src/features/budgets`, `src/features/settlements`), not by file type. Each feature contains its own UI, API logic, and models.
* **Backend/Database:** Supabase (PostgreSQL). No custom Node.js middleware; the frontend communicates directly with Supabase via the client.
* **Data Pattern (Event Sourcing-Lite):** The database relies on an immutable, append-only ledger for transactions. SQL `UPDATE` statements are never used to change a financial amount; mistakes require appending a new compensating transaction. The frontend reads calculated balances dynamically via PostgreSQL Views (the "Read Model").


## 5. Core Entities & Business Logic

### A. Accounts (Informational Only)
* **Logic:** Accounts exist purely as descriptive labels to indicate where a payment came from (e.g., a checking account) or where a liability lives (e.g., a credit card).
* **Balance Implementation:** The system *does not* calculate account balances based on transaction history. Instead, accounts feature a manual text/number input field for the balance and a `last_updated` timestamp. This provides users with a quick reference point without forcing the app to act as a strict ledger.

### B. Budgets (The Pacing Engine)
* **Logic:** Budgets represent targeted spending goals. Instead of hardcoded weekly or monthly tables, Budgets use a "Behavioral Blueprint"—a JSON configuration that defines how the budget paces itself over time.
* **The Fluid Pacing Logic:** Allowances recalculate only at the start of a defined period to provide stable targets. 
    * *Formula:* `Target for current period = (Remaining Total Budget / Remaining Periods)`.
    * *Trigger:* The app determines the current period by evaluating `(Today's Date - starts_at date) / cadence_days`.

### C. Transactions (The Ledger)
* **Logic:** An immutable record of an expense.
* **Attributes:** A transaction tracks the amount, date, the user who paid, an optional `account_id` (source of funds), a `category` string (for filtering), and an optional `budget_id`.
* **Unbudgeted Spending:** If a transaction does not have a `budget_id`, it falls into the "General Activity Stream." Users can filter this stream by time and `category` to discover spending trends.

## 6. Specialized Workflows

### A. Credit Card Settlement (The Bundle)
* **The Problem:** When User A pays a lump sum to the credit card, User B needs to know exactly which purchases that payment covered.
* **The Logic:** A Credit Card payment is not logged as a standard expense. Instead, the UI provides a "Reconciliation Mode."
* **Implementation Flow:** 1. The user views a list of all un-reconciled credit card transactions.
    2. The user selects specific transactions.
    3. The app sums these up dynamically.
    4. The user submits the settlement. The database creates a `Settlement Record` containing: The User who paid, the date, an optional source Account, the total sum, a text note for communication, and a relational link to the selected transaction IDs (locking them as 'reconciled').

**Glosary:**
Family: Group of members that share personal finances (eg: a household, a couple, etc.)
Member: A user that interacts with the application
Account: A reference to the storage where a balance is located. 
Budget: A balance available at a certain moment for a specific expense category.
Expense: A type of transaction that reduces a balance.
Income: A type of transaction that increments a balance.
Balance: A total aggregate of all transactions in a specific moment for a certain budget or account.
Transaction: A record of an event that changes a balance.
Privacy: A category that can be applied to Account, Balance, Budget and Transactions. It can either be 'Shared' or 'Private'.

## 7. Icebox / Deferred Features (v2+) *DO NOT THINK ABOUT THIS UNTIL MENTIONED*
* **Reimbursable Expenses:** Tracking expenses that are meant to be paid back by an external entity (employer, friend) via a state toggle.
* **Transaction Splitting:** Breaking a single receipt into multiple budgets (e.g., splitting a $100 receipt into $80 Groceries and $20 Unbudgeted).

