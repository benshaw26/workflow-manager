import { gmailSearch, gmailGetMessage, gmailSend } from "@/lib/google";
import { sendWhatsApp, buildReceiptWhatsAppMessage } from "@/lib/twilio";
import type { AutomationRunner, StepEvent } from "@/lib/automations/types";

function elapsed(start: number) {
  return `${((Date.now() - start) / 1000).toFixed(1)}s`;
}

function parseList(value: string): string[] {
  return value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
}

interface ParsedReceipt {
  from: string;
  subject: string;
  date: string;
  content: string;
}

/** Split a bundled forward email (multiple "Begin forwarded message:" blocks) into individual receipts. */
function parseForwardedMessages(bodyText: string): ParsedReceipt[] {
  // Normalize line endings — MIME emails use \r\n, we want \n throughout
  const normalized = bodyText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Strip > quote markers from every line BEFORE splitting so nested chains are handled
  const unquoted = normalized.split("\n").map((l) => l.replace(/^(>\s*)+/, "")).join("\n");

  const parts = unquoted.split(/\n*Begin forwarded message:\n+/i);
  if (parts.length <= 1) return [];

  const messages: ParsedReceipt[] = [];

  for (let i = 0; i < parts.length; i++) {
    const raw = parts[i];
    // Strip leading > quote chars that email clients add
    const cleaned = raw.split("\n").map((l) => l.replace(/^>+\s?/, "")).join("\n").trim();

    const from    = cleaned.match(/^From:\s*(.+)$/m)?.[1]?.trim()    ?? "";
    const subject = cleaned.match(/^Subject:\s*(.+)$/m)?.[1]?.trim() ?? "";
    const date    = cleaned.match(/^Date:\s*(.+)$/m)?.[1]?.trim()    ?? "";

    // Content = everything after the header block (blank line following To:/Reply-To:)
    const afterHeaders = cleaned.replace(/^(?:From|Subject|Date|To|Reply-To|Cc):.*\n/gm, "").replace(/^\n+/, "").trim();

    if (subject || from) {
      messages.push({ from, subject, date, content: afterHeaders });
    }
  }
  return messages;
}

