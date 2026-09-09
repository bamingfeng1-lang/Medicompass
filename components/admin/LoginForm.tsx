"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import type { Locale } from "@/lib/brand";
import type { Dictionary } from "@/lib/dictionaries";
import { clientApi } from "@/lib/api";

export function LoginForm({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const a = dict.admin;
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(clientApi("/api/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError(a.loginError);
        setLoading(false);
        return;
      }
      const from = params.get("from");
      router.replace(from && from.startsWith(`/${lang}/admin`) ? from : `/${lang}/admin`);
      router.refresh();
    } catch {
      setError(a.loginError);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="card">
      <div className="space-y-5">
        <div>
          <label htmlFor="username" className="field-label">{a.username}</label>
          <input id="username" className="field-input" autoComplete="username"
            value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="field-label">{a.password}</label>
          <input id="password" type="password" className="field-input" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          <LogIn className="h-4 w-4" />
          {loading ? a.loggingIn : a.login}
        </button>
      </div>
    </form>
  );
}
