import { AirportReference } from "@/lib/types";

export interface AirportRepository {
  getAll(): Promise<AirportReference[]>;
  upsert(airport: AirportReference): Promise<AirportReference>;
  remove(iata: string): Promise<void>;
  bulkUpsert(airports: AirportReference[]): Promise<number>;
}
