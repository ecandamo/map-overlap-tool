import { FileAirportRepository } from "@/lib/server/file-airport-repository";
import { PostgresAirportRepository } from "@/lib/server/postgres-airport-repository";

export function getAirportRepository() {
  if (process.env.DATABASE_URL) {
    return new PostgresAirportRepository();
  }

  return new FileAirportRepository();
}
