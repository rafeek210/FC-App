import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ClientsPageContent from "./ClientsPageContent";
import type { ClientRow } from "./ClientsTable";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ assign?: string }>;
}) {
  await requireRole("admin");
  const { assign } = await searchParams;
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("*, profiles!inner(full_name, status)")
    .order("client_code", { ascending: true });

  const { data: allSubs } = await supabase
    .from("client_subscriptions")
    .select("client_id, end_date, start_date")
    .order("start_date", { ascending: false });

  // Keep only the most recent subscription per client (rows already
  // ordered newest-first, so the first match per client_id wins).
  const latestByClient = new Map<string, { end_date: string }>();
  for (const s of allSubs ?? []) {
    if (!latestByClient.has(s.client_id)) latestByClient.set(s.client_id, { end_date: s.end_date });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const clientRows: ClientRow[] = (clients ?? []).map((c) => {
    const latest = latestByClient.get(c.id);
    if (!latest) {
      return { ...c, current_subscription: { status: "none", end_date: null, days_left: null } };
    }
    const end = new Date(latest.end_date + "T00:00:00");
    const daysLeft = Math.round((end.getTime() - today.getTime()) / 86400000);
    const status = daysLeft < 0 ? "expired" : daysLeft <= 7 ? "expiring" : "active";
    return { ...c, current_subscription: { status, end_date: latest.end_date, days_left: daysLeft } };
  });

  const clientOptions = (clients ?? []).map((c) => ({
    id: c.id,
    client_code: c.client_code,
    full_name: c.profiles?.full_name ?? "",
  }));

  return (
    <main className="p-8 max-w-5xl">
      <ClientsPageContent clients={clientRows} clientOptions={clientOptions} initialAssignId={assign} />
    </main>
  );
}