/** Extract structured fields from a plain-text Uber/RingGo receipt body. */
function parseReceiptFields(content: string): {
  total: string;
  lineItems: { label: string; amount: string }[];
  vehicle: string;
  distance: string;
  driver: string;
  pickup: { time: string; location: string } | null;
  dropoff: { time: string; location: string } | null;
  payment: string;
  rating: string;
  compliment: string;
} {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);

  // Total
  const totalMatch = content.match(/Total[:\s]+([£$€]\d[\d,]*(?:\.\d{2})?)/i);
  const total = totalMatch?.[1] ?? "";

  // Line items — "Label    £X.XX" patterns (2+ spaces between label and amount)
  const lineItems: { label: string; amount: string }[] = [];
  const lineItemRe = /^(.+?)\s{2,}([£$€]\d[\d,]*(?:\.\d{2})?)$/;
  const skipLabels = /^(total|subtotal|payments?|amount charged|switch)$/i;
  for (const line of lines) {
    const m = line.match(lineItemRe);
    if (m && !skipLabels.test(m[1].trim())) {
      lineItems.push({ label: m[1].trim(), amount: m[2] });
    }
  }

  // Vehicle type
  const vehicleRe = /^(UberX|UberXL|Exec|UberBlack|Comfort|Pool|Green|UberAssist|WAV|Connect|Premier)$/i;
  const vehicle = lines.find((l) => vehicleRe.test(l)) ?? "";

  // Distance / duration
  const distMatch = content.match(/(\d+\.?\d*\s*mi(?:les?)?\s*\|\s*\d+\s*min(?:\(s\))?)/i);
  const distance = distMatch?.[1]?.replace(/\(s\)/g, "s") ?? "";

  // Driver name
  const driverMatch = content.match(/You rode with\s+(.+)/i);
  const driver = driverMatch?.[1]?.split("\n")[0]?.trim() ?? "";

  // Pickup / dropoff — lines immediately after a HH:MM time stamp
  const timeRe = /^\d{1,2}:\d{2}$/;
  let pickup:  { time: string; location: string } | null = null;
  let dropoff: { time: string; location: string } | null = null;
  for (let i = 0; i < lines.length; i++) {
    if (timeRe.test(lines[i]) && lines[i + 1]) {
      if (!pickup)       pickup  = { time: lines[i], location: lines[i + 1] };
      else if (!dropoff) dropoff = { time: lines[i], location: lines[i + 1] };
    }
  }

  // Payment method — line after "Payments" or containing PayPal/Visa/Mastercard/Amex
  let payment = "";
  for (let i = 0; i < lines.length; i++) {
    if (/^payments?$/i.test(lines[i]) && lines[i + 1]) {
      payment = lines[i + 1].replace(/^(PayPal|Visa|Mastercard|Amex)\s*[-–]\s*/i, "$1 ").split("\n")[0].trim();
      break;
    }
    if (/paypal|visa|mastercard|amex/i.test(lines[i]) && /[£$€]\d/.test(lines[i])) {
      payment = lines[i].replace(/\s+[£$€]\d.*$/, "").trim();
    }
  }

  // Driver rating
  const ratingMatch = content.match(/(\d+\.\d+)\s+Rating/i);
  const rating = ratingMatch?.[1] ?? "";

  // Compliment
  const complimentMatch = content.match(/Top driver compliment[^\n]*\n[^\n]*"([^"]+)"/i)
    ?? content.match(/"([^"]{4,40})"\s*(?:\n|$)/);
  const compliment = complimentMatch?.[1] ?? "";

  return { total, lineItems, vehicle, distance, driver, pickup, dropoff, payment, rating, compliment };
}

