import Papa from "papaparse";
import { z } from "zod";

import { REQUIRED_COLUMNS } from "@/lib/constants";
import { AirportReference, CsvRowInput, DatasetKind, NormalizedCsvRow, ParsedCsvResult, ValidationIssue } from "@/lib/types";

const rowSchema = z.object({
  iata: z.string().length(3, "IATA must be 3 characters"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  region: z.string().min(1, "Region is required"),
  volume: z.number().finite().nonnegative("Volume must be 0 or greater")
});

function normalizeHeaderKey(key: string) {
  const normalized = key.trim().toLowerCase();
  if (normalized === "iata") return "IATA";
  if (normalized === "city") return "city";
  if (normalized === "country") return "country";
  if (normalized === "region") return "region";
  if (normalized === "volume") return "volume";
  if (normalized === "latitude") return "latitude";
  if (normalized === "longitude") return "longitude";

  return key;
}

function normalizeRow(row: CsvRowInput) {
  const iata = String(row.IATA ?? row.iata ?? "")
    .trim()
    .toUpperCase();

  return {
    iata,
    city: String(row.city ?? "").trim(),
    country: String(row.country ?? "").trim(),
    region: String(row.region ?? "").trim(),
    volume: Number(row.volume)
  };
}

export function parseCsvText(args: {
  source: DatasetKind;
  text: string;
  fileName: string;
  airportMap: Map<string, AirportReference>;
}): ParsedCsvResult {
  const { source, text, fileName, airportMap } = args;

  const parsed = Papa.parse<CsvRowInput>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeaderKey,
    transform(value) {
      return typeof value === "string" ? value.trim() : value;
    }
  });

  const issues: ValidationIssue[] = [];
  const duplicateSafeMap = new Map<string, NormalizedCsvRow>();
  const seenCounts = new Map<string, number>();

  const headers = parsed.meta.fields ?? [];
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));

  if (missingColumns.length > 0) {
    return {
      fileName,
      source,
      normalizedRows: [],
      issues: [
        {
          rowNumber: 0,
          message: `Missing required columns: ${missingColumns.join(", ")}`
        }
      ],
      unknownIatas: [],
      rawRowCount: 0,
      validRowCount: 0,
      duplicateGroups: 0,
      duplicateRowsMerged: 0,
      matchedIatas: []
    };
  }

  parsed.data.forEach((row, index) => {
    const normalized = normalizeRow(row);
    const validation = rowSchema.safeParse(normalized);

    if (!validation.success) {
      issues.push({
        rowNumber: index + 2,
        message: validation.error.issues.map((issue) => issue.message).join(", ")
      });
      return;
    }

    seenCounts.set(normalized.iata, (seenCounts.get(normalized.iata) ?? 0) + 1);
    const existing = duplicateSafeMap.get(normalized.iata);
    if (existing) {
      duplicateSafeMap.set(normalized.iata, {
        ...existing,
        volume: existing.volume + normalized.volume
      });
      return;
    }

    duplicateSafeMap.set(normalized.iata, validation.data);
  });

  const normalizedRows = Array.from(duplicateSafeMap.values()).sort((a, b) => a.iata.localeCompare(b.iata));
  const unknownIatas = normalizedRows
    .filter((row) => !airportMap.has(row.iata))
    .map((row) => row.iata);
  const matchedIatas = normalizedRows.filter((row) => airportMap.has(row.iata)).map((row) => row.iata);
  const duplicateGroups = Array.from(seenCounts.values()).filter((count) => count > 1).length;
  const duplicateRowsMerged = Array.from(seenCounts.values()).reduce((total, count) => total + Math.max(0, count - 1), 0);

  return {
    fileName,
    source,
    normalizedRows,
    issues,
    unknownIatas,
    rawRowCount: parsed.data.length,
    validRowCount: normalizedRows.length + duplicateRowsMerged,
    duplicateGroups,
    duplicateRowsMerged,
    matchedIatas
  };
}

export function parseAirportCsvText(text: string) {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeaderKey,
    transform(value) {
      return typeof value === "string" ? value.trim() : value;
    }
  });

  const issues: ValidationIssue[] = [];
  const airportsByIata = new Map<string, AirportReference>();
  const headers = parsed.meta.fields ?? [];
  const requiredColumns = ["IATA", "city", "country", "region", "latitude", "longitude"];
  const missingColumns = requiredColumns.filter((column) => !headers.includes(column));

  if (missingColumns.length > 0) {
    return {
      airports: [],
      issues: [
        {
          rowNumber: 0,
          message: `Missing required airport columns: ${missingColumns.join(", ")}`
        }
      ]
    };
  }

  parsed.data.forEach((row, index) => {
    const iata = String(row.IATA ?? row.iata ?? "").trim().toUpperCase();
    const city = String(row.city ?? "").trim();
    const country = String(row.country ?? "").trim();
    const region = String(row.region ?? "").trim();
    const latitude = Number(row.latitude);
    const longitude = Number(row.longitude);

    if (!iata || iata.length !== 3 || !city || !country || !region || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      issues.push({
        rowNumber: index + 2,
        message: "Each airport row needs IATA, city, country, region, latitude, and longitude"
      });
      return;
    }

    airportsByIata.set(iata, {
      iata,
      city,
      country,
      region,
      latitude,
      longitude
    });
  });

  return { airports: Array.from(airportsByIata.values()).sort((a, b) => a.iata.localeCompare(b.iata)), issues };
}
