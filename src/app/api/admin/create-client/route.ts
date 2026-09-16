import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientCodeToLoginEmail } from "@/lib/client-login";

export async function POST(request: Request) {
  // 1. Confirm the caller is a logged-in Admin (defense-in-depth, same
  //    check style as requireRole, but this is an API route not a page).
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  // 2. Read and validate the new client's details.
  const body = await request.json();
  const { clientCode, fullName, password, joiningDate, joinedVia } = body;

  if (!clientCode || !fullName || !password) {
    return NextResponse.json(
      { error: "clientCode, fullName, and password are required" },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const loginEmail = clientCodeToLoginEmail(clientCode);

  // 3. Create the actual Supabase Auth login (service-role only action).
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: loginEmail,
      password,
      email_confirm: true, // skip verification — this address isn't real
    });

  if (createError || !created.user) {
    // Most common cause: client code already used.
    return NextResponse.json(
      { error: createError?.message ?? "Could not create login" },
      { status: 400 }
    );
  }

  // 4. Create the profile + client rows linked to that login.
  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    role: "client",
    full_name: fullName,
    status: "active",
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id); // roll back
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const { error: clientError } = await admin.from("clients").insert({
    id: created.user.id,
    client_code: clientCode,
    joining_date: joiningDate ?? new Date().toISOString().slice(0, 10),
    joined_via: joinedVia ?? null,
  });

  if (clientError) {
    await admin.auth.admin.deleteUser(created.user.id); // roll back
    return NextResponse.json({ error: clientError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, clientId: created.user.id });
}
