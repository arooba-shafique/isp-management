import app from "./app";
import { logger } from "./lib/logger";
import { checkExpiringSubscriptions } from "./lib/notify";
import { db, trialSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function seedTrialSettings() {
  try {
    const [existing] = await db.select().from(trialSettingsTable).limit(1);
    if (!existing) {
      await db.insert(trialSettingsTable).values({
        isActive: false,
        trialDays: 7
      });
      logger.info("Seeded default trial settings");
    }
  } catch {
    // If table doesn't exist, skip seeding - this is fine for non-trial deployments
  }
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  seedTrialSettings().catch(err => logger.error({ err }, "Trial settings seed failed"));
  checkExpiringSubscriptions().catch(err => logger.error({ err }, "Expiry check failed"));
  setInterval(() => {
    checkExpiringSubscriptions().catch(err => logger.error({ err }, "Expiry check failed"));
  }, 60 * 60 * 1000);
});
