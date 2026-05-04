import { NextRequest } from "next/server";

export const runtime = "nodejs";

interface TokenResponse {
  access_token:  string;
  refresh_token?: string;
  expires_in:    number;
  token_type:    string;
  error?:        string;
}

interface UserInfo {
  email:   string;
  name:    string;
  picture: string;
  sub:     string;
}

function getCredentials(request: NextRequest): { clientId: string; clientSecret: string; purpose: string } | null {
  try {
    const raw = request.cookies.get("g_credentials")?.value;
    if (raw) {
      const parsed = JSON.parse(decodeURIComponent(raw)) as { clientId: string; clientSecret: string; purpose?: string };
      if (parsed.clientId && parsed.clientSecret) return { ...parsed, purpose: parsed.purpose ?? "main" };
    }
  } catch { /* ignore */ }

  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (clientId && clientSecret) return { clientId, clientSecret, purpose: "main" };

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  const stateParam = searchParams.get("state") ?? "";
  const purpose    = stateParam.includes(":") ? stateParam.split(":")[1] : "main";
  const isReceipt  = purpose === "receipt";

  const errorRedirect = isReceipt
    ? `${appUrl}/receipt-forwarder?receipt_error=${encodeURIComponent(error ?? "auth_cancelled")}`
    : `${appUrl}/integrations?error=${encodeURIComponent(error ?? "auth_cancelled")}`;

  if (error || !code) {
    return Response.redirect(errorRedirect);
  }

  const creds = getCredentials(request);
  if (!creds) {
    return Response.redirect(
      isReceipt
        ? `${appUrl}/receipt-forwarder?receipt_error=credentials_not_found`
        : `${appUrl}/integrations?error=credentials_not_found`
    );
  }

  // Exchange code for tokens
  let tokens: TokenResponse;
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    new URLSearchParams({
        code,
        client_id:     creds.clientId,
        client_secret: creds.clientSecret,
        redirect_uri:  redirectUri,
        grant_type:    "authorization_code",
      }),
    });
    tokens = await res.json() as TokenResponse;
    if (tokens.error) throw new Error(tokens.error);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "token_exchange_failed";
    return Response.redirect(
      isReceipt
        ? `${appUrl}/receipt-forwarder?receipt_error=${encodeURIComponent(msg)}`
        : `${appUrl}/integrations?error=${encodeURIComponent(msg)}`
    );
  }

  // Get user profile
  let user: UserInfo;
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    user = await res.json() as UserInfo;
  } catch {
    return Response.redirect(
      isReceipt
        ? `${appUrl}/receipt-forwarder?receipt_error=profile_fetch_failed`
        : `${appUrl}/integrations?error=profile_fetch_failed`
    );
  }

  // Store connection in long-lived httpOnly cookie
  const cookieValue = encodeURIComponent(JSON.stringify({
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at:    Date.now() + (tokens.expires_in * 1000),
    email:         user.email,
    name:          user.name,
    picture:       user.picture,
    connected_at:  Date.now(),
  }));

  const cookieName     = isReceipt ? "g_receipt_connection" : "g_connection";
  const successRedirect = isReceipt
    ? `${appUrl}/receipt-forwarder?receipt_connected=1`
    : `${appUrl}/integrations?connected=google`;

  const headers = new Headers();
  headers.append("Set-Cookie", `${cookieName}=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`);
  headers.append("Set-Cookie", "g_credentials=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  headers.append("Location", successRedirect);

  return new Response(null, { status: 302, headers });
}
