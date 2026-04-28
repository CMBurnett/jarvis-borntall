"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { siteConfig } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, CheckCircle } from "lucide-react";

type Step = "email" | "sent";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  const appLogo = isDark ? siteConfig.appLogo.dark : siteConfig.appLogo.light;
  let companyLogoSrc: string | null = null;
  if (siteConfig.companyLogo) {
    companyLogoSrc = isDark ? siteConfig.companyLogo.dark : siteConfig.companyLogo.light;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setStep("sent");
    }
  }

  return (
    <div className="relative overflow-hidden min-h-screen bg-dot-pattern bg-background flex items-center justify-center p-4">
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-150 h-64"
        style={{ background: "radial-gradient(ellipse at 50% 0%, var(--brand-glow) 0%, transparent 70%)" }}
      />
      <div className="relative w-full max-w-sm">
        {/* Logos */}
        <div className="flex flex-col items-center mb-8 gap-4">
          {mounted && (
            <>
              {companyLogoSrc && (
                <Image src={companyLogoSrc} alt={siteConfig.companyName} width={160} height={44} className="h-11 w-auto" priority />
              )}
              <Image src={appLogo} alt={siteConfig.appName} width={80} height={24} className="h-5 w-auto opacity-40" priority />
            </>
          )}
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {step === "email" ? (
            <>
              <div className="mb-6">
                <h2 className="text-base font-semibold text-foreground">Sign in</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email to receive a sign-in link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button type="submit" className="w-full bg-brand-gradient border-0" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send sign-in link
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center text-center gap-4 py-2">
              <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Check your email</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a sign-in link to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
              <button
                onClick={() => { setStep("email"); setError(null); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          No password required. Just a link.
        </p>
      </div>
    </div>
  );
}

