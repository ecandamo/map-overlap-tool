import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { airportReferenceSchema } from "@/lib/server/airport-schema";
import { getAirportRepository } from "@/lib/server/airports";

export async function GET(request: NextRequest) {
  const repository = getAirportRepository();
  const airports = await repository.getAll();
  const iata = request.nextUrl.searchParams.get("iata")?.trim().toUpperCase();

  if (iata) {
    const airport = airports.find((entry) => entry.iata === iata) ?? null;
    return NextResponse.json({ airport });
  }

  return NextResponse.json({ airports });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = airportReferenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid airport payload" }, { status: 400 });
  }

  const repository = getAirportRepository();
  const airport = await repository.upsert(parsed.data);

  return NextResponse.json({ airport });
}
