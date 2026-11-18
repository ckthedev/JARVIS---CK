import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma/client";
import { setupSchema } from "@/lib/validations/auth";
import { hasAdminUser } from "@/lib/auth/session";

export async function GET() {
  const adminExists = await hasAdminUser();
  return NextResponse.json({ setupRequired: !adminExists });
}

export async function POST(req: Request) {
  try {
    // 1. Permanent gate: Only allowed if zero administrators exist
    const adminExists = await hasAdminUser();
    if (adminExists) {
      return NextResponse.json(
        {
          error:
            "Administrator account already configured. Public registration is permanently disabled.",
        },
        { status: 403 }
      );
    }

    // 2. Validate input schema with Zod
    const body = await req.json();
    const result = setupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    // 3. Hash password using bcrypt (12 salt rounds)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Create single administrator record in PostgreSQL with default settings and notification
    const user = await prisma.$transaction(async (tx) => {
      // Re-check inside transaction to prevent race conditions
      const count = await tx.user.count({ where: { role: "ADMIN" } });
      if (count > 0) {
        throw new Error("ALREADY_EXISTS");
      }

      return await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
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
              message:
                "Personal administrator account initialized. Welcome to JARVIS.",
              type: "SUCCESS",
              isRead: false,
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Administrator account initialized successfully.",
        user: {
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "ALREADY_EXISTS") {
      return NextResponse.json(
        {
          error:
            "Administrator account already configured. Public registration is permanently disabled.",
        },
        { status: 403 }
      );
    }

    console.error("[SETUP_ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error occurred during administrator setup." },
      { status: 500 }
    );
  }
}
