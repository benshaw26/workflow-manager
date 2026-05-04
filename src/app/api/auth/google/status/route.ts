import { NextRequest } from "next/server";
import { getGoogleConnection, getReceiptGoogleConnection } from "@/lib/google-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const purpose = new URL(request.url).searchParams.get("purpose");
  const conn = purpose === "receipt"
    ? getReceiptGoogleConnection(request)
    : getGoogleConnection(request);

  if (!conn) {
    return Response.json({ connected: false });
  }

  const expired = conn.expires_at < Date.now();
  return Response.json({
    connected:    true,
    expired,
    email:        conn.email,
    name:         conn.name,
    picture:      conn.picture,
    connected_at: conn.connected_at,
  });
}
