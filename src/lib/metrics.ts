import { MapPoint, SummaryMetrics } from "@/lib/types";

const POTENTIAL_CITY_WEIGHT = 1;
const POTENTIAL_COUNTRY_WEIGHT = 0.6;
const POTENTIAL_REGION_WEIGHT = 0.25;

function normalizeLocationValue(value: string) {
  return value.trim().toLowerCase();
}

export function filterPointsByRegion(points: MapPoint[], region: string) {
  if (!region || region === "All regions") {
    return points;
  }

  return points.filter((point) => point.region === region);
}

export function getRegions(points: MapPoint[]) {
  return Array.from(new Set(points.map((point) => point.region))).sort();
}

export function computeSummary(points: MapPoint[]): SummaryMetrics {
  let apiDestinations = 0;
  let clientDestinations = 0;
  const overlapPoints: MapPoint[] = [];
  const apiOnlyPoints: MapPoint[] = [];
  const clientOnlyPoints: MapPoint[] = [];

  for (const point of points) {
    if (point.apiVolume > 0) {
      apiDestinations += 1;
    }

    if (point.clientVolume > 0) {
      clientDestinations += 1;
    }

    if (point.apiVolume > 0 && point.clientVolume > 0) {
      overlapPoints.push(point);
    } else if (point.apiVolume > 0) {
      apiOnlyPoints.push(point);
    } else if (point.clientVolume > 0) {
      clientOnlyPoints.push(point);
    }
  }

  const apiCities = new Set(apiOnlyPoints.concat(overlapPoints).map((point) => normalizeLocationValue(point.city)));
  const apiCountries = new Set(apiOnlyPoints.concat(overlapPoints).map((point) => normalizeLocationValue(point.country)));
  const apiRegions = new Set(apiOnlyPoints.concat(overlapPoints).map((point) => normalizeLocationValue(point.region)));

  let potentialOverlapScore = 0;
  let potentialCityMatches = 0;
  let potentialCountryMatches = 0;
  let potentialRegionMatches = 0;

  for (const point of clientOnlyPoints) {
    const city = normalizeLocationValue(point.city);
    const country = normalizeLocationValue(point.country);
    const region = normalizeLocationValue(point.region);

    if (apiCities.has(city)) {
      potentialOverlapScore += POTENTIAL_CITY_WEIGHT;
      potentialCityMatches += 1;
      continue;
    }

    if (apiCountries.has(country)) {
      potentialOverlapScore += POTENTIAL_COUNTRY_WEIGHT;
      potentialCountryMatches += 1;
      continue;
    }

    if (apiRegions.has(region)) {
      potentialOverlapScore += POTENTIAL_REGION_WEIGHT;
      potentialRegionMatches += 1;
    }
  }

  const overlapDestinations = overlapPoints.length;
  const overlapPercent = clientDestinations === 0 ? 0 : (overlapDestinations / clientDestinations) * 100;
  const potentialOverlapPercent =
    clientDestinations === 0 ? 0 : Math.min(100, ((overlapDestinations + potentialOverlapScore) / clientDestinations) * 100);
  const topOverlapAirports = [...overlapPoints]
    .sort((a, b) => b.apiVolume + b.clientVolume - (a.apiVolume + a.clientVolume))
    .slice(0, 3);

  return {
    apiDestinations,
    clientDestinations,
    overlapDestinations,
    overlapPercent,
    potentialOverlapPercent,
    potentialOverlapScore,
    potentialCityMatches,
    potentialCountryMatches,
    potentialRegionMatches,
    topOverlapAirports
  };
}