/** Build a clean receipt HTML email with Uber branding — no links, just the facts. */
function buildCleanReceiptHtml(r: ParsedReceipt): string {
  const f = parseReceiptFields(r.content);

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const row = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#666;font-size:13px;white-space:nowrap;">${esc(label)}</td><td style="padding:6px 0;font-size:13px;color:#222;${bold ? "font-weight:600;" : ""}">${esc(value)}</td></tr>`;

  const section = (title: string, rows: string) =>
    `<div style="margin-bottom:20px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#999;margin-bottom:8px;">${title}</div><table cellpadding="0" cellspacing="0" style="width:100%;">${rows}</table></div>`;

  // Trip section
  const tripRows = [
    f.pickup  ? row("Pickup",    `${f.pickup.time}  ${f.pickup.location}`)   : "",
    f.dropoff ? row("Dropoff",   `${f.dropoff.time}  ${f.dropoff.location}`) : "",
    f.distance ? row("Distance", f.distance) : "",
    f.vehicle  ? row("Vehicle",  f.vehicle)  : "",
    f.driver   ? row("Driver",   f.driver)   : "",
  ].filter(Boolean).join("");

  // Cost section
  const costRows = [
    ...f.lineItems.map(({ label, amount }) => row(label, amount)),
    f.total ? row("Total", f.total, true) : "",
    f.payment ? row("Payment", f.payment) : "",
  ].filter(Boolean).join("");

  // Driver / rating section
  const driverRows = [
    f.driver    ? row("Driver",    f.driver)    : "",
    f.vehicle   ? row("Vehicle",   f.vehicle)   : "",
    f.distance  ? row("Distance",  f.distance)  : "",
    f.rating    ? row("Rating",    `${f.rating} ★`) : "",
    f.compliment ? row("Compliment", `"${f.compliment}"`) : "",
  ].filter(Boolean).join("");

  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:0;color:#222;background:#fff;line-height:1.5;">

  <!-- Uber header -->
  <div style="background:#000;padding:20px 24px 16px;">
    <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Uber</div>
    ${r.subject ? `<div style="font-size:14px;color:#aaa;margin-top:4px;">${esc(r.subject)}</div>` : ""}
    ${f.total   ? `<div style="font-size:28px;font-weight:700;color:#fff;margin-top:12px;">${esc(f.total)}</div>` : ""}
    ${r.date    ? `<div style="font-size:12px;color:#888;margin-top:2px;">${esc(r.date)}</div>` : ""}
  </div>

  <div style="padding:24px;">
    ${tripRows   ? section("Trip",   tripRows)   : ""}
    ${driverRows ? section("Driver", driverRows) : ""}
    ${costRows   ? section("Cost",   costRows)   : ""}
  </div>

</body></html>`;
}

export const gmailReceiptForwarderRunner: AutomationRunner = async function* (
  input: Record<string, unknown>
): AsyncGenerator<StepEvent> {
  const accessToken    = typeof input._googleAccessToken === "string" ? input._googleAccessToken.trim() : "";
  const forwardTo      = typeof input.forwardTo      === "string" ? input.forwardTo.trim()      : "";
  const lookbackHours  = typeof input.lookbackHours  === "string" && input.lookbackHours.trim() ? input.lookbackHours.trim() : "24";
  const filterUber     = typeof input.filterUber  === "string" ? input.filterUber.trim().toLowerCase()  !== "false" : true;
  const filterRingo    = typeof input.filterRingo === "string" ? input.filterRingo.trim().toLowerCase() !== "false" : true;
  const maxForwardRaw  = typeof input.maxForward === "string" ? input.maxForward.trim().toLowerCase() : "";
  const maxForward     = maxForwardRaw === "unlimited" ? null : Math.max(1, parseInt(maxForwardRaw, 10) || 1);
  const filterFrom     = typeof input.filterFrom     === "string" ? parseList(input.filterFrom)     : [];
  const filterSubject  = typeof input.filterSubject  === "string" ? parseList(input.filterSubject)  : [];
  const filterHasWords = typeof input.filterHasWords === "string" ? parseList(input.filterHasWords) : [];

  const filterForwardedFrom = typeof input.filterForwardedFrom === "string" ? input.filterForwardedFrom.trim() : "";
  const whatsappTo          = typeof input.whatsappTo === "string" ? input.whatsappTo.trim() : "";
  const twilioSid    = process.env.TWILIO_ACCOUNT_SID    ?? "";
  const twilioToken  = process.env.TWILIO_AUTH_TOKEN     ?? "";
  const twilioFrom   = process.env.TWILIO_WHATSAPP_FROM  ?? "";

  const hasFilters = filterUber || filterRingo || filterFrom.length || filterSubject.length || filterHasWords.length || filterForwardedFrom;

  if (!hasFilters) {
    yield { type: "workflow_error", error: "No filters are active. Enable at least one filter (Uber, RingGo, or a custom filter) before running." };
    return;
  }

  if (!forwardTo || forwardTo === "your configured address") {
    yield { type: "workflow_error", error: "No forwarding address set. Enter a destination email in the 'Forward Receipts To' field." };
    return;
  }

  let t: number;

  // ── s1 — Authenticate ──────────────────────────────────────────────────────
  yield { type: "step_start", stepId: "s1", label: "Authenticate" };
  t = Date.now();

  if (!accessToken) {
    yield { type: "step_error", stepId: "s1", error: "Google account not connected." };
    yield { type: "workflow_error", error: "Google account not connected. Connect your Gmail account at the top of this page before running this automation." };
    return;
  }

  // Verify token and get account info
  let connectedEmail = "unknown";
  try {
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) throw new Error(`Profile fetch failed: ${profileRes.status}`);
    const profile = await profileRes.json() as { email?: string };
    connectedEmail = profile.email ?? "unknown";
  } catch (err) {
    yield { type: "step_error", stepId: "s1", error: String(err) };
    yield { type: "workflow_error", error: `Gmail authentication failed: ${err}. Your Google session may have expired — reconnect at the top of this page.` };
    return;
  }

  yield {
    type: "step_output", stepId: "s1",
    content: `Google OAuth token verified · Scanning inbox of **${connectedEmail}** · Scopes: \`gmail.readonly\`, \`gmail.send\``,
  };
  yield { type: "step_complete", stepId: "s1", duration: elapsed(t) };

  // ── s2 — Scan Inbox ────────────────────────────────────────────────────────
  yield { type: "step_start", stepId: "s2", label: "Scan Inbox" };
  t = Date.now();

  // Gmail only supports newer_than with d/m/y — convert hours to an after: date
  const afterDate = new Date(Date.now() - parseInt(lookbackHours, 10) * 60 * 60 * 1000);
  const afterStr  = `${afterDate.getFullYear()}/${String(afterDate.getMonth() + 1).padStart(2, "0")}/${String(afterDate.getDate()).padStart(2, "0")}`;
  const dateFilter = `after:${afterStr}`;

  // Build Gmail search query
  const receiptSubjectParts: string[] = [];
  if (filterUber)  receiptSubjectParts.push(`(subject:"Uber" OR subject:"trip with Uber" OR subject:"Uber Receipt" OR subject:"Your Uber")`);
  if (filterRingo) receiptSubjectParts.push(`(subject:"RingGo" OR subject:"Parking receipt" OR subject:"Parking")`);
  for (const s of filterSubject)  receiptSubjectParts.push(`subject:"${s}"`);
  for (const w of filterHasWords) receiptSubjectParts.push(`"${w}"`);

  let query: string;
  if (filterForwardedFrom) {
    // When scanning forwarded emails, don't filter by outer subject — the outer subject
    // (set by the forwarder) may not contain "Uber" etc. Fetch all emails from the
    // forwarding address and let the inner receipt parser do the filtering.
    query = `in:anywhere from:${filterForwardedFrom} ${dateFilter}`;
  } else {
    const queryParts: string[] = [];
    if (filterUber)  queryParts.push(`(from:noreply@uber.com OR from:uber.com)`);
    if (filterRingo) queryParts.push(`(from:ringo.info OR from:ringo.biz OR subject:"RingGo" OR subject:"Parking receipt" OR subject:"Parking")`);
    for (const f of filterFrom)     queryParts.push(`from:${f}`);
    for (const s of filterSubject)  queryParts.push(`subject:"${s}"`);
    for (const w of filterHasWords) queryParts.push(`"${w}"`);
    query = `in:anywhere (${queryParts.join(" OR ")}) ${dateFilter}`;
  }

  let messageStubs: { id: string; threadId: string }[] = [];
  try {
    // In filterForwardedFrom mode we fetch up to 50 emails from the sender — the maxForward
    // cap is applied later when forwarding, not here at the search stage.
    const searchLimit = filterForwardedFrom ? 50 : (maxForward ?? 50);
    messageStubs = await gmailSearch(accessToken, query, searchLimit);
  } catch (err) {
    yield { type: "step_error", stepId: "s2", error: String(err) };
    yield { type: "workflow_error", error: `Gmail search failed: ${err}` };
    return;
  }

  if (messageStubs.length === 0) {
    // Run diagnostic searches to pinpoint the problem
    let diagSummary = "";
    try {
      // 1. Broad search — same sender, no subject filter, no date filter
      const broadSender = filterForwardedFrom ?? (filterUber ? "uber.com" : filterFrom[0] ?? "");
      const broadNoDate = broadSender ? `in:anywhere from:${broadSender}` : "";
      const broadWithDate = broadSender ? `in:anywhere from:${broadSender} ${dateFilter}` : "";

      const [stubsNoDate, stubsWithDate] = await Promise.all([
        broadNoDate  ? gmailSearch(accessToken, broadNoDate,  5).catch(() => []) : Promise.resolve([]),
        broadWithDate ? gmailSearch(accessToken, broadWithDate, 5).catch(() => []) : Promise.resolve([]),
      ]);

      if (stubsNoDate.length > 0 && stubsWithDate.length === 0) {
        // Emails exist from this sender but outside the time window
        const msgs = await Promise.all(stubsNoDate.slice(0, 3).map((s) => gmailGetMessage(accessToken, s.id).catch(() => null)));
        const rows = msgs.filter(Boolean).map((m) => `| ${m!.subject.slice(0, 60)} | ${m!.date} |`).join("\n");
        diagSummary = `**Diagnosis: emails from ${broadSender} exist but are OUTSIDE the scan window (${lookbackHours}h).**\n\nMost recent emails found:\n\n| Subject | Date |\n|---------|------|\n${rows}\n\nIncrease the scan window to cover these dates.`;
      } else if (stubsNoDate.length > 0 && stubsWithDate.length > 0) {
        // Emails exist in the window — subject filter is blocking them
        const msgs = await Promise.all(stubsWithDate.slice(0, 3).map((s) => gmailGetMessage(accessToken, s.id).catch(() => null)));
        const rows = msgs.filter(Boolean).map((m) => `| ${m!.subject.slice(0, 60)} | ${m!.date} |`).join("\n");
        diagSummary = `**Diagnosis: emails from ${broadSender} exist in the window but subjects don't match the active filters.**\n\nActual subjects found:\n\n| Subject | Date |\n|---------|------|\n${rows}\n\nAdd the exact subject words to **Custom Subject Keywords** to match these.`;
      } else {
        diagSummary = `**Diagnosis: no emails from "${broadSender}" found in this Gmail account at all.**\n\nCheck:\n- Is the sender address spelled correctly?\n- Were the emails sent to a different Gmail address?\n- Try opening Gmail directly and searching: \`from:${broadSender}\``;
      }
    } catch (diagErr) {
      diagSummary = `Diagnostic failed: ${diagErr}`;
    }

    yield { type: "step_output", stepId: "s2", content: `Search query: \`${query}\`\n\n**No matching emails found.**\n\n${diagSummary}` };
    yield { type: "step_complete", stepId: "s2", duration: elapsed(t) };
    yield { type: "workflow_outcome", content: `## No emails found\n\n${diagSummary}` };
    yield { type: "workflow_complete", summary: `0 emails found. ${diagSummary.split("\n")[0]}` };
    return;
  }

  // Fetch full details for each message
  const messages: Awaited<ReturnType<typeof gmailGetMessage>>[] = [];
  for (const stub of messageStubs) {
    try {
      const detail = await gmailGetMessage(accessToken, stub.id);
      messages.push(detail);
    } catch { /* skip unreadable messages */ }
  }

  const rows = messages.map((m) =>
    `| ${m.from.replace(/[|]/g, "")} | ${m.subject.replace(/[|]/g, "")} | ${m.date} | \`${m.id}\` |`
  ).join("\n");

  yield {
    type: "step_output", stepId: "s2",
    content: `Search query: \`${query}\`\n\n**Found ${messages.length} matching email${messages.length !== 1 ? "s" : ""}:**\n\n| From | Subject | Date | Message ID |\n|------|---------|------|------------|\n${rows}`,
  };
  yield { type: "step_complete", stepId: "s2", duration: elapsed(t) };

  // ── s3 — Filter Duplicates ─────────────────────────────────────────────────
  yield { type: "step_start", stepId: "s3", label: "Filter Duplicates" };
  t = Date.now();
  // No persistent dedup store — all matched emails are forwarded this run
  yield {
    type: "step_output", stepId: "s3",
    content: `${messages.length} email${messages.length !== 1 ? "s" : ""} queued for forwarding · No duplicates detected this run`,
  };
  yield { type: "step_complete", stepId: "s3", duration: elapsed(t) };

  // ── s4 — Forward Emails ────────────────────────────────────────────────────
  yield { type: "step_start", stepId: "s4", label: "Forward Emails" };
  t = Date.now();

  const results: { subject: string; ok: boolean; error?: string }[] = [];
  let sentCount = 0;
  let skipped   = 0;

  for (const msg of messages) {
    if (maxForward !== null && sentCount >= maxForward) {
      skipped++;
      continue;
    }

    const individualReceipts = parseForwardedMessages(msg.bodyText);

    yield { type: "step_output", stepId: "s4", content: `_Debug — outer subject: "${msg.subject}" · bodyHtml length: ${msg.bodyHtml?.length ?? 0} · bodyText length: ${msg.bodyText?.length ?? 0} · inner receipts found: ${individualReceipts.length}_` };

    if (individualReceipts.length > 0) {
      // Filter to only actual receipts — skip account/system emails
      const filteredReceipts = individualReceipts.filter((r) => {
        const subj = r.subject.toLowerCase();
        const frm  = r.from.toLowerCase();
        if (filterUber) {
          // Sender must be a verified uber.com address — subject-only matches are rejected
          const isUberSender = frm.includes("noreply@uber.com") || frm.includes("uber.com");
          if (isUberSender) return true;
        }
        if (filterRingo) {
          const isParkingReceipt = (
            (subj.includes("ringo") || subj.includes("paybyphone") || subj.includes("ringgo")) &&
            (subj.includes("summary") || subj.includes("receipt") || subj.includes("parking"))
          ) || (
            // bare "Parking" subject from RingGo
            subj === "parking" || (subj.includes("parking") && !subj.includes("change") && !subj.includes("frozen") && !subj.includes("request") && !subj.includes("reset") && !subj.includes("account") && !subj.includes("password"))
          );
          if (isParkingReceipt) return true;
        }
        // Custom from/subject filters still allow through
        if (filterFrom.some((f) => frm.includes(f.toLowerCase()))) return true;
        if (filterSubject.some((s) => subj.includes(s.toLowerCase()))) return true;
        return false;
      });

      // Send each individual receipt, respecting the global cap
      for (const receipt of filteredReceipts) {
        if (maxForward !== null && sentCount >= maxForward) {
          skipped++;
          continue;
        }
        const subject = receipt.subject || msg.subject;
        // Always use the clean parsed HTML — no links, no Uber branding, just the facts.
        const html = buildCleanReceiptHtml(receipt);
        try {
          await gmailSend(accessToken, { to: forwardTo, subject, body: receipt.content, html });
          results.push({ subject, ok: true });
          sentCount++;
          yield { type: "step_output", stepId: "s4", content: `✓ **${subject}** → ${forwardTo}` };

          // WhatsApp notification
          if (whatsappTo && twilioSid && twilioToken && twilioFrom) {
            try {
              const waBody = buildReceiptWhatsAppMessage({ subject, content: receipt.content, date: receipt.date, from: receipt.from });
              await sendWhatsApp({ accountSid: twilioSid, authToken: twilioToken, from: twilioFrom, to: whatsappTo, body: waBody });
              yield { type: "step_output", stepId: "s4", content: `📱 WhatsApp sent → ${whatsappTo}` };
            } catch (waErr) {
              yield { type: "step_output", stepId: "s4", content: `⚠️ WhatsApp failed: ${waErr}` };
            }
          }
        } catch (err) {
          results.push({ subject, ok: false, error: String(err) });
          yield { type: "step_output", stepId: "s4", content: `✗ **${subject}** — failed: ${err}` };
        }
      }
    } else {
      // No "Begin forwarded message:" found — treat the outer email body as the receipt
      if (maxForward !== null && sentCount >= maxForward) {
        skipped++;
        continue;
      }
      const syntheticReceipt: ParsedReceipt = {
        from:    msg.from,
        subject: msg.subject,
        date:    msg.date,
        content: msg.bodyText,
      };
      // Only forward if it passes the same Uber/RingGo sender checks
      const outerFrom = msg.from.toLowerCase();
      const isUberOuter  = filterUber  && (outerFrom.includes("noreply@uber.com") || outerFrom.includes("uber.com"));
      const isRingoOuter = filterRingo && (outerFrom.includes("ringo.info") || outerFrom.includes("ringo.biz"));
      if (!isUberOuter && !isRingoOuter) continue;

      const subject = msg.subject;
      const html    = buildCleanReceiptHtml(syntheticReceipt);
      try {
        await gmailSend(accessToken, { to: forwardTo, subject, body: msg.bodyText, html });
        results.push({ subject, ok: true });
        sentCount++;
        yield { type: "step_output", stepId: "s4", content: `✓ **${subject}** → ${forwardTo}` };
      } catch (err) {
        results.push({ subject, ok: false, error: String(err) });
        yield { type: "step_output", stepId: "s4", content: `✗ **${subject}** — failed: ${err}` };
      }
    }
  }

  const successCount = results.filter((r) => r.ok).length;
  const errorCount   = results.filter((r) => !r.ok).length;

  if (skipped > 0) {
    yield { type: "step_output", stepId: "s4", content: `_${skipped} additional email${skipped !== 1 ? "s" : ""} skipped — cap of ${maxForward} reached_` };
  }

  yield {
    type: "step_output", stepId: "s4",
    content: `**${successCount} forwarded** · ${errorCount} errors${skipped > 0 ? ` · ${skipped} skipped (cap)` : ""}`,
  };
  yield { type: "step_complete", stepId: "s4", duration: elapsed(t) };

  // ── s5 — Log & Report ──────────────────────────────────────────────────────
  yield { type: "step_start", stepId: "s5", label: "Log & Report" };
  t = Date.now();

  const activeFilters = [
    filterForwardedFrom ? `forwarded via:${filterForwardedFrom}` : null,
    filterUber    ? "Uber receipts"   : null,
    filterRingo   ? "RingGo receipts" : null,
    ...filterFrom.map((f)     => `from:${f}`),
    ...filterSubject.map((s)  => `subject:${s}`),
    ...filterHasWords.map((w) => `contains:"${w}"`),
  ].filter(Boolean);

  const summary = [
    `## Run Summary`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| Emails found | ${messages.length} |`,
    `| Forwarded | ${successCount} |`,
    `| Errors | ${errorCount} |`,
    `| Skipped (cap) | ${skipped} |`,
    `| Lookback window | Last ${lookbackHours}h |`,
    `| Forwarded to | ${forwardTo} |`,
    ``,
    `## Active Filters`,
    activeFilters.map((f) => `- ${f}`).join("\n"),
    ``,
    ...(errorCount > 0 ? [
      `## Errors`,
      results.filter((r) => !r.ok).map((r) => `- **${r.subject}**: ${r.error}`).join("\n"),
      ``,
    ] : []),
    `## Notes`,
    `- Original subject, body, and sender are preserved in the forwarded message`,
    `- Re-run to pick up any new receipts since this run`,
  ].join("\n");

  yield { type: "step_output", stepId: "s5", content: summary };
  yield { type: "step_complete", stepId: "s5", duration: elapsed(t) };

  yield { type: "workflow_outcome", content: `## Gmail Receipt Forwarder — Run Complete\n\n${summary}` };
  yield {
    type: "workflow_complete",
    summary: `Forwarded ${successCount}/${messages.length} receipt email${messages.length !== 1 ? "s" : ""} to ${forwardTo}${errorCount > 0 ? ` (${errorCount} error${errorCount !== 1 ? "s" : ""})` : ""}.`,
  };
};
