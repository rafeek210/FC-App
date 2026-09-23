import { requireRole } from "@/lib/auth";

export default async function TrainerHome() {
  const { profile } = await requireRole("trainer");

  return (
    <main className="p-8">
      <h1 className="text-xl font-medium mb-2">Trainer dashboard</h1>
      <p className="text-neutral-500 text-sm">Welcome, {profile.full_name}</p>
      <p className="text-neutral-400 text-sm mt-4">
        Today's session slots and Zoom link posting will live here.
      </p>
    </main>
  );
}
