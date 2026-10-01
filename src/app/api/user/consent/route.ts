import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Terms + 18+ consent for accounts that never saw the sign-up checkboxes — in
// practice a Google newcomer who came in through the "Sign in" tab (the sign-up
// tab's consent cookie only exists when the boxes were ticked). The profile
// shows WelcomeConsent while termsAcceptedAt is null.
//
// Only termsAcceptedAt is persisted: age has no column (same as the password
// sign-up, which checks it and does not store it — a column needs a migration).

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { termsAcceptedAt: true },
  });
  return NextResponse.json({ termsAccepted: Boolean(user?.termsAcceptedAt) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { terms?: unknown; age?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (body.terms !== true) {
    return NextResponse.json({ error: "terms_required" }, { status: 400 });
  }
  if (body.age !== true) {
    return NextResponse.json({ error: "age_required" }, { status: 400 });
  }

  // Never overwrite an earlier acceptance date.
  await prisma.user.updateMany({
    where: { id: session.user.id, termsAcceptedAt: null },
    data: { termsAcceptedAt: new Date() },
  });
  return NextResponse.json({ termsAccepted: true });
}
