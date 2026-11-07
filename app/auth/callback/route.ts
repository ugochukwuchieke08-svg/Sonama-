import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeRedirect(next: string, origin: string) {
  try {
    const destination = new URL(next, origin);

    // Only allow redirects to this same website.
    if (
      destination.origin !== origin ||
      !next.startsWith("/") ||
      next.startsWith("//")
    ) {
      return "/account";
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/account";
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/account";

  const safeNext = getSafeRedirect(next, requestUrl.origin);

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

  const loginUrl = new URL("/login", requestUrl.origin);

  loginUrl.searchParams.set("error", "auth");
  loginUrl.searchParams.set("redirect", safeNext);

  return NextResponse.redirect(loginUrl);
}