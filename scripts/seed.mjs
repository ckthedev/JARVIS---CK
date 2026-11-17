import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@jarvis.local";
  const adminName = process.env.ADMIN_NAME || "Tony Stark";
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "JarvisAdmin2026!";

  console.log(`[BOOTSTRAP] Checking for existing administrator (${adminEmail})...`);

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ email: adminEmail }, { role: "ADMIN" }],
    },
  });

  if (existingAdmin) {
    console.log(`[BOOTSTRAP] Administrator already exists: ${existingAdmin.email} (${existingAdmin.id})`);
    return;
  }

  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
      passwordHash: passwordHash,
      role: "ADMIN",
      settings: {
        create: {
          theme: "dark",
          timezone: "UTC",
          notificationEmail: true,
          notificationBrowser: true,
          digestFrequency: "DAILY",
          sidebarCollapsed: false,
        },
      },
      notifications: {
        create: {
          title: "JARVIS Core Online",
          message: "JARVIS foundation initialized. System ready for personal operations.",
          type: "SUCCESS",
          isRead: false,
        },
      },
    },
    include: {
      settings: true,
      notifications: true,
    },
  });

  console.log(`[BOOTSTRAP] Administrator created successfully:`);
  console.log(`  ID: ${admin.id}`);
  console.log(`  Name: ${admin.name}`);
  console.log(`  Email: ${admin.email}`);
  console.log(`  Role: ${admin.role}`);
  console.log(`[BOOTSTRAP] Default settings and initial welcome notification generated.`);
}

main()
  .catch((e) => {
    console.error("[BOOTSTRAP ERROR]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
