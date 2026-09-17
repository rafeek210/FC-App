"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewPlanPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    name: "",
    planType: "",
    durationDays: "",
    amount: "",
    applicability: "new_and_existing",
    allowedLeaveDays: "0",
    remarks: "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setMessage("");

    const { error } = await supabase.from("plans").insert({
      name: form.name,
      plan_type: form.planType || null,
      duration_days: Number(form.durationDays),
      amount: form.amount ? Number(form.amount) : null,
      applicability: form.applicability,
      allowed_leave_days: Number(form.allowedLeaveDays) || 0,
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
      <h1 className="text-xl font-medium mb-6">New subscription plan</h1>

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
          <label className="block text-sm text-neutral-600 mb-1">Plan type (optional)</label>
          <input
            placeholder="e.g. Normal, Challenge, Offer"
            value={form.planType}
            onChange={(e) => setForm({ ...form, planType: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
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
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="e.g. 1500"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

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
