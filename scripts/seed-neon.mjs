import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { neon } from "@neondatabase/serverless";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

async function readJson(relativePath, fallbackValue) {
  const filePath = path.join(rootDir, relativePath);

  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return fallbackValue;
    }

    throw error;
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

function normalizeAirports(airports) {
  const merged = new Map();

  for (const airport of airports) {
    const iata = String(airport.iata ?? "").trim().toUpperCase();
    if (!iata) {
      continue;
    }

    merged.set(iata, {
      iata,
      city: String(airport.city ?? "").trim(),
      country: String(airport.country ?? "").trim(),
      region: String(airport.region ?? "").trim(),
      latitude: Number(airport.latitude),
      longitude: Number(airport.longitude)
    });
  }

  return Array.from(merged.values()).sort((a, b) => a.iata.localeCompare(b.iata));
}

async function applySchema(sql) {
  const schemaPath = path.join(rootDir, "db", "schema.sql");
  const schema = await fs.readFile(schemaPath, "utf8");
  const statements = schema
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql.query(statement);
  }
}

async function seedAirports(sql, airports) {
  const chunkSize = 500;

  for (let index = 0; index < airports.length; index += chunkSize) {
    const chunk = airports.slice(index, index + chunkSize);
    const params = chunk.flatMap((airport) => [
      airport.iata,
      airport.city,
      airport.country,
      airport.region,
      airport.latitude,
      airport.longitude
    ]);

    const valuesClause = chunk
      .map((_, chunkIndex) => {
        const offset = chunkIndex * 6;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
      })
      .join(", ");

    await sql.query(
      `
        insert into airports (iata, city, country, region, latitude, longitude)
        values ${valuesClause}
        on conflict (iata)
        do update set
          city = excluded.city,
          country = excluded.country,
          region = excluded.region,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          updated_at = now()
      `,
      params
    );
  }
}

async function seedAdmin(sql) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("Skipping admin user sync because ADMIN_EMAIL or ADMIN_PASSWORD is not set.");
    return;
  }

  await sql.query(
    `
      insert into admin_users (email, password_hash)
      values ($1, $2)
      on conflict (email)
      do update set
        password_hash = excluded.password_hash,
        updated_at = now()
    `,
    [email, hashPassword(password)]
  );

  console.log(`Synced admin user ${email}.`);
}

async function main() {
  const sql = neon(requireEnv("DATABASE_URL"));
  const seedAirportsJson = await readJson("src/data/seed-airports.json", []);
  const localAirportsJson = await readJson("data/airports.json", []);
  const airports = normalizeAirports([...seedAirportsJson, ...localAirportsJson]);

  await applySchema(sql);
  await seedAirports(sql, airports);
  await seedAdmin(sql);

  console.log(`Synced ${airports.length} airports to Neon.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
