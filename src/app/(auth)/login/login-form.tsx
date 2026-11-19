"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Bot, Lock, Mail, AlertCircle, CheckCircle2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const setupSuccess = searchParams.get("setup") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setError("Invalid administrator credentials. Access denied.");
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("An unexpected authentication error occurred.");
      setLoading(false);
    }
  };

  return (
    <Card className="border border-border bg-card shadow-saas rounded-2xl">
      <CardHeader className="space-y-3 text-center pb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-subtle text-primary shadow-saas">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <CardTitle className="text-xl font-bold tracking-tight text-primary-text font-sans">
            JARVIS
          </CardTitle>
          <CardDescription className="text-xs text-secondary-text mt-1">
            Personal AI Assistant &bull; Authorized Operator Access
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {setupSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Administrator account initialized successfully. Please authenticate.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Operator Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-secondary-text" />
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="ck@jarvis.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Passphrase</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-secondary-text" />
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter your passphrase"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-2 font-semibold"
            isLoading={loading}
          >
            Authenticate Core
          </Button>
        </form>

        <div className="mt-6 border-t border-border/50 pt-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-secondary-text">
            <ShieldCheck className="h-3.5 w-3.5 text-primary/70" />
            <span>Private Single-User System &bull; Registration Disabled</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
