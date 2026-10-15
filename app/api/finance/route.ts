import { all, mutate, audit } from "../../../lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.has("audit")) return Response.json(audit());
  if (url.searchParams.has("csv")) {
    const esc = (v: unknown) => {
      let s = String(v ?? "");
      if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
      return '"' + s.replaceAll('"', '""') + '"';
    };
    const fields = [
      "id",
      "kind",
      "name",
      "amount",
      "date",
      "type",
      "category",
      "method",
      "status",
      "note",
      "voided",
    ];
    return new Response(
      [
        fields.join(","),
        ...all().map((r) =>
          fields
            .map((f) =>
              esc(f === "amount" ? r.amount / 100 : r[f as keyof typeof r]),
            )
            .join(","),
        ),
      ].join("\r\n"),
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="family-finance.csv"',
        },
      },
    );
  }
  return Response.json(all());
}
export async function POST(req: Request) {
  let origin: URL;
  try {
    origin = new URL(req.headers.get("origin") || "");
  } catch {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }
  if (
    origin.host !== req.headers.get("host") ||
    !["http:", "https:"].includes(origin.protocol)
  )
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const { record, action } = await req.json();
    if (!["create", "update", "settle", "receive"].includes(action))
      throw Error("Invalid action");
    return Response.json(mutate(record, action));
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 400 },
    );
  }
}
