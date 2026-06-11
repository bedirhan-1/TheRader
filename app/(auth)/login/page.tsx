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
    <div className="flex min-h-screen flex-col md:flex-row bg-background text-foreground">
      {/* Left side: Brand Panel (Visible on all screens, stacks on mobile) */}
      <div className="relative flex w-full md:w-1/2 items-center justify-center bg-linear-to-b from-zinc-900 via-zinc-950 to-black border-b border-border md:border-b-0 md:border-r py-16 md:py-0 overflow-hidden">
        {/* Decorative Grid and Ambient Lights */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#2a2a35_1px,transparent_1px),linear-gradient(to_bottom,#2a2a35_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_85%,transparent_100%)] opacity-70" />
        <div className="absolute top-1/4 left-1/3 h-[350px] w-[350px] rounded-full bg-emerald-500/5 blur-[120px] animate-pulse duration-8000" />
        <div className="absolute bottom-1/4 right-1/3 h-[350px] w-[350px] rounded-full bg-blue-500/5 blur-[120px] animate-pulse duration-10000" />

        <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-8 max-w-md">
          <div className="transition-all duration-700 hover:scale-105 hover:-rotate-1 group">
            <div className="relative p-2 rounded-[40px] bg-linear-to-b from-zinc-800 to-zinc-900 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              <img
                src="/logo.png"
                alt="The Rader Logo"
                className="h-56 sm:h-72 md:h-[290px] lg:h-[340px] w-auto object-contain rounded-[32px] bg-zinc-950"
              />
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-linear-to-b from-white to-zinc-400">
              The Rader
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Gelişmiş trading stratejileri, gerçek zamanlı takip ve otomatik
              işlem paneli.
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Login Panel */}
      <div className="flex w-full flex-col justify-between p-8 md:w-1/2 lg:p-16 py-12 bg-zinc-950/20">
        <div className="flex items-center justify-between md:hidden">
          <div />
        </div>

        {/* Form Container */}
        <div className="mx-auto my-auto w-full max-w-[380px] space-y-8">
          <div className="space-y-3">
            {/* Desktop only small logo with hover animation */}
            <div className="hidden md:inline-block mb-2 transition-transform duration-300 hover:scale-110">
              <img
                src="/logo-small.png"
                alt="The Rader Logo"
                className="h-12 w-auto object-contain rounded-xl border border-white/5 bg-zinc-900 p-1"
              />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Şimdi Giriş Yapın
            </h1>
            <p className="text-sm text-muted-foreground">
              Trading dünyasına adım atın ve portföyünüzü yönetin.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="text-center text-sm text-muted-foreground py-8">
                Yükleniyor...
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-8">
          © {new Date().getFullYear()} The Rader. Yalnızca yetkili kullanıcılar
          erişebilir.
        </div>
      </div>
    </div>
  );
}
