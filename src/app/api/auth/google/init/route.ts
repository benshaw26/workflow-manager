import { NextRequest } from "next/server";

export const runtime = "nodejs";

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/documents",
].join(" ");

export async function POST(request: NextRequest) {
  const body = await request.json() as { clientId?: string; clientSecret?: string; purpose?: string };
  const clientId     = body.clientId     ?? process.env.GOOGLE_CLIENT_ID;
  const clientSecret = body.clientSecret ?? process.env.GOOGLE_CLIENT_SECRET;
  const purpose      = body.purpose ?? "main";

  if (!clientId || !clientSecret) {
    return Response.json(
      { error: "Google Client ID and Client Secret are required. Add them in API Keys settings." },
      { status: 400 }
    );
  }

  const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: "code",
    scope:         SCOPES,
    access_type:   "offline",
    prompt:        purpose === "receipt" ? "select_account consent" : "consent",
    state:         `google-oauth:${purpose}`,
  });

  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  // Store credentials + purpose in a short-lived httpOnly cookie so the callback can use them
  const credsCookie = encodeURIComponent(JSON.stringify({ clientId, clientSecret, purpose }));

  return new Response(JSON.stringify({ url: oauthUrl }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie":   `g_credentials=${credsCookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=300`,
    },
  });
}
