import { eq, and, lte, gte } from "drizzle-orm";
import { db, usersTable, notificationsTable, subscriptionsTable } from "@workspace/db";

export async function notifyAdmins(type: string, title: string, message: string, relatedId?: number) {
  const admins = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "admin"));
  for (const admin of admins) {
    await db.insert(notificationsTable).values({ userId: admin.id, type, title, message, relatedId: relatedId ?? null });
  }
}

export async function notifyUser(userId: number, type: string, title: string, message: string, relatedId?: number) {
  await db.insert(notificationsTable).values({ userId, type, title, message, relatedId: relatedId ?? null });
}

export async function checkExpiringSubscriptions() {
  const today = new Date();
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);
  const todayStr = today.toISOString().split("T")[0];
  const in7DaysStr = in7Days.toISOString().split("T")[0];

  const expiringSubs = await db.select({
    id: subscriptionsTable.id,
    customerId: subscriptionsTable.customerId,
    endDate: subscriptionsTable.endDate,
    customerName: usersTable.name,
  })
    .from(subscriptionsTable)
    .innerJoin(usersTable, eq(subscriptionsTable.customerId, usersTable.id))
    .where(
      and(
        eq(subscriptionsTable.status, "active"),
        gte(subscriptionsTable.endDate, todayStr),
        lte(subscriptionsTable.endDate, in7DaysStr)
      )
    );

  for (const sub of expiringSubs) {
    const [existing] = await db.select().from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.userId, sub.customerId),
          eq(notificationsTable.type, "subscription_expiring"),
          eq(notificationsTable.relatedId, sub.id)
        )
      )
      .limit(1);

    if (!existing) {
      await notifyUser(
        sub.customerId,
        "subscription_expiring",
        "Package Expiring Soon",
        `Your package expires on ${sub.endDate}. Please renew to avoid service interruption.`,
        sub.id
      );
    }
  }
}
