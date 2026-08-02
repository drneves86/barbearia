"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, ErrorBox, Field, Input, Spinner } from "@/components/ui";

export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col justify-center px-4 py-16">
      <div className="rounded-3xl border border-line bg-ink-soft/80 p-6 shadow-2xl">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/40 bg-panel text-2xl">
            🔐
          </div>
          <h1 className="text-xl font-bold text-cream">Área administrativa</h1>
          <p className="mt-1 text-sm text-muted">
            Acesse para gerenciar os agendamentos.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <ErrorBox message={error} />
          <Field label="E-mail">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@barbearia.com"
              autoComplete="email"
            />
          </Field>
          <Field label="Senha">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Field>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Spinner className="h-5 w-5" /> : null}
            Entrar
          </Button>
        </form>
      </div>
      <Link
        href="/"
        className="mt-5 text-center text-sm text-muted underline transition hover:text-gold"
      >
        ← Voltar para o site
      </Link>
    </div>
  );
}
