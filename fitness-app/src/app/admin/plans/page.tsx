import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PlansList from "./PlansList";

export default async function PlansPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: plans, error } = await supabase
    .from("plans")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium">Subscription plans</h1>
        <Link
          href="/admin/plans/new"
          className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg px-4 py-2 text-sm font-medium"
        >
          + New plan
        </Link>
      </div>

      {error && (
        <p className="text-sm text-rose-600">Could not load plans: {error.message}</p>
      )}

      {plans && plans.length === 0 && (
        <p className="text-sm text-neutral-400">No plans yet. Create your first one.</p>
      )}

      {plans && plans.length > 0 && <PlansList plans={plans} />}
    </main>
  );
}
