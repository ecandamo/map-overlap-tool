import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { airportBulkSchema } from "@/lib/server/airport-schema";
import { getAirportRepository } from "@/lib/server/airports";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = airportBulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid airport bulk upload" }, { status: 400 });
  }

  const repository = getAirportRepository();
  const count = await repository.bulkUpsert(parsed.data.airports);
  return NextResponse.json({ count });
}
