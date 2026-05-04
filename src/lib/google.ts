/**
 * Google API helpers — uses raw fetch against Google REST APIs.
 * No googleapis package required.
 *
 * All functions take an accessToken obtained from the httpOnly cookie
 * set during the OAuth flow (/api/auth/google/callback).
 */

const BASE = "https://www.googleapis.com";

async function gFetch(url: string, accessToken: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google API error ${res.status}: ${err}`);
  }
  return res.json();
}

/* ── Gmail ─────────────────────────────────────────────── */

/** Send an email via Gmail. Supports HTML (multipart/alternative). */
export async function gmailSend(
  accessToken: string,
  opts: { to: string; subject: string; body: string; html?: string; from?: string }
): Promise<string> {
  let mime: string;

  if (opts.html) {
    const boundary = `----=_Part_${Date.now()}`;
    mime = [
      `To: ${opts.to}`,
      opts.from ? `From: ${opts.from}` : null,
      `Subject: ${opts.subject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      opts.body,
      "",
      `--${boundary}`,
      "Content-Type: text/html; charset=utf-8",
      "",
      opts.html,
      "",
      `--${boundary}--`,
    ].filter((l) => l !== null).join("\r\n");
  } else {
    mime = [
      `To: ${opts.to}`,
      opts.from ? `From: ${opts.from}` : null,
      `Subject: ${opts.subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      opts.body,
    ].filter((l) => l !== null).join("\r\n");
  }

  const raw = Buffer.from(mime).toString("base64url");
  const res = await gFetch(
    `${BASE}/gmail/v1/users/me/messages/send`,
    accessToken,
    { method: "POST", body: JSON.stringify({ raw }) }
  ) as { id: string };
  return res.id;
}

/** Search Gmail messages by query string. Returns message stubs. */
export async function gmailSearch(
  accessToken: string,
  query: string,
  maxResults = 25
): Promise<{ id: string; threadId: string }[]> {
  const res = await gFetch(
    `${BASE}/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
    accessToken
  ) as { messages?: { id: string; threadId: string }[] };
  return res.messages ?? [];
}

/** Get a message's full content: subject, from, date, decoded body text and HTML. */
export async function gmailGetMessage(
  accessToken: string,
  messageId: string
): Promise<{ id: string; subject: string; from: string; date: string; bodyText: string; bodyHtml: string; snippet: string }> {
  const msg = await gFetch(
    `${BASE}/gmail/v1/users/me/messages/${messageId}?format=full`,
    accessToken
  ) as {
    id: string;
    snippet: string;
    payload: {
      headers: { name: string; value: string }[];
      body: { data?: string };
      parts?: { mimeType: string; body: { data?: string }; parts?: { mimeType: string; body: { data?: string } }[] }[];
    };
  };

  const headers = msg.payload?.headers ?? [];
  const subject = headers.find((h) => h.name === "Subject")?.value ?? "(no subject)";
  const from    = headers.find((h) => h.name === "From")?.value    ?? "";
  const date    = headers.find((h) => h.name === "Date")?.value    ?? "";

  type Part = { mimeType: string; body: { data?: string }; parts?: Part[] };

  function decodeData(data: string) {
    return Buffer.from(data, "base64url").toString("utf-8");
  }
  function extractText(parts: Part[]): string {
    for (const p of parts) {
      if (p.mimeType === "text/plain" && p.body?.data) return decodeData(p.body.data);
    }
    for (const p of parts) {
      if (p.mimeType === "text/html" && p.body?.data)
        return decodeData(p.body.data).replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
    }
    for (const p of parts) {
      if (p.parts) { const t = extractText(p.parts); if (t) return t; }
    }
    return "";
  }
  function extractHtml(parts: Part[]): string {
    for (const p of parts) {
      if (p.mimeType === "text/html" && p.body?.data) return decodeData(p.body.data);
    }
    for (const p of parts) {
      if (p.parts) { const h = extractHtml(p.parts); if (h) return h; }
    }
    return "";
  }

  let bodyText = "";
  let bodyHtml = "";
  if (msg.payload?.body?.data) {
    const decoded = decodeData(msg.payload.body.data);
    if (decoded.trimStart().startsWith("<")) {
      bodyHtml = decoded;
      bodyText = decoded.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
    } else {
      bodyText = decoded;
    }
  } else if (msg.payload?.parts) {
    bodyText = extractText(msg.payload.parts as Part[]);
    bodyHtml = extractHtml(msg.payload.parts as Part[]);
  }
  if (!bodyText) bodyText = msg.snippet ?? "";

  return { id: msg.id, subject, from, date, snippet: msg.snippet ?? "", bodyText, bodyHtml };
}

