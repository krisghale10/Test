export type RecordData = {
  id: string;
  kind: string;
  name: string;
  amount: number;
  date?: string | null;
  type?: string;
  category?: string;
  method?: string;
  status?: string;
  estimated?: boolean;
  note?: string;
  target?: number;
  monthly?: number;
  voided?: boolean;
  plannedMonth?: string;
};
export const peso = (n: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(n / 100);
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function cash(rows: RecordData[], asOf: string) {
  const openingDate = rows
    .filter(
      (r) =>
        r.kind === "transaction" &&
        r.type === "opening" &&
        !r.voided &&
        r.date &&
        r.date <= asOf,
    )
    .map((r) => r.date!)
    .sort()
    .at(-1);
  return rows
    .filter(
      (r) =>
        r.kind === "transaction" &&
        !r.voided &&
        r.date &&
        r.date <= asOf &&
        (!openingDate || r.date >= openingDate),
    )
    .reduce(
      (s, r) =>
        s +
        (["opening", "income"].includes(r.type || "")
          ? r.amount
          : ["expense", "debt_payment"].includes(r.type || "") &&
              r.method !== "Credit card"
            ? -r.amount
            : 0),
      0,
    );
}
export function spending(rows: RecordData[], month: string) {
  return rows
    .filter(
      (r) =>
        r.kind === "transaction" &&
        !r.voided &&
        r.type === "expense" &&
        r.date?.startsWith(month),
    )
    .reduce((s, r) => s + r.amount, 0);
}
export function reserved(rows: RecordData[]) {
  return rows
    .filter((r) => r.kind === "goal")
    .reduce((s, r) => s + r.amount, 0);
}
export function safe(rows: RecordData[], asOf: string) {
  return (
    cash(rows, asOf) -
    reserved(rows) -
    rows
      .filter(
        (r) =>
          r.kind === "bill" &&
          r.status !== "paid" &&
          ((r.date && r.date.slice(0, 7) <= asOf.slice(0, 7)) ||
            (!r.date &&
              (r.plannedMonth || r.note?.slice(0, 7) || "9999") <=
                asOf.slice(0, 7))),
      )
      .reduce((s, r) => s + r.amount, 0)
  );
}
export function forecast(
  rows: RecordData[],
  asOf: string,
  withIncome: boolean,
) {
  let balance = cash(rows, asOf);
  const baseline = rows.find((r) => r.kind === "plan")?.amount || 0;
  const budget = rows
    .filter((r) => r.kind === "budget")
    .reduce((s, r) => s + r.amount, 0);
  return Array.from({ length: 12 }, (_, i) => {
    const [year, monthNumber] = asOf.split("-").map(Number);
    const month = new Date(Date.UTC(year, monthNumber - 1 + i, 1))
      .toISOString()
      .slice(0, 7);
    const bills = rows.filter(
      (r) =>
        r.kind === "bill" &&
        r.status !== "paid" &&
        (r.date?.startsWith(month) ||
          (!r.date && (r.plannedMonth === month || r.note?.includes(month))) ||
          (i === 0 &&
            (r.date?.slice(0, 7) ||
              r.plannedMonth ||
              r.note?.slice(0, 7) ||
              "9999") < month)),
    );
    const rent = bills
      .filter(
        (r) =>
          r.category === "Rent" &&
          (r.date?.startsWith(month) || r.plannedMonth === month),
      )
      .reduce((s, r) => s + r.amount, 0);
    const household =
      i === 0 ? Math.max(0, budget - spending(rows, month)) : budget;
    const due = bills.reduce((s, r) => s + r.amount, 0);
    const income = withIncome
      ? i === 0
        ? rows
            .filter(
              (r) =>
                r.kind === "income" &&
                r.status === "expected" &&
                r.date?.startsWith(month),
            )
            .reduce((s, r) => s + r.amount, 0)
        : baseline
      : 0;
    const out = household + due - Math.min(rent, household);
    balance += income - out;
    return { month, income, out, balance };
  });
}
