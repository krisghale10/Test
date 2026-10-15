import { test } from "node:test";
import assert from "node:assert/strict";
import { seed } from "../lib/seed";
import { cash, safe, spending, forecast, RecordData } from "../lib/finance";
const day = "2026-10-15";
test("opening cash excludes expected income and scheduled bills", () => {
  assert.equal(cash(seed(), day), 7200000);
  assert.equal(safe(seed(), day), 5754558);
});
test("future actual income is excluded until its transaction date", () => {
  const r = seed();
  r.push({
    id: "future",
    kind: "transaction",
    name: "Future income",
    amount: 3000000,
    type: "income",
    date: "2026-10-31",
  });
  assert.equal(cash(r, day), 7200000);
});
test("card purchase records spending, settlement reduces cash exactly once", () => {
  const r = seed();
  r.push({
    id: "purchase",
    kind: "transaction",
    name: "Food",
    type: "expense",
    method: "Credit card",
    amount: 100000,
    date: day,
  });
  assert.equal(cash(r, day), 7200000);
  assert.equal(spending(r, "2026-10"), 100000);
  r.push({
    id: "repay",
    kind: "transaction",
    name: "Card settlement",
    type: "debt_payment",
    method: "Cash",
    amount: 100000,
    date: day,
  });
  assert.equal(cash(r, day), 7100000);
  assert.equal(spending(r, "2026-10"), 100000);
});
test("transfers do not count as spending or income", () => {
  const r = seed();
  r.push({
    id: "transfer",
    kind: "transaction",
    name: "Bank to cash",
    type: "transfer",
    amount: 200000,
    date: day,
  });
  assert.equal(cash(r, day), 7200000);
  assert.equal(spending(r, "2026-10"), 0);
});
test("voided corrections are excluded", () => {
  const r = seed();
  r.push({
    id: "void",
    kind: "transaction",
    name: "Mistake",
    type: "expense",
    amount: 20000,
    date: day,
    voided: true,
  });
  assert.equal(cash(r, day), 7200000);
});
test("forecast reconciles household rent without duplication and unverified exclusions", () => {
  const p = forecast(seed(), day, true);
  assert.equal(p.length, 12);
  assert.equal(p[0].month, "2026-10");
  assert.equal(p[0].income, 3900000);
  assert.equal(p[0].out, 7445442);
  assert.equal(p[0].balance, 3654558);
  assert.equal(p[1].out, 10266750);
  assert.equal(forecast(seed(), day, false)[0].income, 0);
});
test("SQLite idempotency, settlement, correction history and persistence", async () => {
  process.env.DATABASE_PATH =
    "/tmp/finance-test-" + crypto.randomUUID() + ".sqlite";
  const { all, mutate, audit } = await import("../lib/db");
  const r: RecordData = {
    id: "test-entry",
    kind: "transaction",
    name: "Test groceries",
    type: "expense",
    date: day,
    amount: 50000,
    method: "Cash",
  };
  mutate(r, "create");
  assert.throws(() => mutate(r, "create"), /Duplicate/);
  mutate({ ...r, amount: 40000 }, "update");
  assert.equal(all().find((x) => x.id === r.id)?.amount, 40000);
  assert.ok(audit().some((x) => x.record_id === r.id && x.before_json));
  const bill = all().find((x) => x.id === "bill-0")!;
  mutate(bill, "settle");
  assert.throws(() => mutate(bill, "settle"), /Already|Duplicate/);
  assert.equal(all().filter((x) => x.id === "payment-bill-0").length, 1);
  const settled = all().find((x) => x.id === "payment-bill-0")!;
  mutate({ ...settled, voided: true }, "update");
  assert.equal(all().find((x) => x.id === bill.id)?.status, "unpaid");
  mutate(bill, "settle");
  assert.equal(all().filter((x) => x.id === settled.id && !x.voided).length, 1);
  assert.equal(all().find((x) => x.id === bill.id)?.status, "paid");
  assert.throws(
    () => mutate({ ...r, id: "future", date: "2099-01-01" }, "create"),
    /date/,
  );
});

test("historical income before the opening snapshot cannot be counted twice", () => {
  const rows = seed();
  rows.push({
    id: "prior-salary",
    kind: "transaction",
    name: "Already included salary",
    amount: 3000000,
    date: "2026-10-14",
    type: "income",
  });
  assert.equal(cash(rows, day), 7200000);
});
test("overdue bills carry forward without replacing current month rent", () => {
  const rows = seed();
  const p = forecast(rows, "2026-11-01", false);
  assert.equal(p[0].out, 11712192);
});
