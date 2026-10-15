import { NextRequest, NextResponse } from "next/server";
export async function middleware(req: NextRequest) {
  const password = process.env.FAMILY_PASSWORD;
  const user = process.env.FAMILY_USER || "family";
  if (!password) {
    if (process.env.NODE_ENV === "production")
      return new NextResponse(
        "Set FAMILY_PASSWORD before serving private financial data.",
        { status: 503 },
      );
    return NextResponse.next();
  }
  const header = req.headers.get("authorization");
  let credentials = "";
  try {
    credentials = atob(header?.split(" ")[1] || "");
  } catch {}
  const digest = async (s: string) =>
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
    );
  const [a, b] = await Promise.all([
    digest(credentials),
    digest(user + ":" + password),
  ]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0)
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Our Family Finance", charset="UTF-8"',
      },
    });
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "same-origin");
  return res;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
