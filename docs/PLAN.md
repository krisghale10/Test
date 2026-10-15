# Our Family Finance — implementation plan

1. Establish an integer-centavo ledger, explicit transaction types, idempotency keys, and audit revisions.
2. Seed the 15 October opening snapshot, expected receipts, dated and undated obligations, and separate unverified amounts.
3. Build responsive dashboard, ledger, budget, income, debt/calendar, savings, and 12-month forecast views.
4. Support persistent entry, corrections, bill settlement, savings reservations, editable plans and CSV export.
5. Verify arithmetic, duplicate prevention, card settlement, persistence, build and HTTP behavior.

SQLite schema: `records(id TEXT PRIMARY KEY, kind TEXT, body TEXT JSON)` stores typed ledger, obligation, budget, goal and plan records. `audit(id INTEGER PRIMARY KEY, record_id TEXT, at TEXT, before_json TEXT, after_json TEXT)` preserves every creation and correction. `meta(key TEXT PRIMARY KEY,value TEXT)` provides versioned seed initialization. All writes use BEGIN IMMEDIATE and audit rows in the same transaction. Ledger amounts are positive integer centavos. A unique record ID provides request idempotency. Obligation settlement uses a deterministic payment ID; credit expenses and card repayments have distinct semantics. Historical opening liabilities are not fabricated as purchases. Goal contributions reserve cash rather than create income/expense. For PostgreSQL, replace the storage adapter with transactions, JSONB, unique IDs, and row locking; financial functions and UI remain independent.

Opening cash and monthly budget are user-supplied snapshots/plans, not independently verified bank balances. Savings starts at zero as a planning assumption. Unknown due dates remain null. Estimated installments stay labeled. Unverified Atome balances are excluded from confirmed obligations. The full outstanding loan principal is unknown.
