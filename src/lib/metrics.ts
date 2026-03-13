import { MapPoint, SummaryMetrics } from "@/lib/types";

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

  for (const point of points) {
    if (point.apiVolume > 0) {
      apiDestinations += 1;
    }

    if (point.clientVolume > 0) {
      clientDestinations += 1;
    }

    if (point.apiVolume > 0 && point.clientVolume > 0) {
      overlapPoints.push(point);
    }
  }

  const overlapDestinations = overlapPoints.length;
  const overlapPercent = clientDestinations === 0 ? 0 : (overlapDestinations / clientDestinations) * 100;
  const topOverlapAirports = [...overlapPoints]
    .sort((a, b) => b.apiVolume + b.clientVolume - (a.apiVolume + a.clientVolume))
    .slice(0, 5);

  return {
    apiDestinations,
    clientDestinations,
    overlapDestinations,
    overlapPercent,
    topOverlapAirports
  };
}
