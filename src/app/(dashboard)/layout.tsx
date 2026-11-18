import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/toast";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background text-foreground antialiased">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <Header
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              avatarUrl: user.avatarUrl,
            }}
          />
          <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
            <div className="mx-auto max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
