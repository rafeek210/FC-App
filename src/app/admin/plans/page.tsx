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
      <div className="grid grid-cols-3 items-center mb-6">
        <div />
        <h1 className="text-xl font-medium text-center">Subscription plans</h1>
        <div className="flex justify-end">
          <Link
            href="/admin/plans/new"
            aria-label="New plan"
            className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg w-9 h-9 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
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
