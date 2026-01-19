import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const token = requestUrl.searchParams.get("token");
  const type = requestUrl.searchParams.get("type");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(`${origin}/`);
  }

  if (type === "recovery" || token) {
    return NextResponse.redirect(`${origin}/auth/reset-password?from=callback`);
  }

  return NextResponse.redirect(`${origin}/`);
}
