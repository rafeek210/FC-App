"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const EMPTY_FORM = {
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
};

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function NewPlanPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");
  const [navigating, setNavigating] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const datesRequired = form.planType === "Offer" || form.planType === "Challenge";
  const isDirty = JSON.stringify(form) !== JSON.stringify(EMPTY_FORM);

  async function save(): Promise<boolean> {
    setStatus("saving");
    setMessage("");

    if (datesRequired && (!form.startDate || !form.endDate)) {
      setStatus("error");
      setMessage("Start and end date are required for Offer and Challenge plans.");
      return false;
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

  return (
    <main className="p-8 max-w-md relative">
      {navigating && (
        <div className="fixed inset-0 bg-white/60 flex items-center justify-center z-50">
          <Spinner />
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium">New subscription plan</h1>
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
          className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {status === "saving" && <Spinner />}
          {status === "saving" ? "Creating..." : "Create plan"}
        </button>
      </form>
    </main>
  );
}
