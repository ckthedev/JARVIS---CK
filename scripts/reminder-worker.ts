/**
 * JARVIS Background Reminder Worker
 *
 * Runs as a standalone background daemon process or scheduler.
 * Features:
 * - Starts pg-boss queue
 * - Executes startup recovery for missed reminders while offline
 * - Polls for due reminders and generates in-app notifications & delivery logs
 * - Advances recurring reminder schedules automatically
 * - Handles graceful termination (SIGINT, SIGTERM)
 */

import { startBoss, stopBoss } from "../src/modules/reminders/scheduler/pgboss-client";
import { schedulerEngine } from "../src/modules/reminders/scheduler/engine";
import { prisma } from "../src/lib/prisma/client";

async function runWorker() {
  console.log("==================================================");
  console.log("   JARVIS - Reminder & Notification Worker");
  console.log("==================================================");
  console.log(`[Worker] Starting at ${new Date().toISOString()}`);

  try {
    // 1. Start PgBoss
    const boss = await startBoss();
    if (!boss) {
      throw new Error("Failed to initialize pg-boss queue");
    }
    console.log("[Worker] pg-boss queue engine started successfully.");

    // 2. Recover missed reminders from offline downtime
    console.log("[Worker] Running startup recovery check for missed reminders...");
    const recovery = await schedulerEngine.recoverMissedReminders();
    console.log(`[Worker] Startup recovery complete: ${recovery.recoveredCount} past-due reminders processed.`);

    // 3. Register PgBoss job worker
    await boss.work("reminder-process-job", async (jobs: any) => {
      const jobList = Array.isArray(jobs) ? jobs : [jobs];
      for (const job of jobList) {
        const { reminderId } = job.data as { reminderId: string };
        console.log(`[Worker] PgBoss processing job for reminder: ${reminderId}`);
        await schedulerEngine.processReminder(reminderId);
      }
    });

    // 4. Polling loop: every 10 seconds check for due reminders in database
    console.log("[Worker] Starting periodic polling ticker (every 10s)...");
    const interval = setInterval(async () => {
      try {
        const result = await schedulerEngine.checkDueReminders();
        if (result.processedCount > 0) {
          console.log(`[Worker Tick] Processed ${result.processedCount} due reminders at ${new Date().toISOString()}`);
        }
      } catch (err) {
        console.error("[Worker Tick Error]", err);
      }
    }, 10000);

    // Graceful shutdown
    const cleanup = async (signal: string) => {
      console.log(`\n[Worker] Received ${signal}. Shutting down gracefully...`);
      clearInterval(interval);
      try {
        await stopBoss();
        await prisma.$disconnect();
        console.log("[Worker] Clean shutdown complete.");
        process.exit(0);
      } catch (err) {
        console.error("[Worker] Error during shutdown:", err);
        process.exit(1);
      }
    };

    process.on("SIGINT", () => cleanup("SIGINT"));
    process.on("SIGTERM", () => cleanup("SIGTERM"));

    console.log("[Worker] Ready and awaiting scheduled reminders.\n");
  } catch (error) {
    console.error("[Worker Fatal Error]", error);
    process.exit(1);
  }
}

// Run worker if executed directly
if (require.main === module || process.argv[1]?.endsWith("reminder-worker.ts")) {
  runWorker();
}

export { runWorker };
