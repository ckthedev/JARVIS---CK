import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { hasAdminUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";
import { Spinner } from "@/components/ui/spinner";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const adminExists = await hasAdminUser();

  // If no administrator has been configured yet, route directly to setup
  if (!adminExists) {
    redirect("/setup");
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
