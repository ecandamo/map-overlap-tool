export type DatasetKind = "api" | "client";

export type Category = "api-only" | "client-only" | "overlap";

export type ThemeMode = "light" | "dark";

export type ColorConfig = {
  apiOnly: string;
  clientOnly: string;
  overlap: string;
};

export type CsvRowInput = {
  IATA?: string;
  iata?: string;
  city?: string;
  country?: string;
  region?: string;
  volume?: string | number;
};

export type AirportReference = {
  iata: string;
  city: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
};

export type NormalizedCsvRow = {
  iata: string;
  volume: number;
};

export type ValidationIssue = {
  rowNumber: number;
  message: string;
};

export type ParsedCsvResult = {
  fileName: string;
  source: DatasetKind;
  normalizedRows: NormalizedCsvRow[];
  issues: ValidationIssue[];
  unknownIatas: string[];
  rawRowCount: number;
  validRowCount: number;
  duplicateGroups: number;
  duplicateRowsMerged: number;
  matchedIatas: string[];
};

export type MapPoint = AirportReference & {
  apiVolume: number;
  clientVolume: number;
  totalVolume: number;
  category: Category;
};

export type SummaryMetrics = {
  apiDestinations: number;
  clientDestinations: number;
  overlapDestinations: number;
  overlapPercent: number;
  potentialOverlapPercent: number;
  potentialOverlapScore: number;
  potentialCityMatches: number;
  potentialCountryMatches: number;
  potentialRegionMatches: number;
  topOverlapAirports: MapPoint[];
};

export type UploadState = {
  fileName: string;
  status: "idle" | "ready" | "error";
  parsed?: ParsedCsvResult;
  error?: string;
};

export type AdminAirportInput = AirportReference;

export type SessionState = {
  authenticated: boolean;
  email?: string;
};
