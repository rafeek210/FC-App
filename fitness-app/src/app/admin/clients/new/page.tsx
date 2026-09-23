"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";

const EMPTY_FORM = {
  clientCode: "",
  fullName: "",
  password: "",
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

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setMessage("");

    const res = await fetch("/api/admin/create-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "Something went wrong");
      return;
    }

    setStatus("done");
    setMessage(`Client ${form.clientCode} created. Share the code and password with them directly.`);
    setForm(EMPTY_FORM);
  }

  return (
    <main className="p-8 max-w-md">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium">Add a new client</h1>
        <button onClick={() => router.push("/admin/clients")} className="text-sm text-neutral-400 hover:text-neutral-600">
          Close
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-neutral-600 mb-1">Client code</label>
          <input
            required
            placeholder="e.g. FC-0043"
            value={form.clientCode}
            onChange={(e) => setForm({ ...form, clientCode: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

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
          <label className="block text-sm text-neutral-600 mb-1">
            Temporary password (min 8 characters)
          </label>
          <input
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Date of birth (optional)</label>
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
          <label className="block text-sm text-neutral-600 mb-1">Secondary contact (optional)</label>
          <input
            value={form.secondaryContact}
            onChange={(e) => setForm({ ...form, secondaryContact: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Email (optional — for contact only, not login)</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Joined via (optional)</label>
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
          <label className="block text-sm text-neutral-600 mb-1">Fitness goal (optional)</label>
          <textarea
            rows={2}
            value={form.fitnessGoal}
            onChange={(e) => setForm({ ...form, fitnessGoal: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Health conditions (optional)</label>
          <textarea
            rows={2}
            value={form.healthConditions}
            onChange={(e) => setForm({ ...form, healthConditions: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Remarks (optional)</label>
          <textarea
            rows={2}
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        {message && (
          <p className={`text-sm ${status === "error" ? "text-rose-600" : "text-emerald-600"}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "saving"}
          className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {status === "saving" && <Spinner />}
          {status === "saving" ? "Creating..." : "Create client"}
        </button>
      </form>
    </main>
  );
}
