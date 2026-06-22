"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Contraseña incorrecta.");
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-margin-mobile">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-glow"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed/30 text-primary">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="font-headline-sm text-headline-sm text-on-surface">
            Panel de Administración
          </h1>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            Ingresa la contraseña de la tienda.
          </p>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <Input
              label="Contraseña"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              error={error ?? undefined}
            />
            <button
              type="button"
              aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-[42px] inline-flex h-8 w-8 items-center justify-center text-on-surface-variant hover:text-on-surface"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            Entrar
          </Button>
        </div>
      </form>
    </main>
  );
}
