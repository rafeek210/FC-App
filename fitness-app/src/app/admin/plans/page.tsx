import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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

      <div className="flex flex-col gap-3">
        {plans?.map((plan) => (
          <div
            key={plan.id}
            className="border border-neutral-200 rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-sm">{plan.name}</p>
              <p className="text-xs text-neutral-500 mt-1">
                {plan.duration_days} days
                {plan.amount ? ` · AED ${plan.amount}` : ""} · {plan.applicability.replace(/_/g, " ")}
                {plan.allowed_leave_days ? ` · ${plan.allowed_leave_days} leave days allowed` : ""}
              </p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                plan.status === "active"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {plan.status}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
