import crypto from "crypto";

import { getSql } from "@/lib/server/database";

type AdminUserRow = {
  email: string;
  password_hash: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function deriveHash(password: string, salt: Buffer) {
  return crypto.scryptSync(password, salt, 64);
}

export function hashAdminPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const hash = deriveHash(password, salt);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyAdminPassword(password: string, storedHash: string) {
  const [algorithm, saltHex, hashHex] = storedHash.split(":");
  if (algorithm !== "scrypt" || !saltHex || !hashHex) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expectedHash = Buffer.from(hashHex, "hex");
  const actualHash = deriveHash(password, salt);

  if (expectedHash.length !== actualHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedHash, actualHash);
}

export async function findAdminUserByEmail(email: string) {
  const sql = getSql();
  const rows = await sql`
    select email, password_hash
    from admin_users
    where email = ${normalizeEmail(email)}
    limit 1
  `;

  return (rows[0] as AdminUserRow | undefined) ?? null;
}

export async function countAdminUsers() {
  const sql = getSql();
  const rows = await sql`select count(*)::int as count from admin_users`;
  return Number((rows[0] as { count: number | string } | undefined)?.count ?? 0);
}

export async function upsertAdminUser(email: string, password: string) {
  const sql = getSql();
  const normalizedEmail = normalizeEmail(email);
  const passwordHash = hashAdminPassword(password);

  await sql`
    insert into admin_users (email, password_hash)
    values (${normalizedEmail}, ${passwordHash})
    on conflict (email)
    do update set
      password_hash = excluded.password_hash,
      updated_at = now()
  `;

  return { email: normalizedEmail };
}
