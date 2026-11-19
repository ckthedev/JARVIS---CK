"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  KeyRound,
  Settings,
  LogOut,
  ChevronDown,
  X,
  ShieldCheck,
} from "lucide-react";

interface UserNavProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    avatarUrl?: string | null;
  };
}

export function UserNav({ user }: UserNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
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
          toast({
            title: "Password Update Failed",
            description: data.error || "Unable to update password",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Password Updated",
        description: "Your administrator password has been updated securely.",
        variant: "success",
      });

      setPasswordModalOpen(false);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      toast({
        title: "Error",
        description: "Network error occurred while updating password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-sidebar-accent transition-colors text-left"
          aria-label="User menu"
        >
          <Avatar name={user.name || "Admin"} src={user.avatarUrl} size="sm" />
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-semibold text-foreground leading-tight">
              {user.name || "Administrator"}
            </span>
            <span className="text-[10px] text-secondary-text leading-tight">
              {user.role || "ADMIN"}
            </span>
          </div>
          <ChevronDown className="hidden md:block h-3.5 w-3.5 text-secondary-text" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card shadow-dropdown z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="border-b border-border p-3 bg-muted/60">
              <p className="text-xs font-semibold text-primary-text truncate">
                {user.name || "Administrator"}
              </p>
              <p className="text-[11px] text-secondary-text truncate mt-0.5">
                {user.email}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <ShieldCheck className="h-3 w-3" /> {user.role || "ADMIN"}
                </span>
              </div>
            </div>

            <div className="p-1 space-y-0.5">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setPasswordModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
              >
                <KeyRound className="h-3.5 w-3.5 text-primary" />
                Change Password
              </button>

              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
              >
                <Settings className="h-3.5 w-3.5 text-secondary-text" />
                System Settings
              </Link>
            </div>

            <div className="border-t border-border p-1">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-danger hover:bg-danger/10 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Dialog Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 text-foreground shadow-elevated animate-in fade-in-50 zoom-in-95">
            <button
              onClick={() => {
                setPasswordModalOpen(false);
                setFormErrors({});
              }}
              className="absolute top-4 right-4 text-secondary-text hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 border border-primary/20 text-primary">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Change Password
                </h3>
                <p className="text-xs text-secondary-text">
                  Update your private administrator credentials.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, currentPassword: e.target.value })
                  }
                  required
                />
                {formErrors.currentPassword && (
                  <p className="text-xs text-red-400">
                    {formErrors.currentPassword[0]}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                  required
                />
                {formErrors.newPassword && (
                  <p className="text-xs text-red-400">
                    {formErrors.newPassword[0]}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, confirmPassword: e.target.value })
                  }
                  required
                />
                {formErrors.confirmPassword && (
                  <p className="text-xs text-red-400">
                    {formErrors.confirmPassword[0]}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPasswordModalOpen(false);
                    setFormErrors({});
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={loading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
