import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const { clientId, newPassword } = await request.json();
  if (!clientId || !newPassword) {
    return NextResponse.json({ error: "clientId and newPassword are required" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(clientId, { password: newPassword });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
