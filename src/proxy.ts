import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Deliberately minimal: only blocks unauthenticated visitors from the
 * protected sections. Role-based routing (which dashboard a logged-in
 * user should land on) is handled client-side right after login, and
 * verified again server-side by requireRole() on every protected page —
 * see src/lib/auth.ts. Duplicating that logic here caused a redirect
 * loop, since two independent checks were racing each other.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = ["/admin", "/trainer", "/client"].some((p) =>
    path.startsWith(p)
  );

  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/trainer/:path*", "/client/:path*"],
};
