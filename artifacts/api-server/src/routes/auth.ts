import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, usersTable, otpCodesTable } from "@workspace/db";
import { generateOtp, hashPassword, comparePassword, signToken } from "../lib/auth";
import { requireAuth } from "../middlewares/auth";
import { sendOtpNotification } from "../lib/notifications";

const router: IRouter = Router();

router.post("/auth/send-otp", async (req, res): Promise<void> => {
  const { phone } = req.body;
  if (!phone) { res.status(400).json({ error: "Phone required" }); return; }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.insert(otpCodesTable).values({ phone, code: otp, expiresAt });
  await sendOtpNotification(phone, otp);

  req.log.info({ phone }, "OTP sent");
  res.json({ message: `OTP sent to ${phone}. Code: ${otp}` });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const { phone, otp, name, password, address, zone } = req.body;
  if (!phone || !otp || !name || !password) {
    res.status(400).json({ error: "phone, otp, name, password required" }); return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (existing && existing.status !== "pending-claim") {
    res.status(409).json({ error: "Phone already registered" }); return;
  }

  const validOtp = await db.select().from(otpCodesTable).where(
    and(eq(otpCodesTable.phone, phone), eq(otpCodesTable.code, otp), eq(otpCodesTable.used, false), gt(otpCodesTable.expiresAt, new Date()))
  );
  if (!validOtp.length) { res.status(400).json({ error: "Invalid or expired OTP" }); return; }

  await db.update(otpCodesTable).set({ used: true }).where(eq(otpCodesTable.id, validOtp[0].id));

  const passwordHash = await hashPassword(password);

  let user;
  if (existing?.status === "pending-claim") {
    [user] = await db.update(usersTable).set({ passwordHash, status: "active", name, address, zone }).where(eq(usersTable.id, existing.id)).returning();
  } else {
    [user] = await db.insert(usersTable).values({ phone, name, passwordHash, role: "customer", status: "active", address, zone }).returning();
  }

  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({ token, user: { id: user.id, phone: user.phone, name: user.name, role: user.role, status: user.status, address: user.address, zone: user.zone, createdAt: user.createdAt } });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { phone, otp } = req.body;
  if (!phone || !otp) { res.status(400).json({ error: "phone and otp required" }); return; }

  // Validate OTP first — before revealing whether the phone is registered
  const validOtp = await db.select().from(otpCodesTable).where(
    and(eq(otpCodesTable.phone, phone), eq(otpCodesTable.code, otp), eq(otpCodesTable.used, false), gt(otpCodesTable.expiresAt, new Date()))
  );
  if (!validOtp.length) { res.status(400).json({ error: "Invalid or expired OTP" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));

  if (!user) {
    // Valid OTP, phone not registered — don't consume it so register step can use it
    res.status(404).json({ error: "Phone not registered" }); return;
  }
  if (user.status === "suspended") { res.status(403).json({ error: "Account suspended" }); return; }
  if (user.status === "pending-claim") {
    // Valid OTP, pending-claim — don't consume it so claim step can use it
    res.status(403).json({ error: "Account pending claim — please set your password first" }); return;
  }

  // Successful login — mark OTP used now
  await db.update(otpCodesTable).set({ used: true }).where(eq(otpCodesTable.id, validOtp[0].id));

  const token = signToken({ userId: user.id, role: user.role });
  res.json({ token, user: { id: user.id, phone: user.phone, name: user.name, role: user.role, status: user.status, address: user.address, zone: user.zone, createdAt: user.createdAt } });
});

router.post("/auth/claim-account", async (req, res): Promise<void> => {
  const { phone, otp, password } = req.body;
  if (!phone || !otp || !password) { res.status(400).json({ error: "phone, otp, password required" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (!user) { res.status(404).json({ error: "Phone not found" }); return; }
  if (user.status !== "pending-claim") { res.status(400).json({ error: "Account already claimed" }); return; }

  const validOtp = await db.select().from(otpCodesTable).where(
    and(eq(otpCodesTable.phone, phone), eq(otpCodesTable.code, otp), eq(otpCodesTable.used, false), gt(otpCodesTable.expiresAt, new Date()))
  );
  if (!validOtp.length) { res.status(400).json({ error: "Invalid or expired OTP" }); return; }

  await db.update(otpCodesTable).set({ used: true }).where(eq(otpCodesTable.id, validOtp[0].id));

  const passwordHash = await hashPassword(password);
  const [updated] = await db.update(usersTable).set({ passwordHash, status: "active" }).where(eq(usersTable.id, user.id)).returning();

  const token = signToken({ userId: updated.id, role: updated.role });
  res.json({ token, user: { id: updated.id, phone: updated.phone, name: updated.name, role: updated.role, status: updated.status, address: updated.address, zone: updated.zone, createdAt: updated.createdAt } });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ id: user.id, phone: user.phone, name: user.name, role: user.role, status: user.status, address: user.address, zone: user.zone, createdAt: user.createdAt });
});

export default router;
