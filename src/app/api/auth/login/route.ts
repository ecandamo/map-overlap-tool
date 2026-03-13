import { NextRequest, NextResponse } from "next/server";

import { getConfiguredAdmin, setAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { email?: string; password?: string };
  const admin = getConfiguredAdmin();

  if (body.email !== admin.email || body.password !== admin.password) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  await setAdminSession(admin.email);
  return NextResponse.json({ authenticated: true, email: admin.email });
}
