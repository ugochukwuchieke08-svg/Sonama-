
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
 const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/account";

  // Prevent external redirect attacks
  const safeNext = next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/account";

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(
        new URL(safeNext, requestUrl.origin)
      );
    }

    console.error("Supabase auth callback error:", error.message);
  }

  return NextResponse.redirect(
    new URL("/login?error=auth", requestUrl.origin)
  );
}
