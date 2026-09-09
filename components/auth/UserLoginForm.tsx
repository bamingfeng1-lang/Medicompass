"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import type { Locale } from "@/lib/brand";
import type { Dictionary } from "@/lib/dictionaries";
import { clientApi } from "@/lib/api";

export function UserLoginForm({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const a = dict.auth;
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!phone.trim() || !password) {
      setError(a.missing);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(clientApi("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      if (!res.ok) {
        setError(a.invalid);
        setLoading(false);
        return;
      }
      router.replace(`/${lang}/login-success`);
      router.refresh();
    } catch {
      setError(a.invalid);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="card" noValidate>
      <div className="space-y-5">
        <div>
          <label htmlFor="phone" className="field-label">{a.phone}</label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            className="field-input"
            placeholder={a.phonePh}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="field-label">{a.password}</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="field-input"
            placeholder={a.passwordPh}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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
