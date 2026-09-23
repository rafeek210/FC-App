"use client";

import { useState } from "react";
import Link from "next/link";

type Plan = {
  id: string;
  plan_code: string | null;
  name: string;
  plan_type: string | null;
  duration_days: number;
  amount: number | null;
  applicability: string;
  allowed_leave_days: number;
  start_date: string | null;
  end_date: string | null;
  status: "active" | "open" | "inactive" | "closed";
};

const STATUS_META: Record<Plan["status"], { label: string; badge: string; chipOn: string }> = {
  active: { label: "Active", badge: "bg-emerald-50 text-emerald-700", chipOn: "border-emerald-300 bg-emerald-50" },
  open: { label: "Open", badge: "bg-blue-50 text-blue-700", chipOn: "border-blue-300 bg-blue-50" },
  inactive: { label: "Inactive", badge: "bg-neutral-100 text-neutral-500", chipOn: "border-neutral-400 bg-neutral-100" },
  closed: { label: "Closed", badge: "bg-neutral-100 text-neutral-500", chipOn: "border-neutral-400 bg-neutral-100" },
};

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PlansList({ plans }: { plans: Plan[] }) {
  const [filters, setFilters] = useState<Record<Plan["status"], boolean>>({
    active: true,
    open: true,
    inactive: false,
    closed: false,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const counts: Record<Plan["status"], number> = { active: 0, open: 0, inactive: 0, closed: 0 };
  plans.forEach((p) => { counts[p.status] = (counts[p.status] ?? 0) + 1; });

  const visible = plans.filter((p) => filters[p.status]);

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 mb-6">
        {(Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>).map((key) => {
          const on = filters[key];
          return (
            <button
              key={key}
              onClick={() => setFilters((f) => ({ ...f, [key]: !f[key] }))}
              className={`text-left rounded-lg border p-3 transition-colors ${
                on ? STATUS_META[key].chipOn : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
            >
              <p className="text-xs text-neutral-500">{STATUS_META[key].label}</p>
              <p className="text-xl font-medium mt-0.5">{counts[key] ?? 0}</p>
            </button>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="text-sm text-neutral-400">No plans match the selected filters.</p>
      )}

      <div className="flex flex-col gap-2">
        {visible.map((plan) => {
          const isOpen = expandedId === plan.id;
          return (
            <div key={plan.id} className="border border-neutral-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : plan.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white text-left"
              >
                <span className="text-sm font-medium">{plan.name}</span>
                <span className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_META[plan.status].badge}`}>
                    {STATUS_META[plan.status].label}
                  </span>
                  <svg
                    className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>

              {isOpen && (
                <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-neutral-600 mb-3">
                    <div className="font-mono text-neutral-400">{plan.plan_code}</div>
                    <div>{plan.plan_type}</div>
                    <div>{plan.duration_days} days</div>
                    <div>{plan.amount ? `AED ${plan.amount}` : "—"}</div>
                    <div>{plan.applicability.replace(/_/g, " ")}</div>
                    <div>{plan.allowed_leave_days} leave days</div>
                    {plan.start_date && (
                      <div className="col-span-2">
                        {formatDate(plan.start_date)} – {formatDate(plan.end_date)}
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/admin/plans/${plan.id}`}
                    className="inline-block text-xs px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 font-medium"
                  >
                    Edit plan
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
