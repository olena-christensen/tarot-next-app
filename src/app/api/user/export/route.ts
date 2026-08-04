import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * "Download my data" — GDPR Art. 15 (access) and Art. 20 (portability).
 *
 * The Privacy Policy already promised this and the contact form already routed
 * DSAR requests to `privacy@`; what was missing was any way to actually produce
 * the data, which meant hand-querying five tables under a one-month deadline.
 *
 * Self-service is not legally required — this exists because doing it by hand
 * once is more expensive than building it, and because the deadline lands at
 * whatever moment the request happens to arrive.
 *
 * **Secrets are deliberately excluded.** The password hash, the Mono card token
 * and the OAuth provider tokens are not "their data" in any useful sense; they
 * are credentials, and putting them in a file that lands in a downloads folder
 * (or an email, if forwarded) would be handing out a key. Anything omitted is
 * listed in `_omitted` so the file is honest about not being the whole row.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, readings, subscription, payments, accounts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        termsAcceptedAt: true,
        preferredDeck: true,
        preferredReader: true,
        preferredLocale: true,
        dailyCardEmail: true,
        readingReminder: true,
      },
    }),
    prisma.reading.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        cards: true,
        response: true,
        title: true,
        note: true,
        isFavorite: true,
        readerId: true,
        deckId: true,
        shareId: true,
        createdAt: true,
      },
    }),
    prisma.subscription.findUnique({
      where: { userId },
      select: {
        planId: true,
        expiresAt: true,
        autoRenew: true,
        readingCredits: true,
        paymentStatus: true,
        nextChargeAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        monoInvoiceId: true,
        productType: true,
        amount: true,
        currency: true,
        status: true,
        maskedPan: true,
        paymentSystem: true,
        failureReason: true,
        createdAt: true,
      },
    }),
    // Which providers are linked, not the tokens that let anyone use them.
    prisma.account.findMany({
      where: { userId },
      select: { provider: true, type: true },
    }),
  ]);

  if (!user) {
    // The JWT outlived the row. The session route evicts these within
    // USER_VERIFY_INTERVAL_MS; nothing to export in the meantime.
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    service: "The Veil (theveil.app)",
    account: user,
    readings,
    subscription,
    payments,
    linkedSignIns: accounts,
    _omitted: [
      "password hash — a credential, not personal data",
      "saved card token — a credential; the masked card number is included instead",
      "OAuth access/refresh tokens — credentials belonging to the provider",
      "session records — transient, and revoked by signing out",
    ],
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Structured, commonly used and machine-readable, as Art. 20 puts it —
      // and downloaded rather than rendered, so it doesn't sit in the page.
      "Content-Disposition": `attachment; filename="theveil-data-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
