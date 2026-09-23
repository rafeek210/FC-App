import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientCodeToLoginEmail } from "@/lib/client-login";

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const { clientId, newClientCode } = await request.json();
  if (!clientId || !newClientCode) {
    return NextResponse.json({ error: "clientId and newClientCode are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: existingClient } = await admin
    .from("clients").select("client_code").eq("id", clientId).single();
  const oldClientCode = existingClient?.client_code;

  const newEmail = clientCodeToLoginEmail(newClientCode);

  // Update the login first — if the new code is already taken by another
  // client, this fails cleanly before we touch the clients table at all.
  const { error: authError } = await admin.auth.admin.updateUserById(clientId, { email: newEmail });
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const { error: dbError } = await admin
    .from("clients")
    .update({ client_code: newClientCode })
    .eq("id", clientId);

  if (dbError) {
    // Roll back the login change so the two stay in sync.
    if (oldClientCode) {
      await admin.auth.admin.updateUserById(clientId, { email: clientCodeToLoginEmail(oldClientCode) });
    }
    return NextResponse.json({ error: dbError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
