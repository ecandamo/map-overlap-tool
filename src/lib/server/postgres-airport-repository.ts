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
    const normalizedAirport = {
      ...airport,
      iata: airport.iata.toUpperCase()
    };

    const rows = await this.sql`
      insert into airports (iata, city, country, region, latitude, longitude)
      values (${normalizedAirport.iata}, ${normalizedAirport.city}, ${normalizedAirport.country}, ${normalizedAirport.region}, ${normalizedAirport.latitude}, ${normalizedAirport.longitude})
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
    const chunkSize = 500;

    for (let index = 0; index < airports.length; index += chunkSize) {
      const chunk = airports.slice(index, index + chunkSize).map((airport) => ({
        ...airport,
        iata: airport.iata.toUpperCase()
      }));

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

      await this.sql.query(
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

    return airports.length;
  }
}
