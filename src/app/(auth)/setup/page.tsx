import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { hasAdminUser } from "@/lib/auth/session";
import { SetupForm } from "./setup-form";
import { Spinner } from "@/components/ui/spinner";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const adminExists = await hasAdminUser();

  // If an administrator already exists, redirect immediately to login
  if (adminExists) {
    redirect("/login");
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <SetupForm />
    </Suspense>
  );
}
