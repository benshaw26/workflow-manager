import { NextRequest } from "next/server";

export interface GoogleConnection {
  access_token:  string;
  refresh_token: string | null;
  expires_at:    number;
  email:         string;
  name:          string;
  picture:       string;
  connected_at:  number;
}

export function getGoogleConnection(request: NextRequest): GoogleConnection | null {
  try {
    const raw = request.cookies.get("g_connection")?.value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw)) as GoogleConnection;
  } catch { return null; }
}

export function getReceiptGoogleConnection(request: NextRequest): GoogleConnection | null {
  try {
    const raw = request.cookies.get("g_receipt_connection")?.value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw)) as GoogleConnection;
  } catch { return null; }
}
