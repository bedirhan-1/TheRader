"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("E-posta veya şifre hatalı.");
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm text-muted-foreground">
          E-posta
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@therader.app"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="h-10 border-border bg-card text-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm text-muted-foreground">
          Şifre
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="h-10 border-border bg-card text-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      {error && (
        <div className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="h-10 w-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Giriş yapılıyor...
          </span>
        ) : (
          "Giriş Yap"
        )}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-[360px] space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-background"
              >
                <path
                  d="M3 2L8 14L13 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              The Rader
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Trading paneline giriş yapın
          </p>
        </div>

        {/* Suspense Wrapper for useSearchParams */}
        <Suspense
          fallback={
            <div className="text-center text-sm text-muted-foreground">
              Yükleniyor...
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
          Yalnızca yetkili kullanıcılar erişebilir.
        </div>
      </div>
    </div>
  );
}
