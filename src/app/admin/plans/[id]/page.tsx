"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  active: ["active", "inactive"],
  open: ["open", "closed", "active", "inactive"],
  closed: ["closed", "open", "active"],
  inactive: ["inactive", "active"],
};

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [planCode, setPlanCode] = useState("");
  const [originalStatus, setOriginalStatus] = useState("active");
  const [initialForm, setInitialForm] = useState<Record<string, string> | null>(null);
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
  const [navigating, setNavigating] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const datesRequired = form.planType === "Offer" || form.planType === "Challenge";
  const allowedStatuses = STATUS_TRANSITIONS[originalStatus] ?? [originalStatus];
  const isDirty = initialForm !== null && JSON.stringify(form) !== JSON.stringify(initialForm);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("plans").select("*").eq("id", id).single();
      if (error || !data) {
        setMessage(error?.message ?? "Plan not found");
        setLoading(false);
        return;
      }
      setPlanCode(data.plan_code ?? "");
      setOriginalStatus(data.status ?? "active");
      const loaded = {
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
      };
      setForm(loaded);
      setInitialForm(loaded);
      setLoading(false);
    }
    load();
  }, [id, supabase]);

  async function save(): Promise<boolean> {
    setStatus("saving");
    setMessage("");

    if (datesRequired && (!form.startDate || !form.endDate)) {
      setStatus("error");
      setMessage("Start and end date are required for Offer and Challenge plans.");
      return false;
    }

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
      return false;
    }
    return true;
  }

  async function goToList() {
    setNavigating(true);
    router.push("/admin/plans");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (await save()) await goToList();
  }

  function handleCloseClick() {
    if (isDirty) {
      setShowCloseConfirm(true);
    } else {
      goToList();
    }
  }

  async function handleSaveAndClose() {
    if (await save()) {
      await goToList();
    } else {
      setShowCloseConfirm(false);
    }
  }

  if (loading) {
    return (
      <main className="p-8 flex items-center gap-2 text-neutral-400 text-sm">
        <Spinner /> Loading...
      </main>
    );
  }

  return (
    <main className="p-8 max-w-md relative">
      {navigating && (
        <div className="fixed inset-0 bg-white/60 flex items-center justify-center z-50">
          <Spinner />
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-medium">Edit plan</h1>
          {planCode && <span className="text-xs text-neutral-400 font-mono">{planCode}</span>}
        </div>
        <button
          type="button"
          onClick={handleCloseClick}
          className="text-sm text-neutral-400 hover:text-neutral-600"
        >
          Close
        </button>
      </div>

      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-xs w-full shadow-lg">
            <p className="text-sm font-medium mb-1">Unsaved changes</p>
            <p className="text-xs text-neutral-500 mb-4">
              You've made changes to this plan. Save before closing?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSaveAndClose}
                disabled={status === "saving"}
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {status === "saving" && <Spinner />}
                {status === "saving" ? "Saving..." : "Save changes"}
              </button>
              <button onClick={goToList} className="text-sm text-neutral-500 hover:text-neutral-700 py-1">
                Discard changes
              </button>
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="text-sm text-neutral-400 hover:text-neutral-600 py-1"
              >
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">₹</span>
            <input
              type="number"
              min={0}
              step="0.01"
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
            {allowedStatuses.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
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

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={status === "saving"}
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === "saving" && <Spinner />}
            {status === "saving" ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={handleCloseClick}
            className="px-4 rounded-lg border border-neutral-300 text-sm font-medium hover:bg-neutral-50"
          >
            Close
          </button>
        </div>
      </form>
    </main>
  );
}
