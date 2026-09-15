import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "trainer" | "client";

const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  trainer: "/trainer",
  client: "/client",
};

/**
 * Defense-in-depth check for use directly inside Server Components/pages.
 * proxy.ts (formerly middleware.ts) handles the fast path for redirects,
 * but per CVE-2025-29927, edge-layer checks alone can be bypassed, so every
 * protected page also verifies here, close to the data it renders.
 */
export async function requireRole(role: Role) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    redirect("/login?deactivated=1");
  }

  if (profile.role !== role) {
    redirect(ROLE_HOME[profile.role as Role] ?? "/login");
  }

  return { user, profile };
}
