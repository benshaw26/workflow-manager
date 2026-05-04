/**
 * Twilio helpers — WhatsApp messaging via the Twilio Messaging API.
 */

export interface WhatsAppOpts {
  accountSid: string;
  authToken:  string;
  from:       string; // e.g. "whatsapp:+14155238886" (sandbox) or your business number
  to:         string; // e.g. "whatsapp:+447911123456"
  body:       string;
}

/** Send a WhatsApp message via Twilio. Returns the message SID. */
export async function sendWhatsApp(opts: WhatsAppOpts): Promise<string> {
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${opts.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${opts.accountSid}:${opts.authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: opts.from.startsWith("whatsapp:") ? opts.from : `whatsapp:${opts.from}`,
        To:   opts.to.startsWith("whatsapp:")   ? opts.to   : `whatsapp:${opts.to}`,
        Body: opts.body,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio error ${res.status}: ${err}`);
  }

  const json = await res.json() as { sid: string };
  return json.sid;
}

/** Extract a clean receipt summary for a WhatsApp message from receipt text. */
export function buildReceiptWhatsAppMessage(opts: {
  subject:  string;
  content:  string;
  date:     string;
  from:     string;
}): string {
  const { subject, content, date } = opts;

  // Extract total amount — looks for patterns like £28.95 or $28.95
  const amountMatch = content.match(/Total[:\s]+([£$€]\d+(?:\.\d{2})?)/i)
    ?? content.match(/([£$€]\d+(?:\.\d{2})?)/);
  const amount = amountMatch?.[1] ?? "";

  // Extract pickup / dropoff lines (lines after a time pattern like "21:37")
  const locationLines: string[] = [];
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    if (/^\d{1,2}:\d{2}$/.test(lines[i]) && lines[i + 1]) {
      locationLines.push(lines[i + 1]);
    }
  }
  const tripLine = locationLines.length >= 2
    ? `${locationLines[0]} → ${locationLines[1]}`
    : "";

  const parts = [
    `🚗 *Uber Receipt*`,
    subject ? `*${subject}*` : "",
    amount  ? `💷 *${amount}*` : "",
    date    ? `📅 ${date}` : "",
    tripLine ? `📍 ${tripLine}` : "",
  ].filter(Boolean);

  return parts.join("\n");
}
