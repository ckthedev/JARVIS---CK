"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

export function PasswordChangeCard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormErrors({});
    setSuccess(false);

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New passphrases do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwords),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFormErrors(data.details);
        } else {
          setError(data.error || "Failed to update password.");
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast({
        title: "Passphrase Updated",
        description: "Your administrator passphrase has been securely updated.",
        variant: "success",
      });
    } catch {
      setError("An unexpected network error occurred while updating passphrase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          Update Administrator Passphrase
        </CardTitle>
        <CardDescription>
          Enter your current passphrase and choose a new secure passphrase.
        </CardDescription>
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
            <span>Passphrase successfully updated with bcrypt 12 salt rounds.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="settings-currentPassword">Current Passphrase</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-secondary-text" />
              <Input
                id="settings-currentPassword"
                type="password"
                required
                placeholder="Current passphrase"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, currentPassword: e.target.value })
                }
                className="pl-9"
              />
            </div>
            {formErrors.currentPassword && (
              <p className="text-xs text-red-400">{formErrors.currentPassword[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-newPassword">New Passphrase</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-secondary-text" />
              <Input
                id="settings-newPassword"
                type="password"
                required
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, newPassword: e.target.value })
                }
                className="pl-9"
              />
            </div>
            {formErrors.newPassword && (
              <p className="text-xs text-red-400">{formErrors.newPassword[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-confirmPassword">Confirm New Passphrase</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-secondary-text" />
              <Input
                id="settings-confirmPassword"
                type="password"
                required
                placeholder="Re-enter new passphrase"
                value={passwords.confirmPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirmPassword: e.target.value })
                }
                className="pl-9"
              />
            </div>
            {formErrors.confirmPassword && (
              <p className="text-xs text-red-400">{formErrors.confirmPassword[0]}</p>
            )}
          </div>

          <Button type="submit" size="sm" isLoading={loading}>
            Update Passphrase
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
