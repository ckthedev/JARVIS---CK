"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Bot, Lock, Mail, User, AlertCircle, CheckCircle2 } from "lucide-react";

export function SetupForm() {
  const router = useRouter();

  const [name, setName] = useState("CK");
  const [email, setEmail] = useState("ck@jarvis.local");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password requirement checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!passwordsMatch) {
      setError("Passphrases do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        } else {
          setError(data.error || "Setup failed. Please try again.");
        }
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Automatically sign in the newly created administrator
      const loginRes = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (loginRes && !loginRes.error) {
        router.push("/dashboard");
        router.refresh();
      } else {
        router.push("/login?setup=success");
      }
    } catch {
      setError("An unexpected network error occurred during setup.");
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
            JARVIS CORE SETUP
          </CardTitle>
          <CardDescription className="text-xs text-secondary-text mt-1">
            First-Time Administrator Setup &bull; Secure Account Creation
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Administrator account initialized! Launching dashboard...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Operator Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-secondary-text" />
              <Input
                id="name"
                type="text"
                required
                placeholder="CK"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9"
              />
            </div>
            {fieldErrors.name && (
              <p className="text-xs text-red-400">{fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Operator Email Address</Label>
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
            {fieldErrors.email && (
              <p className="text-xs text-red-400">{fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Passphrase</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-secondary-text" />
              <Input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
              />
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-red-400">{fieldErrors.password[0]}</p>
            )}

            {/* Password requirements visual indicator */}
            <div className="mt-2 grid grid-cols-3 gap-1 text-[11px] text-secondary-text">
              <span className={hasMinLength ? "text-emerald-400" : ""}>
                &bull; 8+ characters
              </span>
              <span className={hasUppercase ? "text-emerald-400" : ""}>
                &bull; 1 uppercase
              </span>
              <span className={hasNumber ? "text-emerald-400" : ""}>
                &bull; 1 number
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Passphrase</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-secondary-text" />
              <Input
                id="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Re-enter passphrase"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-9"
              />
            </div>
            {confirmPassword.length > 0 && (
              <p
                className={`text-[11px] ${
                  passwordsMatch ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {passwordsMatch ? "Passphrases match" : "Passphrases do not match"}
              </p>
            )}
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-red-400">
                {fieldErrors.confirmPassword[0]}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full mt-2 font-semibold"
            isLoading={loading}
          >
            Initialize Core &amp; Create Administrator
          </Button>
        </form>

        <div className="mt-6 border-t border-border/50 pt-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-secondary-text">
            <ShieldCheck className="h-3.5 w-3.5 text-primary/70" />
            <span>
              Single-User Private Core &bull; Registration permanently locks after setup
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
