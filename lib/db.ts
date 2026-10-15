import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { seed } from "./seed";
import { RecordData, cash, reserved, today } from "./finance";
mkdirSync("data", { recursive: true });
const db = new DatabaseSync(process.env.DATABASE_PATH || "data/finance.sqlite");
db.exec(
  "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,kind TEXT NOT NULL,body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,record_id TEXT NOT NULL,at TEXT NOT NULL,before_json TEXT,after_json TEXT NOT NULL); CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT);",
);
function write(r: RecordData) {
  const before = db.prepare("SELECT body FROM records WHERE id=?").get(r.id) as
    { body: string } | undefined;
  db.prepare(
    "INSERT INTO records VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,body=excluded.body",
  ).run(r.id, r.kind, JSON.stringify(r));
  db.prepare(
    "INSERT INTO audit(record_id,at,before_json,after_json) VALUES(?,?,?,?)",
  ).run(
    r.id,
    new Date().toISOString(),
    before?.body || null,
    JSON.stringify(r),
  );
}
if (!db.prepare("SELECT value FROM meta WHERE key='seed'").get()) {
  db.exec("BEGIN IMMEDIATE");
  try {
    seed().forEach(write);
    db.exec("INSERT INTO meta VALUES('seed','1');COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export function all(): RecordData[] {
  return (
    db.prepare("SELECT body FROM records").all() as { body: string }[]
  ).map((x) => JSON.parse(x.body));
}
export function audit() {
  return db.prepare("SELECT * FROM audit ORDER BY id DESC LIMIT 200").all();
}
export function mutate(input: RecordData, action: string) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const rows = all();
    const old = rows.find((r) => r.id === input.id);
    if (action === "settle" || action === "receive") {
      if (!old || !["bill", "income"].includes(old.kind))
        throw Error("Record not found");
      if (old.status === "paid") throw Error("Already settled");
      const id = "payment-" + old.id;
      if (rows.some((r) => r.id === id && !r.voided))
        throw Error("Duplicate settlement");
      write({
        id,
        kind: "transaction",
        name: old.name,
        amount: old.amount,
        date: today(),
        type:
          old.kind === "income"
            ? "income"
            : old.category === "Rent"
              ? "expense"
              : "debt_payment",
        category: old.category,
        method: "Cash",
        note: "Settlement of " + old.id,
      });
      write({ ...old, status: "paid" });
    } else {
      if (
        !input.id ||
        !input.name?.trim() ||
        !Number.isSafeInteger(input.amount) ||
        input.amount < 0 ||
        input.amount > 1e12
      )
        throw Error("Valid name and amount required");
      if (action === "create") {
        if (old) throw Error("Duplicate transaction ID");
        if (!["transaction", "bill", "income"].includes(input.kind))
          throw Error("Invalid entry");
        if (input.kind === "transaction") {
          if (
            !["income", "expense", "transfer", "debt_payment"].includes(
              input.type || "",
            )
          )
            throw Error("Invalid transaction type");
          if (
            !input.date ||
            !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
            Number.isNaN(Date.parse(input.date)) ||
            input.date > today()
          )
            throw Error(
              "Actual transactions need a valid date on or before today",
            );
          if (input.amount <= 0) throw Error("Amount must be positive");
          if (
            !["Cash", "Bank / e-wallet", "Credit card"].includes(
              input.method || "",
            )
          )
            throw Error("Invalid payment method");
          if (input.method === "Credit card" && input.type !== "expense")
            throw Error("Credit card method is for purchases only");
        } else {
          input.status = input.kind === "bill" ? "unpaid" : "expected";
          if (
            input.date &&
            (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
              Number.isNaN(Date.parse(input.date)))
          )
            throw Error("Invalid date");
        }
      } else if (!old) throw Error("Record not found");
      else {
        input = {
          ...old,
          name: input.name,
          amount: input.amount,
          target: input.target ?? old.target,
          monthly: input.monthly ?? old.monthly,
          plannedMonth: input.plannedMonth ?? old.plannedMonth,
          voided: input.voided ?? old.voided,
          ...(["bill", "income"].includes(old.kind)
            ? { date: input.date === undefined ? old.date : input.date }
            : {}),
        };
        if (["bill", "income"].includes(old.kind) && old.status === "paid")
          throw Error(
            "Correct the actual settlement transaction in the ledger instead",
          );
        if (
          input.date &&
          (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
            Number.isNaN(Date.parse(input.date)))
        )
          throw Error("Invalid date");
        if (old.kind === "transaction" && old.id.startsWith("payment-")) {
          const source = rows.find((r) => r.id === old.id.slice(8));
          if (source) {
            if (input.amount !== old.amount)
              throw Error(
                "Void this settlement, correct the schedule, then mark paid again",
              );
            write({
              ...source,
              status: input.voided
                ? source.kind === "bill"
                  ? "unpaid"
                  : "expected"
                : "paid",
            });
          }
        }
        if (old.kind === "transaction" && old.type === "opening")
          throw Error("Opening snapshot is protected");
      }
      if (
        input.kind === "goal" &&
        (!Number.isSafeInteger(input.target) ||
          input.target! <= 0 ||
          !Number.isSafeInteger(input.monthly) ||
          input.monthly! < 0)
      )
        throw Error("Valid target and monthly contribution required");
      if (
        input.kind === "goal" &&
        reserved(rows.filter((r) => r.id !== input.id)) + input.amount >
          cash(rows, today())
      )
        throw Error("Reservations exceed available cash");
      write(input);
    }
    db.exec("COMMIT");
    return all();
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