/** List recent emails from inbox. */
export async function gmailListInbox(
  accessToken: string,
  maxResults = 10
): Promise<{ id: string; snippet: string; subject: string; from: string }[]> {
  const list = await gFetch(
    `${BASE}/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=${maxResults}`,
    accessToken
  ) as { messages?: { id: string }[] };

  const messages = list.messages ?? [];

  return Promise.all(
    messages.map(async ({ id }) => {
      const msg = await gFetch(
        `${BASE}/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
        accessToken
      ) as { snippet: string; payload: { headers: { name: string; value: string }[] } };

      const headers = msg.payload?.headers ?? [];
      const subject = headers.find((h) => h.name === "Subject")?.value ?? "(no subject)";
      const from    = headers.find((h) => h.name === "From")?.value    ?? "";
      return { id, snippet: msg.snippet, subject, from };
    })
  );
}

/* ── Google Sheets ──────────────────────────────────────── */

/** Append rows to a Google Sheet. Creates the sheet if spreadsheetId is omitted (returns new ID). */
export async function sheetsAppendRows(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: (string | number)[][]
): Promise<void> {
  await gFetch(
    `${BASE}/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    accessToken,
    { method: "POST", body: JSON.stringify({ values }) }
  );
}

/** Create a new Google Sheet and return its ID + URL. */
export async function sheetsCreate(
  accessToken: string,
  title: string,
  headers: string[]
): Promise<{ spreadsheetId: string; url: string }> {
  const res = await gFetch(
    "https://sheets.googleapis.com/v4/spreadsheets",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        properties: { title },
        sheets: [
          {
            data: [{ rowData: [{ values: headers.map((v) => ({ userEnteredValue: { stringValue: v } })) }] }],
          },
        ],
      }),
    }
  ) as { spreadsheetId: string };

  return {
    spreadsheetId: res.spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${res.spreadsheetId}`,
  };
}

/** Write a single cell value. */
export async function sheetsWriteCell(
  accessToken: string,
  spreadsheetId: string,
  cell: string, // e.g. "I2"
  value: string,
): Promise<void> {
  await gFetch(
    `${BASE}/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(cell)}?valueInputOption=USER_ENTERED`,
    accessToken,
    { method: "PUT", body: JSON.stringify({ values: [[value]] }) },
  );
}

/** Read values from a sheet range. */
export async function sheetsRead(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<(string | number)[][]> {
  const res = await gFetch(
    `${BASE}/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    accessToken
  ) as { values?: (string | number)[][] };
  return res.values ?? [];
}

/* ── Google Drive ───────────────────────────────────────── */

/** Upload a text/markdown file to Drive. Returns file ID and web URL. */
export async function driveUploadFile(
  accessToken: string,
  name: string,
  content: string,
  mimeType = "text/plain"
): Promise<{ fileId: string; url: string }> {
  const meta = JSON.stringify({ name, mimeType });
  const boundary = "-------workflow_boundary";
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    meta,
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    "",
    content,
    `--${boundary}--`,
  ].join("\r\n");

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  const json = await res.json() as { id: string; webViewLink: string };
  return { fileId: json.id, url: json.webViewLink };
}

/** List recent files in Drive. */
export async function driveListFiles(
  accessToken: string,
  pageSize = 10
): Promise<{ id: string; name: string; mimeType: string; webViewLink: string }[]> {
  const res = await gFetch(
    `${BASE}/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,mimeType,webViewLink)&orderBy=modifiedTime desc`,
    accessToken
  ) as { files: { id: string; name: string; mimeType: string; webViewLink: string }[] };
  return res.files ?? [];
}

/* ── Google Calendar ────────────────────────────────────── */

/** Create a calendar event. Returns event ID and URL. */
export async function calendarCreateEvent(
  accessToken: string,
  opts: {
    summary:     string;
    description?: string;
    start:        string; // ISO 8601 datetime
    end:          string; // ISO 8601 datetime
    attendees?:   string[];
    timeZone?:    string;
  }
): Promise<{ eventId: string; url: string }> {
  const tz = opts.timeZone ?? "Europe/London";
  const res = await gFetch(
    `${BASE}/calendar/v3/calendars/primary/events`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        summary:     opts.summary,
        description: opts.description ?? "",
        start:       { dateTime: opts.start, timeZone: tz },
        end:         { dateTime: opts.end,   timeZone: tz },
        attendees:   opts.attendees?.map((email) => ({ email })) ?? [],
      }),
    }
  ) as { id: string; htmlLink: string };
  return { eventId: res.id, url: res.htmlLink };
}

/* ── Google Docs ────────────────────────────────────────── */

/** Create a Google Doc from markdown-style text. Returns doc ID and URL. */
export async function docsCreate(
  accessToken: string,
  title: string,
  content: string
): Promise<{ docId: string; url: string }> {
  // Create blank doc first
  const doc = await gFetch(
    "https://docs.googleapis.com/v1/documents",
    accessToken,
    { method: "POST", body: JSON.stringify({ title }) }
  ) as { documentId: string };

  // Insert content
  await gFetch(
    `https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content,
            },
          },
        ],
      }),
    }
  );

  return {
    docId: doc.documentId,
    url: `https://docs.google.com/document/d/${doc.documentId}`,
  };
}
