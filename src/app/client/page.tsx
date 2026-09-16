import { requireRole } from "@/lib/auth";

export default async function ClientHome() {
  const { profile } = await requireRole("client");

  return (
    <main className="p-8">
      <h1 className="text-xl font-medium mb-2">Client dashboard</h1>
      <p className="text-neutral-500 text-sm">Welcome, {profile.full_name}</p>
      <p className="text-neutral-400 text-sm mt-4">
        Subscription status, today's sessions, and progress charts will live here.
      </p>
    </main>
  );
}
