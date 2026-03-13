import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { airportReferenceSchema } from "@/lib/server/airport-schema";
import { getAirportRepository } from "@/lib/server/airports";

type Context = {
  params: Promise<{ iata: string }>;
};

export async function PUT(request: NextRequest, context: Context) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { iata } = await context.params;
  const body = await request.json();
  const parsed = airportReferenceSchema.safeParse({
    ...body,
    iata
  });
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid airport payload" }, { status: 400 });
  }

  const repository = getAirportRepository();
  const airport = await repository.upsert(parsed.data);

  return NextResponse.json({ airport });
}

export async function DELETE(_request: NextRequest, context: Context) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { iata } = await context.params;
  const repository = getAirportRepository();
  await repository.remove(iata.toUpperCase());
  return NextResponse.json({ success: true });
}
