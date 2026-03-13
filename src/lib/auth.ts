import crypto from "crypto";

import { cookies } from "next/headers";

import { countAdminUsers, findAdminUserByEmail, verifyAdminPassword } from "@/lib/server/admin-users";

const SESSION_COOKIE = "map_overlap_admin";

function getSecret() {
  return process.env.SESSION_SECRET || "local-dev-secret";
}

function createSignature(email: string) {
  return crypto.createHmac("sha256", getSecret()).update(email).digest("hex");
}

export function createSessionValue(email: string) {
  return `${email}:${createSignature(email)}`;
}

export function getConfiguredAdmin() {
  return {
    email: (process.env.ADMIN_EMAIL || "admin@local.test").trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD || "changeme123"
  };
}

export async function authenticateAdmin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (process.env.DATABASE_URL) {
    const adminUser = await findAdminUserByEmail(normalizedEmail);
    if (adminUser && verifyAdminPassword(password, adminUser.password_hash)) {
      return { email: adminUser.email };
    }

    const adminUserCount = await countAdminUsers();
    if (adminUserCount > 0) {
      return null;
    }
  }

  const admin = getConfiguredAdmin();
  if (normalizedEmail === admin.email && password === admin.password) {
    return { email: admin.email };
  }

  return null;
}

export async function setAdminSession(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionValue(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) {
    return null;
  }

  const [email, signature] = raw.split(":");
  if (!email || !signature) {
    return null;
  }

  if (createSignature(email) !== signature) {
    return null;
  }

  return { email };
}
