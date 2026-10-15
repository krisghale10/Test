"use client";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  CreditCard,
  CalendarDays,
  Target,
  TrendingUp,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  ShieldCheck,
  Heart,
  X,
  Menu,
  Check,
  House,
  Leaf,
} from "lucide-react";
import {
  RecordData,
  peso,
  cash,
  safe,
  reserved,
  spending,
  forecast,
  today,
} from "../lib/finance";
const tabs = [
  ["Overview", LayoutDashboard],
  ["Transactions", ArrowLeftRight],
  ["Income", Wallet],
  ["Budget", CreditCard],
  ["Bills & debts", CalendarDays],
  ["Savings goals", Target],
  ["Forecast", TrendingUp],
] as const;
const dateLabel = (d?: string | null) =>
  d
    ? new Intl.DateTimeFormat("en-PH", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Manila",
      }).format(new Date(d + "T00:00:00+08:00"))
    : "November · date to confirm";
export default function Home() {
  const [rows, setRows] = useState<RecordData[]>([]),
    [tab, setTab] = useState("Overview"),
    [modal, setModal] = useState<RecordData | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [assume, setAssume] = useState(true),
    [month, setMonth] = useState("2026-10"),
    [history, setHistory] = useState<any[] | null>(null);
  const asOf = today();
  useEffect(() => {
    fetch("/api/finance")
      .then((r) => {
        if (!r.ok) throw Error("Could not load ledger");
        return r.json();
      })
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  async function save(record: RecordData, action = "update") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record, action }),
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error);
      setRows(data);
      setModal(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function entry() {
    setModal({
      id: crypto.randomUUID(),
      kind: "transaction",
      name: "",
      amount: 0,
      date: asOf,
      type: "expense",
      category: "Groceries and food",
      method: "Cash",
    });
  }
  const bills = rows.filter((r) => r.kind === "bill"),
    budgets = rows.filter((r) => r.kind === "budget"),
    goals = rows.filter((r) => r.kind === "goal"),
    upcoming = bills
      .filter((r) => r.status !== "paid")
      .sort((a, b) =>
        (a.date || "2026-11-30").localeCompare(b.date || "2026-11-30"),
      ),
    transactions = rows
      .filter((r) => r.kind === "transaction")
      .sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    expected = rows
      .filter((r) => r.kind === "income" && r.status === "expected")
      .reduce((s, r) => s + r.amount, 0),
    budget = budgets.reduce((s, r) => s + r.amount, 0),
    projection = forecast(rows, asOf, assume);
  const edit = (r: RecordData) => setModal({ ...r });
  return (
    <div className="shell">
      <aside>
        <a className="brand" href="/" aria-label="Our Family Finance home">
          <span className="brand-icon">
            <House size={23} />
          </span>
          <span>
            our family<span className="brand-sub">FINANCE</span>
          </span>
        </a>
        <div className="family-chip">
          <div className="avatars">
            <b>K</b>
            <b>J</b>
            <b>♡</b>
          </div>
          <span>
            Our little family<small>Philippines · PHP</small>
          </span>
        </div>
        <p className="nav-caption">YOUR MONEY, TOGETHER</p>
        <nav>
          {tabs.map(([name, Icon]) => (
            <button
              className={tab === name ? "active" : ""}
              key={name}
              onClick={() => setTab(name)}
            >
              <Icon size={19} />
              {name}
              {name === "Bills & debts" && (
                <small className="badge">{upcoming.length}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="plant">
            <Leaf size={24} />
            <h4>Small steps. Big futures.</h4>
            <p>
              A little intention today.
              <br />
              More possibilities tomorrow.
            </p>
          </div>
          <div className="private">
            <ShieldCheck size={16} /> Your family’s private space
          </div>
        </div>
      </aside>
      <main>
        <header>
          <div className="breadcrumb">
            Our family <ChevronRight size={14} /> <strong>{tab}</strong>
          </div>
          <div className="header-right">
            <span className="local-dot" /> Local workspace{" "}
            <div className="profile">F</div>
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">A LITTLE CLARITY, EVERY DAY</div>
              <h1>{tab === "Overview" ? "Home is where we plan." : tab}</h1>
              <p>
                {tab === "Overview"
                  ? "A clear picture of today. A little more confidence for tomorrow."
                  : "Make room for what matters to your family."}
              </p>
            </div>
            <button className="primary" onClick={entry}>
              <Plus size={17} /> Add transaction
            </button>
          </div>
          {error && (
            <div role="alert" className="alert">
              {error}
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </div>
          )}
          {loading ? (
            <p>Opening your family ledger…</p>
          ) : (
            <>
              <div className="period-row">
                <div>
                  <CalendarDays size={16} />
                  <input
                    aria-label="Reporting month"
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  />
                </div>
                <span>Cash as of {dateLabel(asOf)} · Asia/Manila</span>
              </div>
              {tab === "Overview" && (
                <>
                  <div className="stats">
                    <div className="stat cash-card">
                      <div className="stat-label">
                        Actual available cash <Wallet size={18} />
                      </div>
                      <h2>{peso(cash(rows, asOf))}</h2>
                      <span className="pill">
                        <span /> Received money only
                      </span>
                      <small>Opening snapshot + actual cash movements</small>
                    </div>
                    <div className="stat">
                      <div className="stat-label">
                        Safe to spend <ShieldCheck size={18} />
                      </div>
                      <h2>{peso(safe(rows, asOf))}</h2>
                      <span className="stat-note green">
                        After this month’s bills & savings
                      </span>
                      <small>Before remaining household spending</small>
                    </div>
                    <div className="stat">
                      <div className="stat-label">
                        Expected income <ArrowDownLeft size={18} />
                      </div>
                      <h2>{peso(expected)}</h2>
                      <span className="stat-note">
                        Pending expected receipts
                      </span>
                      <small>Separate from available cash</small>
                    </div>
                    <div className="stat">
                      <div className="stat-label">
                        Reserved savings <Target size={18} />
                      </div>
                      <h2>{peso(reserved(rows))}</h2>
                      <span className="stat-note green">
                        Building a little peace of mind
                      </span>
                      <small>Reserved within your cash balance</small>
                    </div>
                  </div>
                  <div className="dashboard-grid">
                    <section className="panel cashflow">
                      <div className="section-top">
                        <div>
                          <h3>A view of the months ahead</h3>
                          <p>Projected closing cash · planning scenario</p>
                        </div>
                        <button
                          className="text-btn"
                          onClick={() => setTab("Forecast")}
                        >
                          View forecast <ArrowUpRight size={15} />
                        </button>
                      </div>
                      <Chart data={projection.slice(0, 6)} />
                      <div className="chart-legend">
                        <span>
                          <i /> Projected cash
                        </span>
                        <span className="muted">
                          {peso(
                            rows.find((r) => r.kind === "plan")?.amount || 0,
                          )}{" "}
                          monthly income assumption · not guaranteed
                        </span>
                      </div>
                    </section>
                    <section className="panel">
                      <div className="section-top">
                        <h3>Coming up next</h3>
                        <span className="amber-tag">
                          {
                            upcoming.filter((r) => r.date?.startsWith(month))
                              .length
                          }{" "}
                          this month
                        </span>
                      </div>
                      <div>
                        {upcoming.slice(0, 3).map((r) => (
                          <div className="bill-row" key={r.id}>
                            <div className="date-box">
                              <span>
                                {r.date
                                  ? new Date(
                                      r.date + "T12:00:00",
                                    ).toLocaleString("en-PH", {
                                      month: "short",
                                    })
                                  : "NOV"}
                              </span>
                              <b>{r.date ? r.date.slice(8) : "?"}</b>
                            </div>
                            <div className="grow">
                              <strong>{r.name}</strong>
                              <small>
                                {r.estimated
                                  ? "Estimated installment"
                                  : "Scheduled · unpaid"}
                              </small>
                            </div>
                            <b>{peso(r.amount)}</b>
                          </div>
                        ))}
                      </div>
                      <button
                        className="full-link"
                        onClick={() => setTab("Bills & debts")}
                      >
                        See all bills <ChevronRight size={16} />
                      </button>
                    </section>
                    <section className="panel">
                      <div className="section-top">
                        <div>
                          <h3>A plan for everyday living</h3>
                          <p>
                            {peso(spending(rows, month))} spent of{" "}
                            {peso(budget)} budget
                          </p>
                        </div>
                        <button
                          className="text-btn"
                          onClick={() => setTab("Budget")}
                        >
                          View budget <ArrowUpRight size={15} />
                        </button>
                      </div>
                      {budgets.slice(0, 4).map((b, i) => {
                        const amount = transactions
                          .filter(
                            (r) =>
                              r.type === "expense" &&
                              !r.voided &&
                              r.category === b.name &&
                              r.date?.startsWith(month),
                          )
                          .reduce((s, r) => s + r.amount, 0);
                        return (
                          <div className="budget-line" key={b.id}>
                            <div>
                              <span>
                                <i className={"category-dot dot-" + i} />
                                {b.name}
                              </span>
                              <small>
                                {peso(amount)} <em>/ {peso(b.amount)}</em>
                              </small>
                            </div>
                            <div className="progress">
                              <span
                                style={{
                                  width:
                                    Math.min(100, (amount / b.amount) * 100) +
                                    "%",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <div className="hint">
                        Your household plan totals ₱70,000 per month.
                      </div>
                    </section>
                    <section className="panel goals-panel">
                      <div className="section-top">
                        <h3>For the life we’re building</h3>
                        <Heart size={18} />
                      </div>
                      {goals.map((g, i) => (
                        <div className="goal-preview" key={g.id}>
                          <div className={"goal-icon " + (i ? "sand" : "")}>
                            {i ? (
                              <House size={21} />
                            ) : (
                              <ShieldCheck size={21} />
                            )}
                          </div>
                          <div className="grow">
                            <h4>{g.name}</h4>
                            <p>
                              {peso(g.amount)}{" "}
                              <span>of {peso(g.target || 0)}</span>
                            </p>
                            <div className="progress">
                              <span
                                style={{
                                  width:
                                    Math.min(
                                      100,
                                      (g.amount / (g.target || 1)) * 100,
                                    ) + "%",
                                }}
                              />
                            </div>
                          </div>
                          <button
                            aria-label={"Edit " + g.name}
                            className="icon-btn"
                            onClick={() => edit(g)}
                          >
                            <ChevronRight size={17} />
                          </button>
                        </div>
                      ))}
                      <p className="assumption">
                        Starting savings are unknown. Zero balances and the lot
                        target are editable planning assumptions.
                      </p>
                      <button
                        className="full-link"
                        onClick={() => setTab("Savings goals")}
                      >
                        Make room for your goals <ArrowUpRight size={16} />
                      </button>
                    </section>
                  </div>
                  <div className="note-banner">
                    <ShieldCheck size={20} />
                    <div>
                      <strong>
                        A thoughtful plan starts with honest numbers.
                      </strong>
                      <p>
                        Unverified Atome balances are kept separate. Expected
                        income never increases your cash on hand.
                      </p>
                    </div>
                    <button
                      className="text-btn"
                      onClick={() => setTab("Bills & debts")}
                    >
                      Review balances <ChevronRight size={15} />
                    </button>
                  </div>
                </>
              )}
              {tab === "Transactions" && (
                <section className="panel">
                  <div className="section-top">
                    <div>
                      <h3>Your financial ledger</h3>
                      <p>
                        Actual transactions · corrections preserve an audit
                        history
                      </p>
                    </div>
                    <a className="secondary" href="/api/finance?csv=1">
                      <Download size={16} /> Export CSV
                    </a>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Transaction</th>
                          <th>Date</th>
                          <th>Type / method</th>
                          <th>Amount</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((r) => (
                          <tr key={r.id}>
                            <td>
                              <strong>{r.name}</strong>
                              <small>
                                {r.category || r.note}
                                {r.voided ? " · VOIDED" : ""}
                              </small>
                            </td>
                            <td>{dateLabel(r.date)}</td>
                            <td>
                              {r.type}
                              <small>{r.method}</small>
                            </td>
                            <td>{peso(r.amount)}</td>
                            <td>
                              {r.type !== "opening" && (
                                <button
                                  className="text-btn"
                                  onClick={() => edit(r)}
                                >
                                  Correct
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    className="text-btn"
                    onClick={async () => {
                      const r = await fetch("/api/finance?audit=1");
                      setHistory(await r.json());
                    }}
                  >
                    View audit history
                  </button>
                  {history && (
                    <div className="audit">
                      {history.map((r) => (
                        <p key={r.id}>
                          #{r.id} · {r.at} · {r.record_id} ·{" "}
                          {r.before_json ? "Corrected" : "Created"}
                        </p>
                      ))}
                    </div>
                  )}
                </section>
              )}
              {tab === "Income" && (
                <>
                  <button
                    className="secondary section-add"
                    onClick={() =>
                      setModal({
                        id: crypto.randomUUID(),
                        kind: "income",
                        name: "",
                        amount: 0,
                        date: null,
                        status: "expected",
                      })
                    }
                  >
                    <Plus size={16} /> Add expected income
                  </button>
                  <div className="two-col">
                    {rows
                      .filter((r) => r.kind === "income")
                      .map((r) => (
                        <section className="panel" key={r.id}>
                          <div className="section-top">
                            <h3>{r.name}</h3>
                            <span className="amber-tag">
                              {r.status === "paid" ? "Received" : "Expected"}
                            </span>
                          </div>
                          <h2>{peso(r.amount)}</h2>
                          <p>{dateLabel(r.date)}</p>
                          <p>Only increases cash when marked received.</p>
                          <div className="actions">
                            <button
                              className="secondary"
                              onClick={() => edit(r)}
                            >
                              Edit plan
                            </button>
                            {r.status !== "paid" && (
                              <button
                                disabled={busy}
                                className="primary"
                                onClick={() => save(r, "receive")}
                              >
                                <Check size={16} /> Mark received today
                              </button>
                            )}
                          </div>
                        </section>
                      ))}
                  </div>
                  <section className="panel spaced">
                    <h3>Monthly budgeting baseline</h3>
                    <h2>
                      {peso(rows.find((r) => r.kind === "plan")?.amount || 0)}
                    </h2>
                    <p>
                      Husband ₱18,000 · Biweekly job ₱60,000 · Other job ₱47,000
                      · Side hustle ₱10,000
                    </p>
                    <p>This is a forecast assumption, never cash on hand.</p>
                    <button
                      className="text-btn"
                      onClick={() => edit(rows.find((r) => r.kind === "plan")!)}
                    >
                      Adjust baseline
                    </button>
                  </section>
                </>
              )}
              {tab === "Budget" && (
                <section className="panel">
                  <div className="section-top">
                    <div>
                      <h3>Monthly household budget</h3>
                      <p>
                        {peso(spending(rows, month))} spent · {peso(budget)}{" "}
                        planned
                      </p>
                    </div>
                    <span className="green-tag">Target ₱70,000</span>
                  </div>
                  {budgets.map((b, i) => {
                    const used = transactions
                      .filter(
                        (r) =>
                          !r.voided &&
                          r.type === "expense" &&
                          r.category === b.name &&
                          r.date?.startsWith(month),
                      )
                      .reduce((s, r) => s + r.amount, 0);
                    return (
                      <div className="budget-edit" key={b.id}>
                        <div className="grow">
                          <div className="section-top">
                            <strong>{b.name}</strong>
                            <span>
                              {peso(used)} / {peso(b.amount)}
                            </span>
                          </div>
                          <div className="progress">
                            <span
                              style={{
                                width:
                                  Math.min(
                                    100,
                                    (used / (b.amount || 1)) * 100,
                                  ) + "%",
                              }}
                            />
                          </div>
                        </div>
                        <button className="secondary" onClick={() => edit(b)}>
                          Edit limit
                        </button>
                      </div>
                    );
                  })}
                </section>
              )}
              {tab === "Bills & debts" && (
                <>
                  <button
                    className="secondary section-add"
                    onClick={() =>
                      setModal({
                        id: crypto.randomUUID(),
                        kind: "bill",
                        name: "",
                        amount: 0,
                        date: null,
                        status: "unpaid",
                        category: "Debt",
                        plannedMonth: asOf.slice(0, 7),
                      })
                    }
                  >
                    <Plus size={16} /> Add scheduled obligation
                  </button>
                  <section className="panel">
                    <div className="section-top">
                      <div>
                        <h3>Payment calendar</h3>
                        <p>
                          Confirmed scheduled payments{" "}
                          {peso(
                            bills
                              .filter(
                                (r) => r.status !== "paid" && !r.estimated,
                              )
                              .reduce((s, r) => s + r.amount, 0),
                          )}{" "}
                          · estimates shown separately
                        </p>
                      </div>
                    </div>
                    <p className="assumption">
                      Scheduled obligations are not verified total loan
                      balances. Rent is a household bill. Credit card settlement
                      reduces cash without recording the purchase twice.
                    </p>
                    {bills.map((r) => (
                      <div className="bill-row" key={r.id}>
                        <div className="date-box">
                          <span>{r.date?.slice(5, 7) || "NOV"}</span>
                          <b>{r.date?.slice(8) || "?"}</b>
                        </div>
                        <div className="grow">
                          <strong>{r.name}</strong>
                          <small>
                            {dateLabel(r.date)} ·{" "}
                            {r.estimated ? "Estimate" : r.status} · {r.category}
                          </small>
                        </div>
                        <b>{peso(r.amount)}</b>
                        <button className="text-btn" onClick={() => edit(r)}>
                          Edit
                        </button>
                        {r.status !== "paid" && (
                          <button
                            disabled={busy}
                            className="secondary"
                            onClick={() => save(r, "settle")}
                          >
                            Mark paid
                          </button>
                        )}
                      </div>
                    ))}
                  </section>
                  <section className="panel spaced warning">
                    <h3>Needs a closer look</h3>
                    {rows
                      .filter((r) => r.kind === "unverified")
                      .map((r) => (
                        <div className="bill-row" key={r.id}>
                          <div className="grow">
                            <strong>
                              {r.name} · {peso(r.amount)}
                            </strong>
                            <small>{r.note}</small>
                          </div>
                          <span className="amber-tag">Unverified</span>
                        </div>
                      ))}
                    <p>
                      These balances are excluded from confirmed debt and
                      forecasts. Reconcile the potential overlap against the
                      credit card statement first.
                    </p>
                  </section>
                </>
              )}
              {tab === "Savings goals" && (
                <div className="two-col">
                  {goals.map((g) => (
                    <section className="panel" key={g.id}>
                      <div className="section-top">
                        <h3>{g.name}</h3>
                        <Target size={20} />
                      </div>
                      <h2>{peso(g.amount)}</h2>
                      <p>Reserved of {peso(g.target || 0)} target</p>
                      <div className="progress">
                        <span
                          style={{
                            width:
                              Math.min(
                                100,
                                (g.amount / (g.target || 1)) * 100,
                              ) + "%",
                          }}
                        />
                      </div>
                      <p>{g.note}</p>
                      {g.id === "emergency" ? (
                        <div className="milestones">
                          {[6000000, 18000000, 36000000].map((n) => (
                            <span
                              key={n}
                              className={
                                g.amount >= n ? "green-tag" : "amber-tag"
                              }
                            >
                              {peso(n)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p>Monthly contribution plan: {peso(g.monthly || 0)}</p>
                      )}
                      <button className="primary" onClick={() => edit(g)}>
                        Update savings plan
                      </button>
                      <p className="assumption">
                        Reservations stay inside total cash. They are neither
                        income nor spending. No automatic future contributions.
                      </p>
                    </section>
                  ))}
                </div>
              )}
              {tab === "Forecast" && (
                <section className="panel">
                  <div className="section-top">
                    <div>
                      <h3>The next 12 months</h3>
                      <p>
                        {projection[0].month}–{projection[11].month} · closing
                        cash, including reserved savings
                      </p>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={assume}
                        onChange={(e) => setAssume(e.target.checked)}
                      />{" "}
                      Include income assumptions
                    </label>
                  </div>
                  <Chart data={projection} />
                  <p className="assumption">
                    October starts with actual cash, remaining full-month budget
                    less recorded spending, and expected October salaries if
                    enabled. Later months use the editable income baseline and
                    household budget. Scheduled rent replaces budget rent; debt
                    payments are additional. Undated November card bill is
                    reserved in November without inventing a day. Estimates
                    included. Future savings contributions are not automatic.
                    Existing credit purchases are included in spending; future
                    repayments must be scheduled separately.
                  </p>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Assumed income</th>
                          <th>Planned outflow</th>
                          <th>Closing cash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projection.map((r) => (
                          <tr key={r.month}>
                            <td>{r.month}</td>
                            <td>{peso(r.income)}</td>
                            <td>{peso(r.out)}</td>
                            <td
                              className={r.balance < 0 ? "negative" : "green"}
                            >
                              {peso(r.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <a
                    className="secondary"
                    download="cashflow-forecast.csv"
                    href={
                      "data:text/csv;charset=utf-8," +
                      encodeURIComponent(
                        "Month,Assumed income PHP,Planned outflow PHP,Closing cash PHP\n" +
                          projection
                            .map((r) =>
                              [
                                r.month,
                                r.income / 100,
                                r.out / 100,
                                r.balance / 100,
                              ].join(","),
                            )
                            .join("\n"),
                      )
                    }
                  >
                    <Download size={16} /> Export forecast
                  </a>
                </section>
              )}
              <footer>
                <span>Made for your family. Planned with care.</span>
                <span>
                  ₱ PHP · Asia/Manila <Heart size={12} />
                </span>
              </footer>
            </>
          )}
        </div>
      </main>
      {modal && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Edit financial record"
          >
            <div className="section-top">
              <div>
                <div className="eyebrow">YOUR FAMILY LEDGER</div>
                <h3>
                  {rows.some((r) => r.id === modal.id)
                    ? "Update record"
                    : modal.kind === "transaction"
                      ? "Add a transaction"
                      : modal.kind === "bill"
                        ? "Schedule an obligation"
                        : "Plan expected income"}
                </h3>
              </div>
              <button
                className="icon-btn"
                onClick={() => setModal(null)}
                aria-label="Close"
              >
                <X />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save(
                  modal,
                  rows.some((r) => r.id === modal.id) ? "update" : "create",
                );
              }}
            >
              <label>
                Description
                <input
                  required
                  value={modal.name}
                  onChange={(e) => setModal({ ...modal, name: e.target.value })}
                />
              </label>
              <label>
                {modal.kind === "goal" ? "Reserved cash" : "Amount"} (₱)
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={modal.amount / 100}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      amount: Math.round(Number(e.target.value) * 100),
                    })
                  }
                />
              </label>
              {modal.kind === "transaction" &&
                !rows.some((r) => r.id === modal.id) && (
                  <>
                    <div className="two-col">
                      <label>
                        Transaction type
                        <select
                          value={modal.type}
                          onChange={(e) =>
                            setModal({
                              ...modal,
                              type: e.target.value,
                              method: "Cash",
                            })
                          }
                        >
                          <option value="expense">
                            Expense / card purchase
                          </option>
                          <option value="income">Received income</option>
                          <option value="debt_payment">
                            Debt / card repayment
                          </option>
                          <option value="transfer">
                            Transfer between own accounts
                          </option>
                        </select>
                      </label>
                      <label>
                        Date
                        <input
                          required
                          type="date"
                          max={asOf}
                          value={modal.date || ""}
                          onChange={(e) =>
                            setModal({ ...modal, date: e.target.value })
                          }
                        />
                      </label>
                    </div>
                    <label>
                      Category
                      <select
                        value={modal.category}
                        onChange={(e) =>
                          setModal({ ...modal, category: e.target.value })
                        }
                      >
                        {budgets.map((b) => (
                          <option key={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Payment method
                      <select
                        value={modal.method}
                        onChange={(e) =>
                          setModal({ ...modal, method: e.target.value })
                        }
                      >
                        <option>Cash</option>
                        <option>Bank / e-wallet</option>
                        {modal.type === "expense" && (
                          <option>Credit card</option>
                        )}
                      </select>
                    </label>
                    <p className="assumption">
                      Transfers have no effect on consolidated cash or spending.
                      Record received income only once. Use a scheduled bill’s
                      “Mark paid” action to settle it.
                    </p>
                  </>
                )}
              {["bill", "income"].includes(modal.kind) && (
                <label>
                  Expected / due date (leave blank if unknown)
                  <input
                    type="date"
                    value={modal.date || ""}
                    onChange={(e) =>
                      setModal({ ...modal, date: e.target.value || null })
                    }
                  />
                </label>
              )}
              {modal.kind === "bill" && !modal.date && (
                <label>
                  Planned month (day unknown)
                  <input
                    required
                    type="month"
                    value={modal.plannedMonth || "2026-11"}
                    onChange={(e) =>
                      setModal({ ...modal, plannedMonth: e.target.value })
                    }
                  />
                </label>
              )}
              {modal.kind === "goal" && (
                <>
                  <label>
                    Target (₱)
                    <input
                      min="1"
                      type="number"
                      value={(modal.target || 0) / 100}
                      onChange={(e) =>
                        setModal({
                          ...modal,
                          target: Math.round(Number(e.target.value) * 100),
                        })
                      }
                    />
                  </label>
                  <label>
                    Monthly plan (₱)
                    <input
                      min="0"
                      type="number"
                      value={(modal.monthly || 0) / 100}
                      onChange={(e) =>
                        setModal({
                          ...modal,
                          monthly: Math.round(Number(e.target.value) * 100),
                        })
                      }
                    />
                  </label>
                </>
              )}
              {modal.kind === "transaction" &&
                rows.some((r) => r.id === modal.id) && (
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={!!modal.voided}
                      onChange={(e) =>
                        setModal({ ...modal, voided: e.target.checked })
                      }
                    />{" "}
                    Void this transaction (history preserved)
                  </label>
                )}
              {error && (
                <p role="alert" className="negative">
                  {error}
                </p>
              )}
              <button disabled={busy} className="primary submit" type="submit">
                {busy ? "Saving…" : "Save record"} <Check size={17} />
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
function Chart({ data }: { data: { month: string; balance: number }[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const min = Math.min(0, ...data.map((r) => r.balance)),
    max = Math.max(1, ...data.map((r) => r.balance)),
    range = max - min;
  const y = (v: number) => 160 - ((v - min) / range) * 130;
  const points = data
    .map((r, i) => `${50 + (i * 650) / (data.length - 1)},${y(r.balance)}`)
    .join(" ");
  return (
    <div className="chart">
      <svg
        viewBox="0 0 740 210"
        role="img"
        aria-label="Projected cash balance chart"
      >
        <defs>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7d9d86" stopOpacity=".23" />
            <stop offset="100%" stopColor="#7d9d86" stopOpacity=".01" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((n) => (
          <g key={n}>
            <line
              x1="50"
              x2="715"
              y1={30 + n * 130}
              y2={30 + n * 130}
              stroke="#e9ece7"
              strokeDasharray="4 5"
            />
            <text x="0" y={34 + n * 130} fontSize="10" fill="#879086">
              {Math.round((max - n * range) / 100000)}k
            </text>
          </g>
        ))}
        <polygon points={`50,160 ${points} 700,160`} fill="url(#fill)" />
        <polyline
          points={points}
          fill="none"
          stroke="#658775"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {data.map((r, i) => (
          <g
            key={r.month}
            onClick={() => setSelected(i)}
            tabIndex={0}
            role="button"
            aria-label={`${r.month}: ${peso(r.balance)}`}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSelected(i);
            }}
          >
            <circle
              cx={50 + (i * 650) / (data.length - 1)}
              cy={y(r.balance)}
              r="5"
              fill="#fff"
              stroke="#658775"
              strokeWidth="2"
            />
            <text
              x={50 + (i * 650) / (data.length - 1)}
              y="193"
              textAnchor="middle"
              fill="#879086"
              fontSize="11"
            >
              {new Date(r.month + "-15").toLocaleString("en-PH", {
                month: "short",
              })}
            </text>
          </g>
        ))}
      </svg>
      {selected !== null && (
        <p className="chart-tooltip">
          {data[selected].month} · projected {peso(data[selected].balance)}
        </p>
      )}
    </div>
  );
}
