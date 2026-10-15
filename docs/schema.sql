-- SQLite v1. Money in JSON bodies is integer PHP centavos.
-- Kinds: transaction, income (expected receipt), bill, budget, goal, plan, unverified.
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  body TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY,
  record_id TEXT NOT NULL,
  at TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
-- Writes and audit events share a BEGIN IMMEDIATE transaction.
-- Scheduled settlements use payment-<source ID> for idempotency.
-- Voiding a settlement reopens its source and retains the prior audit revisions.
