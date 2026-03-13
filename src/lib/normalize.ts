import { AirportReference, Category, MapPoint, NormalizedCsvRow } from "@/lib/types";

export function buildAirportMap(airports: AirportReference[]) {
  return new Map(airports.map((airport) => [airport.iata.toUpperCase(), airport]));
}

export function combineDatasets(args: {
  apiRows: NormalizedCsvRow[];
  clientRows: NormalizedCsvRow[];
  airportMap: Map<string, AirportReference>;
}) {
  const { apiRows, clientRows, airportMap } = args;
  const apiMap = new Map(apiRows.map((row) => [row.iata, row]));
  const clientMap = new Map(clientRows.map((row) => [row.iata, row]));
  const allIatas = Array.from(new Set([...apiMap.keys(), ...clientMap.keys()])).sort();

  const points: MapPoint[] = [];

  allIatas.forEach((iata) => {
    const reference = airportMap.get(iata);
    if (!reference) {
      return;
    }

    const apiVolume = apiMap.get(iata)?.volume ?? 0;
    const clientVolume = clientMap.get(iata)?.volume ?? 0;

    let category: Category = "overlap";
    if (apiVolume > 0 && clientVolume === 0) {
      category = "api-only";
    } else if (clientVolume > 0 && apiVolume === 0) {
      category = "client-only";
    }

    points.push({
      ...reference,
      apiVolume,
      clientVolume,
      totalVolume: apiVolume + clientVolume,
      category
    });
  });

  return points;
}
