"use client";

import { useState } from "react";

export default function NewClientPage() {
  const [form, setForm] = useState({
    clientCode: "",
    fullName: "",
    password: "",
    joinedVia: "",
  });
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
    setForm({ clientCode: "", fullName: "", password: "", joinedVia: "" });
  }

  return (
    <main className="p-8 max-w-md">
      <h1 className="text-xl font-medium mb-6">Add a new client</h1>

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
          <label className="block text-sm text-neutral-600 mb-1">Joined via (optional)</label>
          <input
            placeholder="e.g. Instagram Ad, Referral"
            value={form.joinedVia}
            onChange={(e) => setForm({ ...form, joinedVia: e.target.value })}
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
          className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
        >
          {status === "saving" ? "Creating..." : "Create client"}
        </button>
      </form>
    </main>
  );
}
