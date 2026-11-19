import React from "react";
import { Toaster } from "@/components/ui/toast";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 antialiased text-foreground selection:bg-primary selection:text-background relative overflow-hidden">
      {/* Subtle warm background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/40 via-background to-background pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">{children}</div>
      <Toaster />
    </div>
  );
}
