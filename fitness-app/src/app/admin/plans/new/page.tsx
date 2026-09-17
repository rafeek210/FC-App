"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewPlanPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    name: "",
    planType: "Normal",
    durationDays: "",
    amount: "",
    applicability: "new_and_existing",
    allowedLeaveDays: "0",
    startDate: "",
    endDate: "",
    status: "active",
    remarks: "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");

  const datesRequired = form.planType === "Offer" || form.planType === "Challenge";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setMessage("");

    if (datesRequired && (!form.startDate || !form.endDate)) {
      setStatus("error");
      setMessage("Start and end date are required for Offer and Challenge plans.");
      return;
    }

    const { error } = await supabase.from("plans").insert({
      name: form.name,
      plan_type: form.planType,
      duration_days: Number(form.durationDays),
      amount: form.amount ? Number(form.amount) : null,
      applicability: form.applicability,
      allowed_leave_days: Number(form.allowedLeaveDays) || 0,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
      status: form.status,
      remarks: form.remarks || null,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    router.push("/admin/plans");
    router.refresh();
  }

  return (
    <main className="p-8 max-w-md">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium">New subscription plan</h1>
        <button
          onClick={() => router.push("/admin/plans")}
          className="text-sm text-neutral-400 hover:text-neutral-600"
        >
          Close
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-neutral-600 mb-1">Plan name</label>
          <input
            required
            placeholder="e.g. 3-Month Transformation"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Plan type</label>
          <select
            value={form.planType}
            onChange={(e) => setForm({ ...form, planType: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white"
          >
            <option value="Normal">Normal</option>
            <option value="Offer">Offer</option>
            <option value="Challenge">Challenge</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Duration (days)</label>
          <input
            required
            type="number"
            min={1}
            placeholder="e.g. 90"
            value={form.durationDays}
            onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Amount (optional)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">₹</span>
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="e.g. 1500"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 pl-7 pr-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-neutral-600 mb-1">
              Start date {datesRequired && <span className="text-rose-500">*</span>}
            </label>
            <input
              required={datesRequired}
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1">
              End date {datesRequired && <span className="text-rose-500">*</span>}
            </label>
            <input
              required={datesRequired}
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-neutral-400 -mt-3">
          {datesRequired
            ? "Required for Offer and Challenge plans — when this plan itself is available."
            : "Optional for Normal plans."}
        </p>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Applicable to</label>
          <select
            value={form.applicability}
            onChange={(e) => setForm({ ...form, applicability: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white"
          >
            <option value="new">New clients only</option>
            <option value="existing">Existing clients only</option>
            <option value="new_and_existing">New and existing clients</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Allowed leave days</label>
          <input
            type="number"
            min={0}
            value={form.allowedLeaveDays}
            onChange={(e) => setForm({ ...form, allowedLeaveDays: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white"
          >
            <option value="active">Active</option>
            <option value="open">Open</option>
          </select>
          <p className="text-xs text-neutral-400 mt-1">A new plan starts as Active or Open only.</p>
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Remarks (optional)</label>
          <textarea
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            rows={2}
          />
        </div>

        {status === "error" && <p className="text-sm text-rose-600">{message}</p>}

        <button
          type="submit"
          disabled={status === "saving"}
          className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
        >
          {status === "saving" ? "Creating..." : "Create plan"}
        </button>
      </form>
    </main>
  );
}
