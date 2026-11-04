import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/login?error=The%20password%20reset%20link%20is%20invalid%20or%20expired.",
        request.url,
      ),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(
        "/login?error=The%20password%20reset%20link%20is%20invalid%20or%20expired.",
        request.url,
      ),
    );
  }

  const nextPath =
    request.nextUrl.searchParams.get("next") === "/reset-password"
      ? "/reset-password"
      : "/login";
  return NextResponse.redirect(new URL(nextPath, request.url));
}
