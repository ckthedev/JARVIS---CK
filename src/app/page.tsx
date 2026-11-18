import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { hasAdminUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const adminExists = await hasAdminUser();

  if (!adminExists) {
    redirect("/setup");
  }

  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
