import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  trainer: "/trainer",
  client: "/client",
};

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

  if (user && (isProtected || path === "/login")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (!profile || profile.status !== "active") {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?deactivated=1", request.url));
    }

    const home = ROLE_HOME[profile.role];

    // Logged in but visiting login page -> send to their dashboard
    if (path === "/login" && home) {
      return NextResponse.redirect(new URL(home, request.url));
    }

    // Logged in but visiting the wrong role's section -> send to their own
    if (isProtected && home && !path.startsWith(home)) {
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/trainer/:path*", "/client/:path*", "/login"],
};
