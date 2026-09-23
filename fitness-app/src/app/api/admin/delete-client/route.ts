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

  const { clientId } = await request.json();
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Requirement doc: "Option to delete only if no subscription is linked."
  const { count, error: countError } = await admin
    .from("client_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 400 });
  }
  if (count && count > 0) {
    return NextResponse.json(
      { error: "This client has a subscription linked and cannot be deleted." },
      { status: 400 }
    );
  }

  // Deleting the auth user cascades to profiles, then to clients.
  const { error } = await admin.auth.admin.deleteUser(clientId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
