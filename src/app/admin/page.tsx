import { requireRole } from "@/lib/auth";

export default async function AdminHome() {
  const { profile } = await requireRole("admin");

  return (
    <main className="p-8">
      <h1 className="text-xl font-medium mb-2">Admin dashboard</h1>
      <p className="text-neutral-500 text-sm">Welcome, {profile.full_name}</p>
      <p className="text-neutral-400 text-sm mt-4">
        Client list, subscription monitoring, and reports will live here.
      </p>
    </main>
  );
}
