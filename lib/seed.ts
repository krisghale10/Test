import { RecordData } from "./finance";
export function seed(): RecordData[] {
  const out: RecordData[] = [
    {
      id: "opening",
      kind: "transaction",
      name: "Opening cash snapshot",
      type: "opening",
      amount: 7200000,
      date: "2026-10-15",
      note: "User-provided cash; includes first-half October salaries. Not bank verified.",
    },
    {
      id: "inc-husband",
      kind: "income",
      name: "Husband salary",
      amount: 900000,
      date: "2026-10-30",
      status: "expected",
    },
    {
      id: "inc-salary",
      kind: "income",
      name: "My salary",
      amount: 3000000,
      date: "2026-10-31",
      status: "expected",
    },
    {
      id: "baseline",
      kind: "plan",
      name: "Monthly income assumption",
      amount: 13500000,
      note: "Husband 18,000 · Biweekly job 60,000 baseline · Other job 47,000 · Side hustle 10,000. Not guaranteed.",
    },
    {
      id: "emergency",
      kind: "goal",
      name: "Emergency fund",
      amount: 0,
      target: 6000000,
      monthly: 0,
      note: "Starting savings unknown; zero is a planning assumption.",
    },
    {
      id: "lot",
      kind: "goal",
      name: "Our future lot",
      amount: 0,
      target: 100000000,
      monthly: 1000000,
      note: "₱1,000,000 target and ₱10,000 monthly are editable planning assumptions.",
    },
    {
      id: "unverified-1",
      kind: "unverified",
      name: "Atome unbilled",
      amount: 545996,
      note: "Unverified; excluded from debt totals.",
    },
    {
      id: "unverified-2",
      kind: "unverified",
      name: "Atome unbilled",
      amount: 1132288,
      note: "May overlap with ₱23,000 credit card. Do not add until reconciled.",
    },
  ];
  const bills: [string, number, string | null, string, boolean?][] = [
    ["App payment", 445442, "2026-10-15", "Debt"],
    ["Rent", 1000000, "2026-10-18", "Rent"],
    ["November payment", 561184, "2026-11-05", "Debt"],
    ["November payment", 119766, "2026-11-15", "Debt"],
    ["Panasonic loan", 285800, "2026-11-25", "Debt"],
    ["Credit card", 2300000, null, "Debt"],
    ["December payment", 405079, "2026-12-05", "Debt"],
    ["December payment", 48730, "2026-12-15", "Debt"],
    ["Panasonic installment", 285800, "2026-12-25", "Debt", true],
    ["January payment", 130704, "2027-01-05", "Debt"],
    ["Panasonic installment", 285800, "2027-01-25", "Debt", true],
  ];
  bills.forEach(([name, amount, date, category, estimated], i) =>
    out.push({
      id: "bill-" + i,
      kind: "bill",
      name,
      amount,
      date,
      category,
      status: "unpaid",
      estimated,
      plannedMonth: date?.slice(0, 7) || "2026-11",
      note: date
        ? "Opening scheduled obligation; outstanding principal unknown."
        : "2026-11 · Exact due date unknown; possible Atome overlap.",
    }),
  );
  Object.entries({
    Rent: 10000,
    Utilities: 6000,
    "Groceries and food": 20000,
    "Baby needs": 8000,
    Transportation: 6000,
    "Internet and phone": 3000,
    "Healthcare and insurance": 5000,
    "Household and personal care": 3500,
    "Family outings and personal": 3500,
    "Irregular expenses": 5000,
  }).forEach(([name, amount], i) =>
    out.push({ id: "budget-" + i, kind: "budget", name, amount: amount * 100 }),
  );
  return out;
}
