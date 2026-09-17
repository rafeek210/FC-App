"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [planCode, setPlanCode] = useState("");
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

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("plans").select("*").eq("id", id).single();
      if (error || !data) {
        setMessage(error?.message ?? "Plan not found");
        setLoading(false);
        return;
      }
      setPlanCode(data.plan_code ?? "");
      setForm({
        name: data.name ?? "",
        planType: data.plan_type ?? "Normal",
        durationDays: String(data.duration_days ?? ""),
        amount: data.amount != null ? String(data.amount) : "",
        applicability: data.applicability ?? "new_and_existing",
        allowedLeaveDays: String(data.allowed_leave_days ?? 0),
        startDate: data.start_date ?? "",
        endDate: data.end_date ?? "",
        status: data.status ?? "active",
        remarks: data.remarks ?? "",
      });
      setLoading(false);
    }
    load();
  }, [id, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setMessage("");

    const { error } = await supabase
      .from("plans")
      .update({
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
      })
      .eq("id", id);

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    router.push("/admin/plans");
    router.refresh();
  }

  if (loading) {
    return <main className="p-8"><p className="text-sm text-neutral-400">Loading...</p></main>;
  }

  return (
    <main className="p-8 max-w-md">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-xl font-medium">Edit plan</h1>
        {planCode && (
          <span className="text-xs text-neutral-400 font-mono">{planCode}</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-neutral-600 mb-1">Plan name</label>
          <input
            required
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
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Start date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1">End date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
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
          <label className="block text-sm text-neutral-600 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
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
          {status === "saving" ? "Saving..." : "Save changes"}
        </button>
      </form>
    </main>
  );
}
