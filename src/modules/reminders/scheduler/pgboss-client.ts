import { PgBoss } from "pg-boss";

let bossInstance: PgBoss | null = null;
let isStarted = false;
let startPromise: Promise<PgBoss | null> | null = null;

export function getBossClient(): PgBoss | null {
  if (bossInstance) return bossInstance;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("[PgBoss] DATABASE_URL is not set. PgBoss queue disabled.");
    return null;
  }

  try {
    bossInstance = new PgBoss({
      connectionString,
      application_name: "jarvis-reminder-worker",
      max: 5,
    });

    bossInstance.on("error", (error) => {
      console.error("[PgBoss Error]", error);
    });

    return bossInstance;
  } catch (err) {
    console.error("[PgBoss Init Failed]", err);
    return null;
  }
}

export async function startBoss(): Promise<PgBoss | null> {
  const boss = getBossClient();
  if (!boss) return null;

  if (isStarted) return boss;

  if (startPromise) {
    return startPromise;
  }

  startPromise = (async () => {
    try {
      await boss.start();
      try {
        await boss.createQueue("reminder-process-job");
      } catch {
        // Queue may already exist
      }
      isStarted = true;
      return boss;
    } catch (err) {
      console.error("[PgBoss Start Failed]", err);
      return null;
    } finally {
      startPromise = null;
    }
  })();

  return startPromise;
}

export async function stopBoss(): Promise<void> {
  if (bossInstance && isStarted) {
    try {
      await bossInstance.stop({ graceful: true, timeout: 5000 });
      isStarted = false;
      bossInstance = null;
    } catch (err) {
      console.error("[PgBoss Stop Failed]", err);
    }
  }
}

export function isBossStarted(): boolean {
  return isStarted;
}
