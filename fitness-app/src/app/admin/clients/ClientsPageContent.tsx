"use client";

import { useState } from "react";
import Link from "next/link";
import ClientsTable, { type ClientRow } from "./ClientsTable";
import SubscriptionModal from "./SubscriptionModal";

type ClientOption = { id: string; client_code: string; full_name: string };

export default function ClientsPageContent({
  clients,
  clientOptions,
  initialAssignId,
}: {
  clients: ClientRow[];
  clientOptions: ClientOption[];
  initialAssignId?: string;
}) {
  const [modalOpen, setModalOpen] = useState(!!initialAssignId);
  const [modalClientId, setModalClientId] = useState<string | null>(initialAssignId ?? null);

  function openModal(clientId: string | null) {
    setModalClientId(clientId);
    setModalOpen(true);
  }

  return (
    <>
      <div className="grid grid-cols-3 items-center mb-6">
        <div />
        <h1 className="text-xl font-medium text-center">Client Details</h1>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => openModal(null)}
            className="text-sm px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 font-medium"
          >
            Add subscription
          </button>
          <Link
            href="/admin/clients/new"
            aria-label="New client"
            className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg w-9 h-9 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
      </div>

      {clients.length === 0 ? (
        <p className="text-sm text-neutral-400">No clients yet. Add your first one.</p>
      ) : (
        <ClientsTable clients={clients} onOpenSubscription={(id) => openModal(id)} />
      )}

      <SubscriptionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        clients={clientOptions}
        initialClientId={modalClientId}
      />
    </>
  );
}
