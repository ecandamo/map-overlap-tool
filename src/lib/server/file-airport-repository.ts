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
    const localAirports = await readLocalAirports();
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
    const current = await readLocalAirports();
    const next = current.filter((entry) => entry.iata !== airport.iata);
    next.push({
      ...airport,
      iata: airport.iata.toUpperCase()
    });
    await writeLocalAirports(next.sort((a, b) => a.iata.localeCompare(b.iata)));
    return airport;
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
