import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ClientsPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: clients, error } = await supabase
    .from("clients")
    .select("*, profiles!inner(full_name, status)")
    .order("joining_date", { ascending: false });

  return (
    <main className="p-8 max-w-4xl">
      <div className="grid grid-cols-3 items-center mb-6">
        <div />
        <h1 className="text-xl font-medium text-center">Clients</h1>
        <div className="flex justify-end">
          <Link
            href="/admin/clients/new"
            aria-label="New client"
            className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg w-9 h-9 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-rose-600">Could not load clients: {error.message}</p>}
      {clients && clients.length === 0 && (
        <p className="text-sm text-neutral-400">No clients yet. Add your first one.</p>
      )}

      <div className="flex flex-col gap-2">
        {clients?.map((c) => (
          <Link
            key={c.id}
            href={`/admin/clients/${c.id}`}
            className="border border-neutral-200 rounded-lg px-4 py-3 flex items-center justify-between hover:border-rose-300 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{c.profiles?.full_name}</p>
                <p className="text-xs text-neutral-400 font-mono">{c.client_code}</p>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {c.primary_contact || "No contact on file"}
                {c.joined_via ? ` · via ${c.joined_via}` : ""}
              </p>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full ${
                c.profiles?.status === "active"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {c.profiles?.status}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
