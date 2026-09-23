"use client";

import { useState } from "react";
import Link from "next/link";

type Client = {
  id: string;
  client_code: string;
  primary_contact: string | null;
  joined_via: string | null;
  profile_pic_url: string | null;
  profiles: { full_name: string; status: string } | null;
};

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function ClientsTable({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState("");

  const filtered = clients.filter((c) => {
    const q = query.toLowerCase();
    if (!q) return true;
    return (
      c.client_code.toLowerCase().includes(q) ||
      (c.profiles?.full_name ?? "").toLowerCase().includes(q) ||
      (c.primary_contact ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="relative mb-4">
        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5A6.5 6.5 0 114 10.5a6.5 6.5 0 0113 0z" />
        </svg>
        <input
          placeholder="Search by name, code, or contact..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-sm"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-neutral-400">No clients match your search.</p>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto border border-neutral-200 rounded-xl">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left font-medium text-neutral-500 px-4 py-2.5 whitespace-nowrap"></th>
                <th className="text-left font-medium text-neutral-500 px-4 py-2.5 whitespace-nowrap">Code</th>
                <th className="text-left font-medium text-neutral-500 px-4 py-2.5 whitespace-nowrap">Name</th>
                <th className="text-left font-medium text-neutral-500 px-4 py-2.5 whitespace-nowrap">Contact</th>
                <th className="text-left font-medium text-neutral-500 px-4 py-2.5 whitespace-nowrap">Joined via</th>
                <th className="text-left font-medium text-neutral-500 px-4 py-2.5 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-neutral-100 last:border-0 hover:bg-rose-50/40">
                  <td className="px-4 py-2.5 w-12">
                    <Link href={`/admin/clients/${c.id}`}>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-medium shrink-0">
                        {c.profile_pic_url ? (
                          <img src={c.profile_pic_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          initials(c.profiles?.full_name ?? "?")
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/clients/${c.id}`} className="font-mono text-xs text-neutral-500 hover:text-rose-600">
                      {c.client_code}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/clients/${c.id}`} className="font-medium hover:text-rose-600">
                      {c.profiles?.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600 whitespace-nowrap">{c.primary_contact || "—"}</td>
                  <td className="px-4 py-2.5 text-neutral-600 whitespace-nowrap">{c.joined_via || "—"}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${
                      c.profiles?.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                    }`}>
                      {c.profiles?.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
