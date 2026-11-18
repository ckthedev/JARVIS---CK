import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

async function main() {
  console.log("[BOOTSTRAP] Inspecting JARVIS database state...");

  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, email: true, name: true, role: true },
  });

  if (existingAdmin) {
    console.log(
      `[BOOTSTRAP] Administrator account is already configured: ${existingAdmin.email} (${existingAdmin.name})`
    );
    console.log("[BOOTSTRAP] System is initialized and ready for login.");
    return;
  }

  console.log(
    "[BOOTSTRAP] No administrator configured yet."
  );
  console.log(
    "[BOOTSTRAP] Please launch JARVIS and navigate to http://localhost:3000/setup to configure your private administrator credentials."
  );
}

main()
  .catch((e) => {
    console.error("[BOOTSTRAP ERROR]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
