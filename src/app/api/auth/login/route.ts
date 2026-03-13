import { NextRequest, NextResponse } from "next/server";

import { authenticateAdmin, setAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email ?? "";
  const password = body.password ?? "";
  const admin = await authenticateAdmin(email, password);

  if (!admin) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  await setAdminSession(admin.email);
  return NextResponse.json({ authenticated: true, email: admin.email });
}
