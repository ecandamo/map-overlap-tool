import { neon } from "@neondatabase/serverless";

import { AirportReference } from "@/lib/types";
import { AirportRepository } from "@/lib/server/repository";

export class PostgresAirportRepository implements AirportRepository {
  private sql = neon(process.env.DATABASE_URL as string);

  async getAll() {
    const rows = await this.sql`
      select iata, city, country, region, latitude, longitude
      from airports
      order by iata asc
    `;
    return rows as AirportReference[];
  }

  async upsert(airport: AirportReference) {
    const rows = await this.sql`
      insert into airports (iata, city, country, region, latitude, longitude)
      values (${airport.iata}, ${airport.city}, ${airport.country}, ${airport.region}, ${airport.latitude}, ${airport.longitude})
      on conflict (iata)
      do update set
        city = excluded.city,
        country = excluded.country,
        region = excluded.region,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        updated_at = now()
      returning iata, city, country, region, latitude, longitude
    `;
    return rows[0] as AirportReference;
  }

  async remove(iata: string) {
    await this.sql`delete from airports where iata = ${iata.toUpperCase()}`;
  }

  async bulkUpsert(airports: AirportReference[]) {
    for (const airport of airports) {
      await this.upsert(airport);
    }
    return airports.length;
  }
}
