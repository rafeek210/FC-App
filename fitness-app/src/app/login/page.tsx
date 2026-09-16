"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clientCodeToLoginEmail } from "@/lib/client-login";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"client" | "staff">("client");
  const [identifier, setIdentifier] = useState(""); // client code or staff email
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const email =
        mode === "client" ? clientCodeToLoginEmail(identifier) : identifier;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(
          mode === "client"
            ? "Client code or password is incorrect."
            : "Email or password is incorrect."
        );
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        setError("Something went wrong. Please try again, or contact your admin.");
        setLoading(false);
        return;
      }

      if (profile.status !== "active") {
        await supabase.auth.signOut();
        setError("Your account has been deactivated.");
        setLoading(false);
        return;
      }

      const roleHome: Record<string, string> = { admin: "/admin", trainer: "/trainer", client: "/client" };
      const home = roleHome[profile.role as string];

      if (!home) {
        setError("Something went wrong. Please contact your admin.");
        setLoading(false);
        return;
      }

      router.push(home);
      router.refresh();
    } catch (err) {
      console.error("[login] unexpected error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex mb-4 rounded-lg bg-neutral-200 p-1 text-sm">
          <button
            type="button"
            onClick={() => { setMode("client"); setIdentifier(""); setError(null); }}
            className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
              mode === "client" ? "bg-white shadow-sm" : "text-neutral-500"
            }`}
          >
            Client
          </button>
          <button
            type="button"
            onClick={() => { setMode("staff"); setIdentifier(""); setError(null); }}
            className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
              mode === "staff" ? "bg-white shadow-sm" : "text-neutral-500"
            }`}
          >
            Admin / Trainer
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8"
        >
          <h1 className="text-xl font-medium mb-6 text-neutral-900">Sign in</h1>

          <label className="block text-sm text-neutral-600 mb-1">
            {mode === "client" ? "Client code" : "Email"}
          </label>
          <input
            type={mode === "client" ? "text" : "email"}
            required
            autoCapitalize={mode === "client" ? "characters" : "none"}
            placeholder={mode === "client" ? "e.g. FC-0042" : ""}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full mb-4 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />

          <label className="block text-sm text-neutral-600 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />

          {error && <p className="text-sm text-rose-600 mb-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {mode === "client" && (
            <p className="text-xs text-neutral-400 mt-4 text-center">
              Forgot your password? Ask your trainer to reset it for you.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
