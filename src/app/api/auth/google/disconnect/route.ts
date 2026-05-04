import { NextRequest } from "next/server";
import { getGoogleConnection, getReceiptGoogleConnection } from "@/lib/google-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const purpose    = new URL(request.url).searchParams.get("purpose");
  const isReceipt  = purpose === "receipt";
  const cookieName = isReceipt ? "g_receipt_connection" : "g_connection";
  const conn       = isReceipt ? getReceiptGoogleConnection(request) : getGoogleConnection(request);

  if (conn?.access_token) {
    try {
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${conn.access_token}`,
        { method: "POST" }
      );
    } catch { /* ignore revocation errors */ }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie":   `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    },
  });
}
