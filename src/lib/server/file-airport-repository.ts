import fs from "fs/promises";
import path from "path";

import seedAirports from "@/data/seed-airports.json";
import { AirportReference } from "@/lib/types";
import { AirportRepository } from "@/lib/server/repository";

const DATA_PATH = path.join(process.cwd(), "data", "airports.json");

async function ensureDataFile() {
  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, "[]", "utf8");
  }
}

/** Read merged JSON without creating files (serverless FS is read-only; gitignored path may be absent). */
async function readOptionalLocalAirports(): Promise<AirportReference[]> {
  try {
    const content = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(content) as AirportReference[];
  } catch {
    return [];
  }
}

async function readLocalAirports(): Promise<AirportReference[]> {
  await ensureDataFile();
  const content = await fs.readFile(DATA_PATH, "utf8");
  return JSON.parse(content) as AirportReference[];
}

async function writeLocalAirports(airports: AirportReference[]) {
  await ensureDataFile();
  await fs.writeFile(DATA_PATH, JSON.stringify(airports, null, 2), "utf8");
}

export class FileAirportRepository implements AirportRepository {
  async getAll() {
    const localAirports = await readOptionalLocalAirports();
    const merged = new Map<string, AirportReference>();

    [...seedAirports, ...localAirports].forEach((airport) => {
      merged.set(airport.iata.toUpperCase(), {
        ...airport,
        iata: airport.iata.toUpperCase()
      });
    });

    return Array.from(merged.values()).sort((a, b) => a.iata.localeCompare(b.iata));
  }

  async upsert(airport: AirportReference) {
    const normalizedAirport = {
      ...airport,
      iata: airport.iata.toUpperCase()
    };
    const current = await readLocalAirports();
    const next = current.filter((entry) => entry.iata.toUpperCase() !== normalizedAirport.iata);
    next.push(normalizedAirport);
    await writeLocalAirports(next.sort((a, b) => a.iata.localeCompare(b.iata)));
    return normalizedAirport;
  }

  async remove(iata: string) {
    const current = await readLocalAirports();
    const next = current.filter((entry) => entry.iata !== iata.toUpperCase());
    await writeLocalAirports(next);
  }

  async bulkUpsert(airports: AirportReference[]) {
    const current = await readLocalAirports();
    const merged = new Map(current.map((airport) => [airport.iata.toUpperCase(), airport]));

    airports.forEach((airport) => {
      merged.set(airport.iata.toUpperCase(), {
        ...airport,
        iata: airport.iata.toUpperCase()
      });
    });

    await writeLocalAirports(Array.from(merged.values()).sort((a, b) => a.iata.localeCompare(b.iata)));
    return airports.length;
  }
}
