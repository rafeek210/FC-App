"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/Spinner";

type CurrentSub = {
  plan_name: string;
  start_date: string;
  end_date: string;
} | null;

const EMPTY_FORM = {
  fullName: "",
  dob: "",
  primaryContact: "",
  whatsappContact: "",
  secondaryContact: "",
  email: "",
  joinedVia: "",
  fitnessGoal: "",
  healthConditions: "",
  remarks: "",
};

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [clientCode, setClientCode] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [accountStatus, setAccountStatus] = useState<"active" | "inactive">("active");
  const [currentSub, setCurrentSub] = useState<CurrentSub>(null);
  const [hasAnySubscription, setHasAnySubscription] = useState(false);

  const [initialForm, setInitialForm] = useState<typeof EMPTY_FORM | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");
  const [navigating, setNavigating] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const [actionBusy, setActionBusy] = useState<"deactivate" | "delete" | "password" | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isDirty = initialForm !== null && JSON.stringify(form) !== JSON.stringify(initialForm);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("clients")
        .select("*, profiles!inner(full_name, status)")
        .eq("id", id)
        .single();

      if (error || !data) {
        setMessage(error?.message ?? "Client not found");
        setLoading(false);
        return;
      }

      setClientCode(data.client_code ?? "");
      setJoiningDate(data.joining_date ?? "");
      setAccountStatus(data.profiles?.status ?? "active");

      const loaded = {
        fullName: data.profiles?.full_name ?? "",
        dob: data.dob ?? "",
        primaryContact: data.primary_contact ?? "",
        whatsappContact: data.whatsapp_contact ?? "",
        secondaryContact: data.secondary_contact ?? "",
        email: data.email ?? "",
        joinedVia: data.joined_via ?? "",
        fitnessGoal: data.fitness_goal ?? "",
        healthConditions: data.health_conditions ?? "",
        remarks: data.remarks ?? "",
      };
      setForm(loaded);
      setInitialForm(loaded);

      const { data: subs } = await supabase
        .from("client_subscriptions")
        .select("start_date, end_date, plans(name)")
        .eq("client_id", id)
        .order("start_date", { ascending: false })
        .limit(1);

      if (subs && subs.length > 0) {
        setHasAnySubscription(true);
        const s = subs[0] as unknown as { start_date: string; end_date: string; plans: { name: string } | null };
        setCurrentSub({
          plan_name: s.plans?.name ?? "—",
          start_date: s.start_date,
          end_date: s.end_date,
        });
      }

      setLoading(false);
    }
    load();
  }, [id, supabase]);

  async function save(): Promise<boolean> {
    setStatus("saving");
    setMessage("");

    const [{ error: profileError }, { error: clientError }] = await Promise.all([
      supabase.from("profiles").update({ full_name: form.fullName }).eq("id", id),
      supabase.from("clients").update({
        dob: form.dob || null,
        primary_contact: form.primaryContact || null,
        whatsapp_contact: form.whatsappContact || null,
        secondary_contact: form.secondaryContact || null,
        email: form.email || null,
        joined_via: form.joinedVia || null,
        fitness_goal: form.fitnessGoal || null,
        health_conditions: form.healthConditions || null,
        remarks: form.remarks || null,
      }).eq("id", id),
    ]);

    const error = profileError || clientError;
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return false;
    }
    return true;
  }

  async function goToList() {
    setNavigating(true);
    router.push("/admin/clients");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (await save()) await goToList();
  }

  function handleCloseClick() {
    if (isDirty) setShowCloseConfirm(true);
    else goToList();
  }

  async function handleSaveAndClose() {
    if (await save()) await goToList();
    else setShowCloseConfirm(false);
  }

  async function toggleActive() {
    setActionBusy("deactivate");
    setActionMessage("");
    const nextStatus = accountStatus === "active" ? "inactive" : "active";
    const { error } = await supabase.from("profiles").update({ status: nextStatus }).eq("id", id);
    if (error) {
      setActionMessage(error.message);
    } else {
      setAccountStatus(nextStatus);
    }
    setActionBusy(null);
  }

  async function handleResetPassword() {
    if (newPassword.length < 8) {
      setActionMessage("Password must be at least 8 characters.");
      return;
    }
    setActionBusy("password");
    setActionMessage("");
    const res = await fetch("/api/admin/reset-client-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: id, newPassword }),
    });
    const data = await res.json();
    setActionBusy(null);
    if (!res.ok) {
      setActionMessage(data.error ?? "Could not reset password");
      return;
    }
    setShowPasswordPrompt(false);
    setNewPassword("");
    setActionMessage("Password reset. Share the new password with the client directly.");
  }

  async function handleDelete() {
    setActionBusy("delete");
    setActionMessage("");
    const res = await fetch("/api/admin/delete-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setActionBusy(null);
      setShowDeleteConfirm(false);
      setActionMessage(data.error ?? "Could not delete client");
      return;
    }
    router.push("/admin/clients");
    router.refresh();
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

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-medium">Edit client</h1>
          <span className="text-xs text-neutral-400 font-mono">{clientCode}</span>
        </div>
        <button onClick={handleCloseClick} className="text-sm text-neutral-400 hover:text-neutral-600">
          Close
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className={`text-xs px-2.5 py-1 rounded-full ${
          accountStatus === "active" ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
        }`}>
          {accountStatus === "active" ? "Active" : "Deactivated"}
        </span>
        {joiningDate && <span className="text-xs text-neutral-400">Joined {joiningDate}</span>}
      </div>

      <div className="border border-neutral-200 rounded-lg p-4 mb-6 bg-neutral-50">
        <p className="text-xs font-medium text-neutral-500 mb-2">Current subscription</p>
        {hasAnySubscription && currentSub ? (
          <div>
            <p className="text-sm font-medium">{currentSub.plan_name}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{currentSub.start_date} – {currentSub.end_date}</p>
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Not yet assigned.</p>
        )}
      </div>

      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-xs w-full shadow-lg">
            <p className="text-sm font-medium mb-1">Unsaved changes</p>
            <p className="text-xs text-neutral-500 mb-4">You've made changes. Save before closing?</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSaveAndClose}
                disabled={status === "saving"}
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {status === "saving" && <Spinner />}
                {status === "saving" ? "Saving..." : "Save changes"}
              </button>
              <button onClick={goToList} className="text-sm text-neutral-500 hover:text-neutral-700 py-1">Discard changes</button>
              <button onClick={() => setShowCloseConfirm(false)} className="text-sm text-neutral-400 hover:text-neutral-600 py-1">Keep editing</button>
            </div>
          </div>
        </div>
      )}

      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-xs w-full shadow-lg">
            <p className="text-sm font-medium mb-3">Reset password</p>
            <input
              autoFocus
              placeholder="New password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={handleResetPassword}
                disabled={actionBusy === "password"}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionBusy === "password" && <Spinner />}
                {actionBusy === "password" ? "Saving..." : "Set password"}
              </button>
              <button
                onClick={() => { setShowPasswordPrompt(false); setNewPassword(""); }}
                className="px-4 rounded-lg border border-neutral-300 text-sm hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-xs w-full shadow-lg">
            <p className="text-sm font-medium mb-1">Delete this client?</p>
            <p className="text-xs text-neutral-500 mb-4">This permanently removes their login and profile. This can't be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={actionBusy === "delete"}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionBusy === "delete" && <Spinner />}
                {actionBusy === "delete" ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 rounded-lg border border-neutral-300 text-sm hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-neutral-600 mb-1">Full name</label>
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Date of birth</label>
          <input
            type="date"
            value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Primary contact</label>
            <input
              value={form.primaryContact}
              onChange={(e) => setForm({ ...form, primaryContact: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1">WhatsApp contact</label>
            <input
              value={form.whatsappContact}
              onChange={(e) => setForm({ ...form, whatsappContact: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Secondary contact</label>
          <input
            value={form.secondaryContact}
            onChange={(e) => setForm({ ...form, secondaryContact: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Joined via</label>
          <select
            value={form.joinedVia}
            onChange={(e) => setForm({ ...form, joinedVia: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">—</option>
            <option value="Referral">Referral</option>
            <option value="FB Ad">FB Ad</option>
            <option value="Insta Ad">Insta Ad</option>
            <option value="WhatsApp Ad">WhatsApp Ad</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Fitness goal</label>
          <textarea
            rows={2}
            value={form.fitnessGoal}
            onChange={(e) => setForm({ ...form, fitnessGoal: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Health conditions</label>
          <textarea
            rows={2}
            value={form.healthConditions}
            onChange={(e) => setForm({ ...form, healthConditions: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Remarks</label>
          <textarea
            rows={2}
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
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

      <div className="mt-8 pt-6 border-t border-neutral-200">
        <p className="text-xs font-medium text-neutral-500 mb-3">Account actions</p>
        {actionMessage && <p className="text-xs text-neutral-600 mb-3">{actionMessage}</p>}
        <div className="flex flex-col gap-2">
          <button
            onClick={toggleActive}
            disabled={actionBusy === "deactivate"}
            className="text-sm text-left px-3 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 flex items-center gap-2 disabled:opacity-50"
          >
            {actionBusy === "deactivate" && <Spinner />}
            {accountStatus === "active" ? "Deactivate client" : "Reactivate client"}
          </button>
          <button
            onClick={() => setShowPasswordPrompt(true)}
            className="text-sm text-left px-3 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50"
          >
            Reset password
          </button>
          <button
            onClick={() => hasAnySubscription ? null : setShowDeleteConfirm(true)}
            disabled={hasAnySubscription}
            title={hasAnySubscription ? "Can't delete — a subscription is linked to this client" : undefined}
            className="text-sm text-left px-3 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete client{hasAnySubscription ? " (subscription linked)" : ""}
          </button>
        </div>
      </div>
    </main>
  );
}
