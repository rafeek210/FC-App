"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/Spinner";

type ClientOption = { id: string; client_code: string; full_name: string };
type PlanOption = { id: string; name: string; duration_days: number; amount: number | null; applicability: string };
type SubRow = {
  id: string;
  plan_name: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_amount: number | null;
  payment_mode: string | null;
  extended_days: number;
};

const PAYMENT_MODES = ["Cash", "Card", "Bank Transfer", "UPI", "Online Payment"];

export default function SubscriptionsButton({ clients, initialClientId }: { clients: ClientOption[]; initialClientId?: string }) {
  const supabase = createClient();
  const [open, setOpen] = useState(!!initialClientId);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId ?? "");
  const [clientQuery, setClientQuery] = useState("");

  const [history, setHistory] = useState<SubRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [eligiblePlans, setEligiblePlans] = useState<PlanOption[]>([]);
  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState(PAYMENT_MODES[0]);
  const [addBusy, setAddBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [extendId, setExtendId] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState("");
  const [extendReason, setExtendReason] = useState("");
  const [extendBusy, setExtendBusy] = useState(false);

  const filteredClients = clients.filter((c) => {
    const q = clientQuery.toLowerCase();
    if (!q) return true;
    return c.full_name.toLowerCase().includes(q) || c.client_code.toLowerCase().includes(q);
  });

  async function loadHistory(clientId: string) {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("client_subscriptions")
      .select("id, start_date, end_date, status, payment_amount, payment_mode, extended_days, plans(name)")
      .eq("client_id", clientId)
      .order("start_date", { ascending: false });

    const rows = (data ?? []).map((s) => {
      const row = s as unknown as { id: string; start_date: string; end_date: string; status: string; payment_amount: number | null; payment_mode: string | null; extended_days: number; plans: { name: string } | null };
      return { id: row.id, plan_name: row.plans?.name ?? "—", start_date: row.start_date, end_date: row.end_date, status: row.status, payment_amount: row.payment_amount, payment_mode: row.payment_mode, extended_days: row.extended_days ?? 0 };
    });
    setHistory(rows);
    setLoadingHistory(false);

    const { data: plansData } = await supabase
      .from("plans")
      .select("id, name, duration_days, amount, applicability")
      .in("status", ["active", "open"]);

    const hasAny = rows.length > 0;
    const eligible = (plansData ?? []).filter((p) => {
      if (p.applicability === "new") return !hasAny;
      if (p.applicability === "existing") return hasAny;
      return true;
    });
    setEligiblePlans(eligible);
    setPlanId(eligible[0]?.id ?? "");
    setAmount(eligible[0]?.amount != null ? String(eligible[0].amount) : "");
  }

  useEffect(() => {
    if (selectedClientId) loadHistory(selectedClientId);
    else {
      setHistory([]);
      setEligiblePlans([]);
    }
  }, [selectedClientId]);

  function handlePlanChange(id: string) {
    setPlanId(id);
    const p = eligiblePlans.find((pl) => pl.id === id);
    setAmount(p?.amount != null ? String(p.amount) : "");
  }

  async function handleAdd() {
    const plan = eligiblePlans.find((p) => p.id === planId);
    if (!selectedClientId || !plan) {
      setMessage("Select a client and a plan.");
      return;
    }
    setAddBusy(true);
    setMessage("");

    const start = new Date(startDate + "T00:00:00");
    const end = new Date(start);
    end.setDate(end.getDate() + plan.duration_days);

    const { error } = await supabase.from("client_subscriptions").insert({
      client_id: selectedClientId,
      plan_id: plan.id,
      start_date: startDate,
      end_date: end.toISOString().slice(0, 10),
      status: "active",
      payment_amount: amount ? Number(amount) : null,
      payment_mode: paymentMode,
    });

    setAddBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    await loadHistory(selectedClientId);
  }

  async function handleExtend(row: SubRow) {
    const days = Number(extendDays);
    if (!days || days <= 0) return;
    setExtendBusy(true);
    const newEnd = new Date(row.end_date + "T00:00:00");
    newEnd.setDate(newEnd.getDate() + days);

    await supabase.from("client_subscriptions").update({
      end_date: newEnd.toISOString().slice(0, 10),
      extended_days: (row.extended_days ?? 0) + days,
      extension_reason: extendReason || null,
    }).eq("id", row.id);

    setExtendBusy(false);
    setExtendId(null);
    setExtendDays("");
    setExtendReason("");
    await loadHistory(selectedClientId);
  }

  function closeModal() {
    setOpen(false);
    setSelectedClientId("");
    setClientQuery("");
    setMessage("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 font-medium"
      >
        Add subscription
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-lg w-full shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium">Subscription</p>
              <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <label className="block text-xs text-neutral-500 mb-1">Client</label>
            <input
              placeholder="Search by name or code..."
              value={clientQuery}
              onChange={(e) => setClientQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm mb-2"
            />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white mb-4"
            >
              <option value="">Select a client...</option>
              {filteredClients.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name} ({c.client_code})</option>
              ))}
            </select>

            {selectedClientId && (
              <>
                <p className="text-xs font-medium text-neutral-500 mb-2">Subscription history</p>
                {loadingHistory ? (
                  <p className="text-xs text-neutral-400 mb-4 flex items-center gap-2"><Spinner className="w-3 h-3" /> Loading...</p>
                ) : history.length === 0 ? (
                  <p className="text-xs text-neutral-400 mb-4">No subscriptions yet for this client.</p>
                ) : (
                  <div className="border border-neutral-200 rounded-lg overflow-hidden mb-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200">
                          <th className="text-left font-medium text-neutral-500 px-3 py-2">Plan</th>
                          <th className="text-left font-medium text-neutral-500 px-3 py-2">Period</th>
                          <th className="text-left font-medium text-neutral-500 px-3 py-2">Amount</th>
                          <th className="text-left font-medium text-neutral-500 px-3 py-2">Payment</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((row, idx) => (
                          <tr key={row.id} className="border-b border-neutral-100 last:border-0 align-top">
                            <td className="px-3 py-2">
                              {row.plan_name}
                              {idx === 0 && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">current</span>}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {row.start_date} – {row.end_date}
                              {row.extended_days > 0 && <div className="text-neutral-400">+{row.extended_days}d extended</div>}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">{row.payment_amount ? `₹${row.payment_amount}` : "—"}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{row.payment_mode ?? "—"}</td>
                            <td className="px-3 py-2 text-right">
                              {idx === 0 && (
                                extendId === row.id ? null : (
                                  <button onClick={() => setExtendId(row.id)} className="text-rose-600 hover:text-rose-700 font-medium">
                                    Extend
                                  </button>
                                )
                              )}
                            </td>
                          </tr>
                        ))}
                        {extendId && (
                          <tr className="bg-neutral-50">
                            <td colSpan={5} className="px-3 py-3">
                              <div className="flex gap-2 items-end">
                                <div className="w-20">
                                  <label className="block text-[10px] text-neutral-500 mb-1">Days</label>
                                  <input type="number" min={1} value={extendDays} onChange={(e) => setExtendDays(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-2 py-1 text-xs" />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-[10px] text-neutral-500 mb-1">Reason</label>
                                  <input value={extendReason} onChange={(e) => setExtendReason(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-2 py-1 text-xs" />
                                </div>
                                <button
                                  onClick={() => handleExtend(history[0])}
                                  disabled={extendBusy}
                                  className="px-3 py-1.5 rounded-lg bg-neutral-800 text-white text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                                >
                                  {extendBusy && <Spinner className="w-3 h-3" />} Save
                                </button>
                                <button onClick={() => setExtendId(null)} className="text-xs text-neutral-400 hover:text-neutral-600 px-2">Cancel</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="text-xs font-medium text-neutral-500 mb-2">Add new subscription</p>
                {eligiblePlans.length === 0 ? (
                  <p className="text-xs text-neutral-500 mb-2">
                    No eligible plans — check a plan is Active/Open and its applicability (new vs existing) matches this client.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">Plan</label>
                      <select value={planId} onChange={(e) => handlePlanChange(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white">
                        {eligiblePlans.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.duration_days} days)</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Start date</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Payment amount</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">₹</span>
                          <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-neutral-300 pl-7 pr-3 py-2 text-sm" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">Payment mode</label>
                      <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white">
                        {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    {message && <p className="text-xs text-rose-600">{message}</p>}
                    <button onClick={handleAdd} disabled={addBusy} className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                      {addBusy && <Spinner />}{addBusy ? "Adding..." : "Add subscription"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
