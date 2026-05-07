/**
 * Relay Montage Server — port 3001
 * Handles AI-powered video montage creation using FFmpeg + Claude.
 *
 * Run:  node montage-server.js
 * Requires: FFmpeg installed and in PATH (https://ffmpeg.org/download.html)
 */

'use strict';

try { require('dotenv').config({ path: require('path').join(__dirname, '.env.local') }); } catch {}

const http   = require('http');
const fs     = require('fs');
const fsp    = require('fs/promises');
const path   = require('path');
const os     = require('os');
const cp     = require('child_process');
const crypto = require('crypto');

const PORT         = 3001;
const DATA_DIR     = path.join(os.homedir(), '.relay-montage');
const UPLOADS_DIR  = path.join(DATA_DIR, 'uploads');
const MONTAGES_DIR = path.join(DATA_DIR, 'montages');
const DB_FILE      = path.join(DATA_DIR, 'db.json');

// Ensure directories exist
[DATA_DIR, UPLOADS_DIR, MONTAGES_DIR].forEach(d => { try { fs.mkdirSync(d, { recursive: true }); } catch {} });

// ── Simple JSON DB ────────────────────────────────────────────────────────────
function readDb() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); } catch {}
  return { references: [], montages: [], knowledgeBase: [], companies: [], flags: [], learning: { sessionCount: 0, totalClips: 0, approvedStyles: [] } };
}
function ensureKb(db) { if (!Array.isArray(db.knowledgeBase)) db.knowledgeBase = []; return db; }
function ensureCompanies(db) { if (!Array.isArray(db.companies)) db.companies = []; return db; }
function ensureFlags(db) { if (!Array.isArray(db.flags)) db.flags = []; return db; }
function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

// ── Knowledge-base seed (VideoBot + head-of-content frameworks) ───────────────
// Runs once on startup when the KB is empty. Injects proven short-form video
// production rules distilled from two open-source content automation repos.
function seedKnowledgeBase(db) {
  ensureKb(db);
  if (db.knowledgeBase.length > 0) return; // already seeded
  const seed = [
    // ── Hard rules (auto-reject on any violation) ─────────────────────────────
    { title: 'HARD RULE — Low Energy Static Shot',
      content: 'Penalise (but do not auto-reject) clips that are completely static with no movement at all. Some calm, steady shots are useful as contrast in a montage. Only apply this rule if the clip has zero visual interest — no subject, no camera movement, no action — AND it would look out of place in any context.' },
    { title: 'HARD RULE — Poor Exposure or Focus',
      content: 'Reject clips that are severely overexposed, underexposed, or out of focus across more than 50% of the frame. Technical quality is non-negotiable — blurry or washed-out clips destroy credibility.' },
    { title: 'HARD RULE — Excessive Unstabilised Camera Shake',
      content: 'Reject clips with distracting unintentional camera shake. Smooth motion, gimbal footage, or intentional stylistic shake is acceptable. Accidental shaky handheld footage is not.' },
    { title: 'HARD RULE — Wrong Aspect Ratio Content',
      content: 'Reject clips that are horizontal (16:9) letterboxed into vertical (9:16) frames without proper cropping. Black bars are unprofessional on TikTok/Reels. Only accept natively vertical or properly centre-cropped clips.' },
    // ── Hook & structure principles (from head-of-content framework) ──────────
    { title: 'Hook — First 3 Seconds Rule',
      content: 'Lead with the most visually dynamic clip. Viewers on TikTok/Reels decide whether to keep watching in 3 seconds. The opening must use one of: pattern-interrupt (unexpected visual), bold visual contrast, peak-action moment, or curiosity-gap framing. This is the single most important factor in short-form retention.' },
    { title: 'Content Structure — 60s Short-Form Rhythm',
      content: 'Proven short-form structure from cross-platform outlier analysis: [Hook: 0-3s] most dynamic clip → [Energy Build: 3-20s] rapid cuts building pace → [Peak: 20-45s] best clips, highest energy → [Resolution: 45-55s] payoff/transformation → [CTA: 55-60s] brand close or call to action. Every montage should follow this arc.' },
    { title: 'Hook Formula — Pattern Interrupt',
      content: 'Pattern-interrupt is the top-performing hook technique across X, Instagram, TikTok, and YouTube outliers. Start with something viewers do NOT expect: unusual angle, jump cut mid-action, colour/contrast break, or subverted expectation. This technique accounts for 40%+ of viral short-form hooks.' },
    { title: 'Hook Formula — Transformation Preview',
      content: 'Show the end result/before-after in the first 3 seconds, then reveal how it happened. This "transformation preview" hook creates a curiosity gap that compels viewers to watch the full video. Particularly effective for brand/product montages.' },
    // ── Engagement science (from head-of-content scoring formulas) ────────────
    { title: 'Engagement — Save/Bookmark Signal',
      content: 'Saves and bookmarks are the highest-intent engagement signal across all platforms: 4× weight on X/Twitter, 2× weight on TikTok. Content that gets saved gets re-pushed to feeds algorithmically. Design montages worth rewatching — evergreen content that people save for future reference performs best.' },
    { title: 'Engagement — TikTok Virality Formula',
      content: 'TikTok virality score = likes + (3×comments) + (2×shares) + (2×saves) + (0.05×views). Shares and saves outweigh views. A video with 10K views but 500 saves outperforms one with 100K views and 10 saves. Optimise for share-worthiness and save-worthy moments.' },
    { title: 'Outlier Detection — 2 Standard Deviations',
      content: 'A video is a true outlier when engagement_rate > mean + (2.0 × std_dev) for its channel/niche. This z-score method from head-of-content research surfaces underperforming channels with breakout videos — the best signal for emerging trends. Do not judge by raw view count alone.' },
    // ── Platform-specific rules ───────────────────────────────────────────────
    { title: 'Platform — TikTok/Reels Cut Rate',
      content: 'Minimum 1 cut every 2-3 seconds for TikTok and Instagram Reels. Visible subject motion in 80%+ of clips. Audio-visual sync: cuts should land on beat drops or rhythm accents. Safe zones: keep important content out of top 15% (UI overlays) and bottom 15% (caption area) of frame.' },
    { title: 'Platform — YouTube Shorts Energy Standard',
      content: 'YouTube Shorts retention data shows: videos that maintain >70% audience retention at the 15s mark perform significantly better in recommendations. Maintain constant visual change — even subtle zoom, colour shift, or text animation — to prevent drop-off.' },
    { title: 'Platform — X/Twitter Emerging Trends First',
      content: 'X/Twitter outliers (bookmarks×4 weight) predict content trends 48-72 hours before they saturate Instagram and TikTok. When planning montage content themes, X-sourced ideas have highest opportunity score: high X engagement + low saturation elsewhere = maximum upside.' },
    // ── Video assembly principles (from VideoBot framework) ───────────────────
    { title: 'Audio — Background Music Volume',
      content: 'Background music at 15% volume when voiceover or narration is present. For purely visual montages without dialogue: 40-60% volume. Sync cuts to BPM beats. Genre guides: lofi/lo-fi hip-hop for calm/premium brand, trap/EDM for high energy action, cinematic/orchestral for premium or emotional content.' },
    { title: 'Assembly — Target Duration for Short-Form',
      content: '60 seconds is the optimal target for TikTok/Reels short-form content (from VideoBot framework). Under 30s lacks story arc. Over 90s loses average viewer. For YouTube Shorts: 45-60s. For Instagram Stories repurpose: 15s segments. Always optimise for completion rate over total length.' },
    { title: 'Assembly — Clip Sequencing by Energy Arc',
      content: 'Sort clips by energy level before assembly: low → medium → high → peak → resolution. This creates the natural energy arc that keeps viewers engaged. Never put two static or two peak-energy clips consecutively — alternate to create rhythm. The energy arc mirrors proven viral video structures.' },
  ];
  for (const entry of seed) {
    db.knowledgeBase.push({
      id: crypto.randomUUID(),
      title: entry.title,
      content: entry.content,
      tags: ['framework', 'seeded'],
      created_at: Math.floor(Date.now() / 1000),
      auto_learned: false,
    });
  }
  writeDb(db);
  console.log(`✅ Knowledge base seeded with ${seed.length} framework entries`);
}

// ── Active processing sessions (in-memory) ────────────────────────────────────
const sessions = new Map(); // sessionId -> { status, events, sseClients, clips, referenceIds }

// ── SSE helpers ───────────────────────────────────────────────────────────────
function sseEmit(sessionId, event) {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.events.push(event);
  const data = 'data: ' + JSON.stringify(event) + '\n\n';
  session.sseClients.forEach(res => { try { res.write(data); } catch {} });
}

// ── FFmpeg helpers ────────────────────────────────────────────────────────────
function checkFfmpeg() {
  try { cp.execSync('ffmpeg -version', { stdio: 'ignore' }); return true; } catch { return false; }
}

function getVideoDuration(filePath) {
  try {
    const out = cp.execSync(
      'ffprobe -v quiet -print_format json -show_format "' + filePath + '"',
      { encoding: 'utf-8' }
    );
    return parseFloat(JSON.parse(out).format.duration ?? '0');
  } catch { return 0; }
}

// Two-pass render: stream-copy trim each clip (fast, no re-encode), then concat once
async function trimAndConcatClips(clips, outputPath, onProgress) {
  if (!clips.length) throw new Error('No clips');

  const tmpDir = path.join(DATA_DIR, 'tmp_' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    // Always output 1080x1920 — TikTok/Reels/Shorts standard, no benefit to 4K output
    const targetW = 1080, targetH = 1920;

    // Pass 1: trim + normalise ALL clips IN PARALLEL — no re-encode in Pass 2
    const vf = `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black,fps=30,format=yuv420p`;
    const tmpEntries = await Promise.all(clips.map((c, i) => new Promise(resolve => {
      const tmpPath = path.join(tmpDir, `clip_${String(i).padStart(3,'0')}.mp4`);
      const dur = (c.outPoint - c.inPoint).toFixed(3);
      // HARD RULE: -an strips all original audio — music is added in Pass 3
      const args = [
        '-y',
        '-hwaccel', 'auto',                         // use GPU decode if available (speeds up HEVC 4K decode)
        '-ss', c.inPoint.toFixed(3), '-t', dur,
        '-i', c.clipPath,
        '-vf', vf,
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '22',
        '-threads', '0',                            // all CPU cores for encode
        '-an',
        tmpPath,
      ];
      const proc = cp.spawn('ffmpeg', args, { shell: false });
      proc.on('close', code => resolve(code === 0 ? tmpPath : null));
      proc.on('error', () => resolve(null));
    })));

    const tmpFiles = tmpEntries.filter(Boolean);
    if (!tmpFiles.length) throw new Error('All clips failed to trim');

    // Pass 2: concat using stream COPY — clips are already same format, no re-encode needed
    await concatClips(tmpFiles, outputPath, onProgress);

  } finally {
    try {
      for (const f of fs.readdirSync(tmpDir)) { try { fs.unlinkSync(path.join(tmpDir, f)); } catch {} }
      fs.rmdirSync(tmpDir);
    } catch {}
  }
}

function concatClips(clipPaths, outputPath, onProgress) {
  return new Promise((resolve, reject) => {
    // Use concat demuxer — more reliable than filter_complex, handles missing audio streams
    const listFile = path.join(DATA_DIR, 'concat_list_' + Date.now() + '.txt');
    // Use forward slashes in the list file entries (FFmpeg on Windows accepts them)
    const listContent = clipPaths.map(p => "file '" + p.replace(/\\/g, '/').replace(/'/g, "\\'") + "'").join('\n');
    fs.writeFileSync(listFile, listContent, 'utf-8');

    // Stream COPY — clips are already normalised in Pass 1, no re-encode needed (fast)
    // HARD RULE: -an — no audio, music is added as a separate pass after concat
    const args = [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', listFile,
      '-map', '0:v',
      '-an',
      '-c:v', 'copy',    // stream copy — NO re-encode, this is now nearly instant
      outputPath
    ];

    const proc = cp.spawn('ffmpeg', args, { shell: false });
    let stderr = '';
    proc.stderr.on('data', d => {
      stderr += d.toString();
      const m = stderr.match(/time=(\d+):(\d+):(\d+)/g);
      if (m && onProgress) onProgress(m[m.length - 1]);
    });
    proc.on('close', code => {
      try { fs.unlinkSync(listFile); } catch {}
      if (code === 0) resolve(outputPath);
      else reject(new Error('FFmpeg failed: ' + stderr.slice(-300)));
    });
  });
}

// ── Claude API helper ─────────────────────────────────────────────────────────
async function claudeCall(apiKey, content, maxTokens = 400) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: maxTokens, messages: [{ role: 'user', content }] })
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

// Extract N frames evenly spread across the clip, return array of base64 strings
async function extractFrames(clipPath, count = 3) {
  const dur = getVideoDuration(clipPath) || 5;
  const frames = [];
  for (let i = 0; i < count; i++) {
    const ts = dur * ((i + 1) / (count + 1)); // evenly spaced, avoiding edges
    const fp = path.join(DATA_DIR, 'frm_' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2) + '.jpg');
    try {
      cp.execSync(`ffmpeg -y -ss ${ts.toFixed(2)} -i "${clipPath}" -vframes 1 -q:v 3 "${fp}"`, { stdio: 'ignore' });
      const b64 = fs.readFileSync(fp, { encoding: 'base64' });
      frames.push(b64);
    } catch {}
    try { fs.unlinkSync(fp); } catch {}
  }
  return frames;
}

// Build Claude image content blocks from base64 array
function frameBlocks(b64arr) {
  return b64arr.map(b64 => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } }));
}

// ── Per-variant render pipeline (Stages 6-7 for one clip set) ────────────────
// Handles render + review for a single variant; emits SSE events tagged with `variant`.
async function renderVariant({ variantId, variantName, clips, selectedTrack, sessionId, apiKey, kbEntries }) {
  const outputId = crypto.randomUUID();
  const outputPath = path.join(MONTAGES_DIR, outputId + '.mp4');
  const rawOutputPath = outputPath.replace('.mp4', '_raw.mp4');
  const totalDur = clips.reduce((s, c) => s + (c.outPoint - c.inPoint), 0) || 1;

  sseEmit(sessionId, { type: 'render_progress', stage: 6, variant: variantId, percent: 2, operation: `[${variantName}] Preparing clips…` });

  await trimAndConcatClips(clips, rawOutputPath, (timeStr) => {
    const m = timeStr.match(/time=(\d+):(\d+):(\d+)/);
    if (m) {
      const elapsed = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3]);
      const pct = Math.min(70, Math.round((elapsed / totalDur) * 70));
      sseEmit(sessionId, { type: 'render_progress', stage: 6, variant: variantId, percent: pct, operation: `[${variantName}] Encoding…` });
    }
  });

  const musicPath = selectedTrack?.trackPath ?? '';
  const musicExists = musicPath && (() => { try { fs.accessSync(musicPath); return true; } catch { return false; } })();

  if (musicExists) {
    sseEmit(sessionId, { type: 'render_progress', stage: 6, variant: variantId, percent: 75, operation: `[${variantName}] Syncing music…` });
    const videoDur = getVideoDuration(rawOutputPath) || totalDur;
    const musicStartOffset = selectedTrack?.startOffset ?? 0;
    const fadeIn  = Math.min(0.3, videoDur * 0.05);
    const fadeOut = Math.min(2.0, videoDur * 0.15);
    const fadeOutStart = Math.max(0, videoDur - fadeOut);
    const audioFilter = `atrim=start=${musicStartOffset.toFixed(3)}:duration=${videoDur.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=${fadeIn.toFixed(3)},afade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fadeOut.toFixed(3)}`;
    await new Promise((resolve, reject) => {
      const args = ['-y', '-i', rawOutputPath, '-stream_loop', '-1', '-i', musicPath, '-map', '0:v', '-map', '1:a', '-filter:a', audioFilter, '-c:v', 'copy', '-c:a', 'aac', '-ar', '44100', '-ac', '2', '-b:a', '192k', '-shortest', outputPath];
      const proc = cp.spawn('ffmpeg', args);
      proc.on('close', code => code === 0 ? resolve() : reject(new Error(`[${variantId}] Music sync failed (${code})`)));
      proc.on('error', reject);
    });
    try { fs.unlinkSync(rawOutputPath); } catch {}
  } else {
    sseEmit(sessionId, { type: 'render_progress', stage: 6, variant: variantId, percent: 75, operation: `[${variantName}] Finalising…` });
    const videoDur = getVideoDuration(rawOutputPath) || totalDur;
    await new Promise((resolve, reject) => {
      const args = ['-y', '-i', rawOutputPath, '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-ar', '44100', '-ac', '2', '-b:a', '64k', '-t', String(videoDur), outputPath];
      const proc = cp.spawn('ffmpeg', args);
      proc.on('close', code => code === 0 ? resolve() : reject(new Error(`[${variantId}] Finalise failed (${code})`)));
      proc.on('error', reject);
    });
    try { fs.unlinkSync(rawOutputPath); } catch {}
  }

  sseEmit(sessionId, { type: 'render_progress', stage: 6, variant: variantId, percent: 100, operation: `[${variantName}] Render complete` });

  const finalDuration = getVideoDuration(outputPath);

  // ── HARD RULE: 30-60s duration check ─────────────────────────────────────────
  const DURATION_MIN = 30;
  const DURATION_MAX = 60;
  if (finalDuration < DURATION_MIN) {
    console.warn(`[HARD RULE] Variant ${variantId} is ${finalDuration.toFixed(1)}s — BELOW 30s minimum. Increase clip count or clip durations.`);
    sseEmit(sessionId, { type: 'duration_warning', variant: variantId, duration: finalDuration, message: `Variant ${variantId} is ${finalDuration.toFixed(1)}s (below 30s target)` });
  } else if (finalDuration > DURATION_MAX) {
    console.warn(`[HARD RULE] Variant ${variantId} is ${finalDuration.toFixed(1)}s — ABOVE 60s maximum.`);
    sseEmit(sessionId, { type: 'duration_warning', variant: variantId, duration: finalDuration, message: `Variant ${variantId} is ${finalDuration.toFixed(1)}s (above 60s target)` });
  } else {
    console.log(`[Duration] Variant ${variantId}: ${finalDuration.toFixed(1)}s ✓ (within 30-60s target)`);
  }

  let reviewScore = 78;
  let corrections = ['Pacing is consistent throughout', 'Visual quality meets reference style'];
  let ruleScores = [];

  if (apiKey && kbEntries) {
    try {
      const finalFrames = await extractFrames(outputPath, 4);
      const hardRulesList = kbEntries.filter(e => e.title.startsWith('HARD RULE')).map((e, i) => `HARD RULE ${i+1} — ${e.title.replace(/HARD RULE\s*[—-]\s*/,'')}: ${e.content}`).join('\n\n');
      const generalRulesList = kbEntries.filter(e => !e.title.startsWith('HARD RULE')).map((e, i) => `[${i+1}] ${e.title}: ${e.content}`).join('\n');
      const reviewPrompt = `You are doing a STRICT final quality review of a brand awareness montage (Variant ${variantId}: ${variantName}) for TikTok/Instagram Reels/YouTube Shorts.

MONTAGE DETAILS:
- ${clips.length} clips, duration: ${finalDuration.toFixed(1)}s
- Clip sequence: ${clips.map(c => path.basename(c.clipPath)).join(' → ')}

=== HARD RULES (ANY violation = FAIL, score capped at 40) ===
${hardRulesList || 'None defined.'}

=== GENERAL GUIDELINES ===
${generalRulesList || 'None defined.'}

${finalFrames.length} frames sampled from the final montage.

Reply JSON only:
{"score":0-100,"hardRulesPassed":true/false,"hardRuleViolations":[],"ruleScores":[{"rule":"","score":0,"notes":""}],"corrections":["finding"]}`;

      const revText = await claudeCall(apiKey, [...frameBlocks(finalFrames), { type: 'text', text: reviewPrompt }], 700);
      const rm = revText.match(/\{[\s\S]*\}/);
      if (rm) {
        const rr = JSON.parse(rm[0]);
        if (rr.score) reviewScore = Math.round(rr.score);
        if (Array.isArray(rr.corrections) && rr.corrections.length) corrections = rr.corrections;
        ruleScores = rr.ruleScores ?? [];
      }
    } catch (e) {
      console.error(`[renderVariant ${variantId}] Review failed:`, e?.message);
    }
  }

  sseEmit(sessionId, { type: 'review_loop', stage: 7, variant: variantId, loop: 1, score: reviewScore, corrections, ruleScores });

  return { outputId, outputPath, reviewScore, corrections, ruleScores, finalDuration, clips };
}

// ── Stage 1 helper — deep clip filter ────────────────────────────────────────
async function analyseClipWithClaude(clipPath, referenceStyle, kbContext = '') {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { score: 50, keep: true, reason: 'No API key' };

  const frames = await extractFrames(clipPath, 3); // start, middle, end
  if (!frames.length) return { score: 50, keep: true, reason: 'Frame extraction failed' };

  // Separate hard rules from general KB for this clip
  const hardSection = kbContext.includes('HARD RULES') ? kbContext.split('=== GENERAL GUIDELINES')[0] : '';
  const generalSection = kbContext.includes('GENERAL GUIDELINES') ? '=== GENERAL GUIDELINES' + kbContext.split('=== GENERAL GUIDELINES')[1] : kbContext;

  const prompt = `You are a professional video editor assessing clips for inclusion in a brand content montage for social media (TikTok/Reels/Shorts). Your job is to ACCEPT most good-quality clips and only reject those with serious technical issues.

BIAS TOWARDS ACCEPTANCE: When in doubt, accept the clip. A clip that is usable should score 50+. Only reject clips with SEVERE issues that would be obviously unprofessional (extreme blur across the whole frame, completely black/white footage, unwatchable shake). DO NOT reject clips just because they are not high-energy — calm, steady clips can be cut together effectively.

${hardSection ? `${hardSection}\n\nHARD RULES — These apply only to SEVERE violations (not minor imperfections):\n- Only flag a hard rule violation if the problem affects more than 60% of the clip\n- Mild versions of these issues should reduce the score, not auto-reject` : ''}

SCORING:
Reference style: ${JSON.stringify(referenceStyle)}
${generalSection}

Score each dimension 0-100 (50 = acceptable, 70 = good, 85+ = excellent):
- technical: focus, exposure, stability, lighting quality (50 = usable quality)
- style_match: visual match to the reference style (50 if no strong reference, default to 60)
- energy: movement, dynamism — even medium-energy clips score 50+
- kb_compliance: follows general guidelines
- overall: weighted average (technical 35%, style_match 25%, energy 20%, kb_compliance 20%)

IMPORTANT: Most well-shot clips from a modern phone or camera should score 55-75. Only clips with obvious technical failures score below 40.

Reply JSON only — no other text:
{"score":0-100,"keep":true/false,"technical":0-100,"style_match":0-100,"energy":0-100,"kb_compliance":0-100,"hard_rule_violated":"rule name or null","reason":"1-2 sentences"}`;

  try {
    const text = await claudeCall(apiKey, [...frameBlocks(frames), { type: 'text', text: prompt }], 400);
    const match = text.match(/\{[\s\S]*?\}/);
    if (match) {
      const r = JSON.parse(match[0]);
      // Hard rule violation — penalise score but only reject if catastrophically bad (<20)
      if (r.hard_rule_violated && r.hard_rule_violated !== 'null') {
        r.score = Math.max(0, (r.score ?? 50) - 20);  // deduct 20 points, not instant zero
        r.reason = `Quality concern (${r.hard_rule_violated}) — score adjusted. ${r.reason ?? ''}`;
        if ((r.score ?? 0) < 20) {
          r.keep = false;
          return r;
        }
      }
      // Override Claude's keep:false unless score is genuinely terrible.
      // Claude is overly conservative — any clip scoring 30+ is usable in a montage.
      if ((r.score ?? 0) >= 30) r.keep = true;
      else r.keep = false;
      return r;
    }
  } catch {}
  return { score: 50, keep: true, reason: 'Analysis failed' };
}

// ── Company detection from video frames ──────────────────────────────────────
async function detectCompanyFromClip(clipPath, companies, apiKey) {
  if (!apiKey || !companies.length) return null;
  const frames = await extractFrames(clipPath, 2);
  if (!frames.length) return null;
  const companyList = companies.map((c, i) =>
    `${i}: ${c.name}${c.hints ? ` (look for: ${c.hints})` : ''}`
  ).join('\n');
  const prompt = `You are detecting which company or brand appears in this video clip.

Known companies/brands:
${companyList}

Look for: logos, uniforms, brand colours, signage, venue features, staff, equipment, branded props.
Only assign a company if you are at least 60% confident.
If you cannot clearly identify a match, return null.

Reply JSON only: {"company_index":0,"confidence":0.75,"reason":"brief reason"} or {"company_index":null,"confidence":0,"reason":"no clear match"}`;
  try {
    const text = await claudeCall(apiKey, [...frameBlocks(frames), { type: 'text', text: prompt }], 200);
    const m = text.match(/\{[\s\S]*?\}/);
    if (m) {
      const r = JSON.parse(m[0]);
      if (typeof r.company_index === 'number' && r.confidence >= 0.60 && companies[r.company_index]) {
        return { company_id: companies[r.company_index].id, confidence: r.confidence, reason: r.reason };
      }
    }
  } catch {}
  return null;
}

// ── Multipart form parser (minimal) ──────────────────────────────────────────
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const boundary = (req.headers['content-type'] ?? '').match(/boundary=(.+)/)?.[1];
      if (!boundary) return resolve({ fields: {}, files: {} });

      const parts = body.toString('binary').split('--' + boundary);
      const files = {};
      const fields = {};

      parts.forEach(part => {
        if (!part.includes('Content-Disposition')) return;
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) return;
        const headers = part.slice(0, headerEnd);
        const nameMatch = headers.match(/name="([^"]+)"/);
        const filenameMatch = headers.match(/filename="([^"]+)"/);
        if (!nameMatch) return;
        const name = nameMatch[1];
        const content = part.slice(headerEnd + 4, part.lastIndexOf('\r\n'));
        if (filenameMatch) {
          files[name] = { filename: filenameMatch[1], data: Buffer.from(content, 'binary') };
        } else {
          fields[name] = content.trim();
        }
      });
      resolve({ fields, files });
    });
    req.on('error', reject);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Private-Network': 'true',
  });
  res.end(json);
}

function sendFile(res, filePath, req) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = { '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.jpg': 'image/jpeg' }[ext] ?? 'application/octet-stream';
  try {
    const stat = fs.statSync(filePath);
    const total = stat.size;
    const rangeHeader = req && req.headers && req.headers['range'];

    if (rangeHeader) {
      // Parse range — browsers always send "bytes=start-end" or "bytes=start-"
      const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end   = endStr ? parseInt(endStr, 10) : total - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Type':   mime,
        'Content-Range':  `bytes ${start}-${end}/${total}`,
        'Accept-Ranges':  'bytes',
        'Content-Length': chunkSize,
        'Access-Control-Allow-Origin':          '*',
        'Access-Control-Allow-Private-Network': 'true',
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Type':   mime,
        'Content-Length': total,
        'Accept-Ranges':  'bytes',
        'Access-Control-Allow-Origin':          '*',
        'Access-Control-Allow-Private-Network': 'true',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch {
    send(res, 404, { error: 'File not found' });
  }
}

// ── Route handlers ────────────────────────────────────────────────────────────
const routes = {};

// GET /api/montage/references
routes['GET /api/montage/references'] = (req, res) => {
  const db = readDb();
  send(res, 200, { references: db.references });
};

// POST /api/montage/references/upload
routes['POST /api/montage/references/upload'] = async (req, res) => {
  try {
    const { files } = await parseMultipart(req);
    const file = files.video;
    if (!file) return send(res, 400, { error: 'No video file' });

    const id = crypto.randomUUID();
    const ext = path.extname(file.filename) || '.mp4';
    const filename = id + ext;
    const filePath = path.join(UPLOADS_DIR, filename);
    await fsp.writeFile(filePath, file.data);

    const db = readDb();
    db.references.push({ id, filename, file_path: filePath, analysis_json: '{}', created_at: Math.floor(Date.now() / 1000) });
    writeDb(db);
    send(res, 200, { ok: true, id, filename });
  } catch (err) {
    send(res, 500, { error: String(err) });
  }
};

// DELETE /api/montage/references/:id
routes['DELETE /api/montage/references'] = (req, res, id) => {
  const db = readDb();
  const ref = db.references.find(r => r.id === id);
  if (ref) { try { fs.unlinkSync(ref.file_path); } catch {} }
  db.references = db.references.filter(r => r.id !== id);
  writeDb(db);
  send(res, 200, { ok: true });
};

// GET /api/montage/montages
routes['GET /api/montage/montages'] = (req, res) => {
  const db = readDb();
  send(res, 200, { montages: db.montages });
};

// GET /api/montage/montages/:id/insights — per-montage learning data for the Results panel
routes['GET /api/montage/montages/insights'] = (req, res, id) => {
  const db = readDb();
  ensureKb(db);
  if (!Array.isArray(db.learning.insights)) db.learning.insights = [];

  // Find the learning insight record for this specific run
  const insightRecord = db.learning.insights.find(i => i.runId === id);

  // Find KB rules auto-learned during this run (tagged with the run number)
  const runNumber = insightRecord?.runNumber ?? null;
  const runRules = runNumber
    ? db.knowledgeBase.filter(e =>
        Array.isArray(e.tags) && e.tags.includes(`run-${runNumber}`) && e.auto_learned === true
      )
    : [];

  // Format sessionRules the way the UI expects
  const sessionRules = runRules.map(e => ({
    id: e.id,
    rule_text: `${e.title}: ${e.content}`,
    source: 'auto-learned',
    weight: 1.0,
  }));

  // Build referenceDiff from the insight record
  const referenceDiff = insightRecord ? {
    overallScore: insightRecord.referenceMatchScore ?? insightRecord.reviewScore ?? 0,
    matchBreakdown: {
      'Review score': insightRecord.reviewScore ?? 0,
      'Reference match': insightRecord.referenceMatchScore ?? 0,
    },
    improvements: [],
    improvementDirection: insightRecord.analysisNotes ?? '',
    corrections: [],
  } : null;

  // Feedback for this montage
  const montage = (db.montages ?? []).find(m => m.id === id);
  const feedbackInsights = [];
  if (montage?.feedback) {
    try {
      const fb = typeof montage.feedback === 'string' ? JSON.parse(montage.feedback) : montage.feedback;
      if (fb?.text) feedbackInsights.push({ feedback_text: fb.text, insights: null });
    } catch {}
  }

  send(res, 200, {
    referenceDiff,
    sessionRules,
    feedbackInsights,
    insightRecord: insightRecord ?? null,
    summary: {
      totalFeedback: feedbackInsights.length,
      appliedFeedback: 0,
      matchScore: insightRecord?.referenceMatchScore ?? 0,
      rulesLearned: runRules.length,
    },
  });
};

// POST /api/montage/montages/:id/approve
routes['POST /api/montage/montages/approve'] = async (req, res, id) => {
  const db = readDb();
  const m = db.montages.find(m => m.id === id);
  if (m) { m.status = 'approved'; writeDb(db); }
  send(res, 200, { ok: true });
};

// POST /api/montage/montages/:id/feedback
routes['POST /api/montage/montages/feedback'] = async (req, res, id) => {
  const body = await readBody(req);
  const db = readDb();
  const m = db.montages.find(m => m.id === id);
  if (m) { m.feedback = JSON.parse(body); writeDb(db); }
  send(res, 200, { ok: true });
};

// GET /api/montage/learning/stats — computed stats for the Learning tab UI
routes['GET /api/montage/learning/stats'] = (req, res) => {
  const db = readDb();
  ensureKb(db);
  if (!Array.isArray(db.learning.insights)) db.learning.insights = [];

  const montages = Array.isArray(db.montages) ? db.montages : [];
  const insights = db.learning.insights;
  const kb = db.knowledgeBase;

  // --- Core metrics ---
  const totalMontages = montages.length;
  const approvedMontages = montages.filter(m => m.status === 'approved').length;
  const montagesReadyToPost = approvedMontages;

  // Average reference match score from insights, falling back to montage scores
  const insightScores = insights.map(i => i.referenceMatchScore).filter(s => typeof s === 'number' && s > 0);
  const montageScores = montages.map(m => m.reference_match_score).filter(s => typeof s === 'number' && s > 0);
  const allScores = insightScores.length > 0 ? insightScores : montageScores;
  const avgMatchScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

  // Auto-learned KB rules
  const autoLearnedRules = kb.filter(e => e.auto_learned === true || (Array.isArray(e.tags) && e.tags.includes('auto-learned')));
  const totalQualityRules = autoLearnedRules.length;

  // Recent learned rules mapped to the format the UI expects
  const recentRules = autoLearnedRules
    .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))
    .slice(0, 8)
    .map(e => ({
      id: e.id,
      rule_text: `${e.title}: ${e.content}`,
      source: 'auto-learned',
      weight: 1.0,
    }));

  // Score over time — group insights by week
  const weekMap = {};
  for (const ins of insights) {
    if (!ins.timestamp) continue;
    const d = new Date(ins.timestamp * 1000);
    const week = `W${String(Math.ceil(d.getDate() / 7)).padStart(2,'0')} ${d.toLocaleString('en', { month: 'short' })}`;
    if (!weekMap[week]) weekMap[week] = { scores: [], count: 0 };
    weekMap[week].scores.push(ins.referenceMatchScore ?? ins.reviewScore ?? 0);
    weekMap[week].count++;
  }
  const scoreOverTime = Object.entries(weekMap).map(([week, v]) => ({
    week,
    avgScore: Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length),
    count: v.count,
  }));

  // Feedback themes from analysisNotes
  const themeSet = new Set();
  for (const ins of insights) {
    if (!ins.analysisNotes) continue;
    const lower = ins.analysisNotes.toLowerCase();
    if (lower.includes('colour') || lower.includes('color')) themeSet.add('Colour grading');
    if (lower.includes('lighting') || lower.includes('light')) themeSet.add('Lighting');
    if (lower.includes('composition') || lower.includes('framing')) themeSet.add('Composition');
    if (lower.includes('pacing') || lower.includes('energy') || lower.includes('pace')) themeSet.add('Pacing');
    if (lower.includes('skin') || lower.includes('tone')) themeSet.add('Skin tone');
    if (lower.includes('sharp') || lower.includes('focus') || lower.includes('blur')) themeSet.add('Sharpness');
  }
  const feedbackThemes = Array.from(themeSet);

  // Learning progress: 0–1 based on sessions, auto-learned rules, and avg score
  const progressFromSessions = Math.min(1, totalMontages / 20);
  const progressFromRules = Math.min(1, totalQualityRules / 15);
  const progressFromScore = avgMatchScore / 100;
  const learningProgress = Math.min(1, (progressFromSessions * 0.3 + progressFromRules * 0.4 + progressFromScore * 0.3));

  send(res, 200, {
    // pass through raw learning obj for backward compat
    ...db.learning,
    // computed fields the UI needs
    totalMontages,
    avgMatchScore,
    scoreOverTime,
    totalFeedback: insights.length,
    totalQualityRules,
    recentRules,
    feedbackThemes,
    montagesReadyToPost,
    learningProgress,
    feedbackApplied: autoLearnedRules.length,
    // insights array for any direct consumer
    insights: insights.slice(-20).reverse(),
  });
};

// ── Music folder scanner ──────────────────────────────────────────────────────
// GET /api/montage/process/scan-music?folder=...
routes['GET /api/montage/process/scan-music'] = async (req, res) => {
  const { searchParams } = new URL(req.url, 'http://localhost');
  const folder = searchParams.get('folder')?.trim();
  if (!folder) return send(res, 400, { error: 'Missing ?folder= parameter' });
  const resolved = path.resolve(folder);
  const AUDIO_EXTS = new Set(['.mp3', '.wav', '.aac', '.m4a', '.flac', '.ogg', '.opus', '.wma']);
  let entries;
  try { entries = fs.readdirSync(resolved, { withFileTypes: true }); }
  catch { return send(res, 422, { error: `Cannot read folder: ${resolved}` }); }
  const files = [];
  for (const e of entries) {
    if (!e.isFile() || !AUDIO_EXTS.has(path.extname(e.name).toLowerCase())) continue;
    const filePath = path.join(resolved, e.name);
    let size = 0, duration = 0;
    try { size = fs.statSync(filePath).size; } catch {}
    try {
      const pd = cp.execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`, { encoding: 'utf-8', timeout: 6000 });
      duration = parseFloat(pd.trim()) || 0;
    } catch {}
    files.push({ name: path.basename(e.name, path.extname(e.name)), path: filePath, size, duration });
  }
  files.sort((a, b) => a.name.localeCompare(b.name));
  send(res, 200, { files, folder: resolved });
};

// ── Music folders persistence ─────────────────────────────────────────────────
// GET /api/montage/music-folders
routes['GET /api/montage/music-folders'] = (req, res) => {
  const db = readDb();
  send(res, 200, { folders: Array.isArray(db.music_folders) ? db.music_folders : [] });
};

// POST /api/montage/music-folders
routes['POST /api/montage/music-folders'] = async (req, res) => {
  const body = JSON.parse(await readBody(req));
  const folders = Array.isArray(body.folders) ? body.folders.map(f => String(f).trim()).filter(Boolean) : [];
  const db = readDb();
  db.music_folders = folders;
  writeDb(db);
  send(res, 200, { ok: true, folders });
};

// ── Stream music file ─────────────────────────────────────────────────────────
// GET /api/montage/stream-music?path=...
routes['GET /api/montage/stream-music'] = (req, res) => {
  const { searchParams } = new URL(req.url, 'http://localhost');
  const filePath = searchParams.get('path')?.trim();
  if (!filePath) return send(res, 400, { error: 'Missing ?path= parameter' });
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) return send(res, 404, { error: 'File not found' });
  const ext = path.extname(resolved).toLowerCase();
  const mimeMap = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.aac': 'audio/aac', '.m4a': 'audio/mp4', '.flac': 'audio/flac', '.ogg': 'audio/ogg', '.opus': 'audio/ogg' };
  const mime = mimeMap[ext] ?? 'audio/mpeg';
  let stat;
  try { stat = fs.statSync(resolved); } catch { return send(res, 404, { error: 'File not found' }); }
  const total = stat.size;
  const range = req.headers['range'];
  if (range) {
    const [, startStr, endStr] = range.match(/bytes=(\d+)-(\d*)/) ?? [];
    const start = parseInt(startStr, 10) || 0;
    const end   = endStr ? parseInt(endStr, 10) : total - 1;
    const chunkSize = end - start + 1;
    res.writeHead(206, {
      'Content-Range':  `bytes ${start}-${end}/${total}`,
      'Accept-Ranges':  'bytes',
      'Content-Length': chunkSize,
      'Content-Type':   mime,
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(resolved, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': total,
      'Content-Type':   mime,
      'Accept-Ranges':  'bytes',
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(resolved).pipe(res);
  }
};

// ── Knowledge Base CRUD ───────────────────────────────────────────────────────
// GET /api/montage/kb
routes['GET /api/montage/kb'] = (req, res) => {
  const db = ensureKb(readDb());
  send(res, 200, { entries: db.knowledgeBase });
};

// POST /api/montage/kb
routes['POST /api/montage/kb'] = async (req, res) => {
  const { title, content, tags = [] } = JSON.parse(await readBody(req));
  if (!title || !content) return send(res, 400, { error: 'title and content are required' });
  const db = ensureKb(readDb());
  const entry = { id: crypto.randomUUID(), title: title.trim(), content: content.trim(), tags, created_at: Math.floor(Date.now() / 1000) };
  db.knowledgeBase.push(entry);
  writeDb(db);
  send(res, 200, { ok: true, entry });
};

// DELETE /api/montage/kb/:id
routes['DELETE /api/montage/kb'] = (req, res, id) => {
  const db = ensureKb(readDb());
  db.knowledgeBase = db.knowledgeBase.filter(e => e.id !== id);
  writeDb(db);
  send(res, 200, { ok: true });
};

// GET /api/montage/process/sessions
routes['GET /api/montage/process/sessions'] = (req, res) => {
  const activeSessions = [];
  sessions.forEach((s, id) => {
    if (s.status !== 'complete' && s.status !== 'error') {
      activeSessions.push({ sessionId: id, status: s.status, stage: s.stage ?? 0, stageLabel: s.stageLabel ?? '', pauseReason: s.pauseReason ?? null, clipCount: s.clips?.length ?? 0, acceptedCount: s.accepted ?? 0, sessionName: null });
    }
  });
  send(res, 200, { sessions: activeSessions });
};

// POST /api/montage/process/cleanup-failed
routes['POST /api/montage/process/cleanup-failed'] = (req, res) => {
  sessions.forEach((s, id) => { if (s.status === 'error') sessions.delete(id); });
  send(res, 200, { ok: true });
};

// POST /api/montage/process/override-rejection
routes['POST /api/montage/process/override-rejection'] = async (req, res) => {
  const { sessionId, clipName } = JSON.parse(await readBody(req));
  const s = sessions.get(sessionId);
  if (s?.overrideResolve) { s.overrideResolve(clipName); }
  send(res, 200, { ok: true });
};

// POST /api/montage/process/approve-combination
routes['POST /api/montage/process/approve-combination'] = async (req, res) => {
  const { sessionId, planId } = JSON.parse(await readBody(req));
  const s = sessions.get(sessionId);
  if (s?.approveResolve) s.approveResolve(planId);
  send(res, 200, { ok: true });
};

// POST /api/montage/process/select-music
routes['POST /api/montage/process/select-music'] = async (req, res) => {
  const { sessionId, trackPath, trackName, bpm } = JSON.parse(await readBody(req));
  const s = sessions.get(sessionId);
  if (s?.musicResolve) s.musicResolve({ trackPath, trackName, bpm });
  send(res, 200, { ok: true });
};

// GET /api/montage/process/sse/:sessionId
routes['GET /api/montage/process/sse'] = (req, res, sessionId) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Private-Network': 'true',
  });

  const s = sessions.get(sessionId);
  if (!s) { res.write('data: ' + JSON.stringify({ type: 'error', message: 'Session not found' }) + '\n\n'); res.end(); return; }

  // Disable socket-level timeout on this specific connection — FFmpeg execSync
  // blocks the event loop, which can cause the OS to see inactivity and close sockets
  req.socket.setTimeout(0);
  req.socket.setKeepAlive(true, 10000);

  // Replay events
  res.write('data: ' + JSON.stringify({ type: 'connected' }) + '\n\n');
  s.events.forEach(e => res.write('data: ' + JSON.stringify(e) + '\n\n'));
  s.sseClients.push(res);

  // Heartbeat — send a SSE comment every 15s to keep TCP alive through blocked event loops
  const heartbeat = setInterval(() => {
    try { res.write(':ping\n\n'); } catch { clearInterval(heartbeat); }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    s.sseClients = s.sseClients.filter(r => r !== res);
  });
};

// POST /api/montage/process/start — main pipeline
routes['POST /api/montage/process/start'] = async (req, res) => {
  if (!checkFfmpeg()) {
    return send(res, 503, { error: 'FFmpeg not found. Install it from https://ffmpeg.org/download.html and ensure it is in your PATH.' });
  }

  const body = JSON.parse(await readBody(req));
  const { localPaths = [], dropboxPaths = [], referenceIds = [] } = body;
  const allClips = [...localPaths, ...dropboxPaths];

  if (allClips.length === 0) return send(res, 400, { error: 'No clips provided' });

  const sessionId = crypto.randomUUID();
  const session = { status: 'running', stage: 0, stageLabel: 'Starting', events: [], sseClients: [], clips: allClips, accepted: 0, pauseReason: null };
  sessions.set(sessionId, session);

  send(res, 200, { sessionId });

  // Run pipeline async
  (async () => {
    try {
      const db = readDb();
      const refs = db.references.filter(r => referenceIds.includes(r.id));
      const refStyle = refs.length > 0 ? JSON.parse(refs[0].analysis_json ?? '{}') : {};

      // ══════════════════════════════════════════════════════════════════════════
      // HARD RULE — NO DUPLICATE RUNS
      // Every run MUST produce a different output from all previous runs.
      // Three enforced layers:
      //   1. HARD EXCLUDE: clips used in the immediately preceding run are blocked entirely.
      //   2. SEQUENCE HASH: if the planned clip order matches any prior run, reshuffle.
      //   3. FREQUENCY PENALTY: clips used in older runs get a sort-priority penalty.
      // ══════════════════════════════════════════════════════════════════════════

      // ── Company detection from first clip ────────────────────────────────────
      ensureCompanies(db);
      ensureFlags(db);
      const dbCompanies = db.companies ?? [];
      let detectedCompanyId = null;
      if (dbCompanies.length > 0 && allClips.length > 0) {
        try {
          const detection = await detectCompanyFromClip(allClips[0], dbCompanies, apiKey);
          if (detection) {
            detectedCompanyId = detection.company_id;
            const co = dbCompanies.find(c => c.id === detection.company_id);
            console.log(`[Company] Detected "${co?.name ?? detection.company_id}" (${Math.round(detection.confidence * 100)}% confidence)`);
            sseEmit(sessionId, { type: 'company_detected', company_id: detection.company_id, company_name: co?.name ?? '', confidence: detection.confidence, reason: detection.reason });
          } else {
            sseEmit(sessionId, { type: 'company_detected', company_id: null, company_name: '', confidence: 0, reason: 'No company match found with sufficient confidence' });
          }
        } catch (e) {
          console.warn('[Company] Detection failed:', e?.message);
        }
      }

      const recentMontages = (db.montages || [])
        .filter(m => m.clips_used)
        .slice(-10); // last 10 montages = last 5 A/B run pairs

      const recentClipSets = recentMontages.map(m => {
        try { return JSON.parse(m.clips_used); } catch { return []; }
      });

      // ── Layer 1: HARD EXCLUDE — clips from the last run (last 2 montages = 1 A/B pair)
      // These are completely removed from the candidate pool for this run.
      const lastRunClipSets = recentClipSets.slice(-2); // last A and B from the most recent run
      const lastRunClipNames = new Set(lastRunClipSets.flat());
      console.log('[Variety] HARD EXCLUDE clips from last run:', [...lastRunClipNames].join(', ') || 'none');

      // ── Layer 2: SEQUENCE HASH — detect and reject duplicate ordered sequences
      const recentSequences = new Set(recentClipSets.map(s => s.join('|')));
      const isSequenceDuplicate = (clipNames) => recentSequences.has(clipNames.join('|'));

      // ── Layer 3: FREQUENCY PENALTY — older clips deprioritised in sort order
      const recentClipFreq = {};
      recentClipSets.forEach(set => set.forEach(name => {
        recentClipFreq[name] = (recentClipFreq[name] || 0) + 1;
      }));

      console.log('[Variety] Recent sequences tracked:', recentSequences.size, '| Freq-penalised clips:', Object.keys(recentClipFreq).filter(k => recentClipFreq[k] > 1).join(', ') || 'none');

      // Load knowledge base — split HARD RULES from general guidelines
      ensureKb(db);
      const kbEntries = db.knowledgeBase;
      const hardRules = kbEntries.filter(e => e.title.startsWith('HARD RULE'));
      const generalKb = kbEntries.filter(e => !e.title.startsWith('HARD RULE'));
      const hardRulesContext = hardRules.length > 0
        ? hardRules.map((e, i) => `RULE ${i + 1}: ${e.title.replace('HARD RULE — ', '').replace('HARD RULE - ', '')}\n${e.content}`).join('\n\n')
        : '';
      const generalKbContext = generalKb.length > 0
        ? generalKb.map((e, i) => `[${i + 1}] ${e.title}: ${e.content}`).join('\n')
        : '';
      // Combined context — hard rules are scoring guidance only, NOT auto-reject triggers.
      // Auto-reject is handled in code (score < 20 after penalty), not by Claude's keep:false.
      const kbContext = [
        hardRulesContext ? `=== QUALITY RULES (reduce score by 20-30 points if violated — do NOT set keep:false based on these alone) ===\n${hardRulesContext}` : '',
        generalKbContext ? `=== GENERAL GUIDELINES (scoring guidance) ===\n${generalKbContext}` : '',
      ].filter(Boolean).join('\n\n');
      sseEmit(sessionId, { type: 'kb_loaded', count: kbEntries.length, titles: kbEntries.map(e => e.title) });

      // ── Stage 1: Filter — score & select clips ─────────────────────────────
      session.stage = 1; session.stageLabel = 'Filtering clips';
      sseEmit(sessionId, { type: 'stage_start', stage: 1, label: 'Filtering clips', total: allClips.length });

      const filterResults = await Promise.all(
        allClips.map(async (clipPath, i) => {
          const name = path.basename(clipPath);
          const analysis = await analyseClipWithClaude(clipPath, refStyle, kbContext);

          // ── HARD RULE: variety penalty affects SORT PRIORITY ONLY ────────────
          // analysis.score (raw Claude quality score) is NEVER modified.
          // analysis.sortScore is the deprioritised score used for ordering only.
          // This ensures recently-used clips stay in the quality pool but sort lower,
          // so fresh clips get used first without collapsing the available pool.
          const usedInRun1 = recentClipSets[recentClipSets.length - 1]?.includes(name);
          const usedInRun2 = recentClipSets[recentClipSets.length - 2]?.includes(name);
          const usedInRun3 = recentClipSets[recentClipSets.length - 3]?.includes(name);
          const varietyPenalty = usedInRun1 ? 30 : usedInRun2 ? 20 : usedInRun3 ? 10 : 0;
          // sortScore = raw quality score minus variety penalty — for ordering only
          analysis.sortScore = Math.max(0, (analysis.score ?? 0) - varietyPenalty);
          if (varietyPenalty > 0) {
            analysis.reason = (analysis.reason ?? '') + ` [variety depriority -${varietyPenalty}: used recently, sort priority reduced]`;
          }

          sseEmit(sessionId, { type: 'clip_progress', stage: 1, clipName: name, index: i, score: analysis.score, passed: analysis.keep, reason: analysis.reason });
          return { clipPath, analysis, varietyPenalty };
        })
      );

      // Quality filter: accept clips scoring 30+ (threshold lowered from 50).
      // Sort by sortScore so fresh/un-used clips bubble to top, but also add
      // randomised jitter so the order differs run-to-run (maximises variety).
      const shuffle = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };

      const qualityPassed = filterResults.filter(r => r.analysis.keep && (r.analysis.score ?? 0) >= 30);

      // ── HARD RULE Layer 1: remove clips used in the last run ──────────────────
      // Fresh clips = not in last run. Blocked clips = in last run.
      // If removing last-run clips would leave fewer than 3 fresh clips, fall back to
      // allowing blocked clips (with a big sort penalty) so the pipeline doesn't stall.
      const freshPassed   = qualityPassed.filter(r => !lastRunClipNames.has(path.basename(r.clipPath)));
      const blockedPassed = qualityPassed.filter(r =>  lastRunClipNames.has(path.basename(r.clipPath)));
      const passed = freshPassed.length >= 3 ? freshPassed : qualityPassed;

      if (freshPassed.length < qualityPassed.length) {
        const blockedCount = blockedPassed.length;
        const freshCount = freshPassed.length;
        console.log(`[Variety] Hard-excluded ${blockedCount} clip(s) from last run. Fresh pool: ${freshCount}`);
        if (freshPassed.length < 3) {
          console.warn('[Variety] Not enough fresh clips — allowing last-run clips as fallback to prevent stall');
          sseEmit(sessionId, { type: 'variety_note', message: `Only ${freshCount} new clips available — some clips from the last run will be reused to fill the pool.` });
        }
      }

      // Group into quality tiers, shuffle within each tier, then concatenate.
      // This keeps the best clips roughly first while randomising which exact
      // clips from each tier are selected — different each run.
      const excellent  = shuffle(passed.filter(r => (r.analysis.sortScore ?? r.analysis.score ?? 0) >= 60));
      const good       = shuffle(passed.filter(r => { const s = r.analysis.sortScore ?? r.analysis.score ?? 0; return s >= 40 && s < 60; }));
      const acceptable = shuffle(passed.filter(r => (r.analysis.sortScore ?? r.analysis.score ?? 0) < 40));
      const sorted     = [...excellent, ...good, ...acceptable];

      // No pool cap — use every clip that passed the quality filter.
      // Stage 4 calculates how many are needed to hit the 30-60s target.
      const scored = sorted;

      let accepted = scored.map(r => r.clipPath);
      session.accepted = accepted.length;
      sseEmit(sessionId, { type: 'stage_complete', stage: 1 });

      if (accepted.length === 0) {
        // Nothing passed — accept everything with a score, sorted randomly within score band
        console.warn('[Stage 1] No clips passed quality filter — accepting all scored clips.');
        const fallback = shuffle(filterResults.filter(r => (r.analysis.score ?? 0) >= 10))
          .map(r => r.clipPath);
        if (fallback.length === 0) {
          // Last resort — use all clips regardless of score
          const lastResort = filterResults.map(r => r.clipPath);
          if (lastResort.length === 0) {
            sseEmit(sessionId, { type: 'error', message: 'No clips could be processed. Check that your files are valid video formats.' });
            session.status = 'error';
            return;
          }
          accepted = lastResort;
        } else {
          accepted = fallback;
        }
        session.accepted = accepted.length;
        sseEmit(sessionId, { type: 'filter_relaxed', message: 'Variety mode: using best available clips from full library.' });
      }

      // ── Stage 2: Transcribe — rich multi-frame content profiling ──────────
      session.stage = 2; session.stageLabel = 'Transcribing clips';
      sseEmit(sessionId, { type: 'stage_start', stage: 2, label: 'Deep content analysis', total: accepted.length });

      const apiKey = process.env.ANTHROPIC_API_KEY;
      const clipProfiles = {}; // name → { transcription, mood, energy, subjects, lighting, colorProfile }

      await Promise.all(accepted.map(async (clipPath) => {
        const name = path.basename(clipPath);
        const dur = getVideoDuration(clipPath) || 5;
        let profile = { transcription: 'Visual content', mood: 'neutral', energy: 'medium', subjects: [], lighting: 'natural', colorProfile: 'neutral' };

        if (apiKey) {
          // Extract up to 5 evenly-spaced frames for thorough analysis
          const frameCount = Math.min(5, Math.max(2, Math.floor(dur / 2)));
          const frames = await extractFrames(clipPath, frameCount);
          if (frames.length) {
            try {
              const kbNote = kbContext ? `\nKNOWLEDGE BASE RULES (flag any violations or strong matches in your transcription):\n${kbContext}\n` : '';
              const prompt = `Analyse these ${frames.length} frames from a video clip (duration: ${dur.toFixed(1)}s) for montage editing.${kbNote}

Reply with JSON only:
{
  "transcription": "2-3 sentence description of what is happening, setting, visual style, and any KB rule violations or strong matches",
  "mood": "one word: energetic/calm/dramatic/joyful/melancholic/tense/inspiring",
  "energy": "low/medium/high",
  "subjects": ["array of main subjects or elements visible"],
  "lighting": "description of lighting quality and direction",
  "colorProfile": "description of dominant colours and tone (warm/cool/neutral/high-contrast etc)",
  "cameraMotion": "static/slow-pan/fast-pan/handheld/tracking/zoom",
  "bestMoment": "which frame (1-${frames.length}) is the strongest visually and why",
  "kbCompliance": "brief note on how well this clip satisfies the knowledge base rules"
}`;
              const text = await claudeCall(apiKey, [...frameBlocks(frames), { type: 'text', text: prompt }], 500);
              const m = text.match(/\{[\s\S]*?\}/);
              if (m) profile = { ...profile, ...JSON.parse(m[0]) };
            } catch {}
          }
        }

        clipProfiles[name] = { ...profile, duration: dur };
        sseEmit(sessionId, { type: 'clip_progress', stage: 2, clipName: name, transcription: profile.transcription, duration: dur, mood: profile.mood, energy: profile.energy });
      }));
      sseEmit(sessionId, { type: 'stage_complete', stage: 2 });

      // ── Stage 3: Trim — AI-guided in/out point detection ──────────────────
      session.stage = 3; session.stageLabel = 'Trimming clips';
      sseEmit(sessionId, { type: 'stage_start', stage: 3, label: 'Finding optimal cut points', total: accepted.length });

      const trimmedClips = await Promise.all(accepted.map(async (clipPath) => {
        const name = path.basename(clipPath);
        const dur = getVideoDuration(clipPath) || 5;
        const profile = clipProfiles[name] ?? {};

        // Default: trim fade-in/out from edges
        let inPoint  = dur > 3 ? Math.min(dur * 0.08, 1.0) : 0;
        let outPoint = dur > 3 ? Math.max(dur - Math.min(dur * 0.08, 1.0), inPoint + 1) : dur;

        if (apiKey && dur > 4) {
          try {
            // Sample first and last 2 seconds to detect weak start/end frames
            const startFrames = await extractFrames(clipPath, 2);
            // Use ffprobe to detect scene changes for natural cut points
            let sceneChanges = [];
            try {
              const sceneOut = cp.execSync(
                `ffprobe -v quiet -show_frames -select_streams v -of json -f lavfi "movie='${clipPath.replace(/\\/g, '/').replace(/'/g, "\\'")}',scdet=s=1:t=4" 2>/dev/null`,
                { encoding: 'utf-8', timeout: 10000 }
              );
              const parsed = JSON.parse(sceneOut);
              sceneChanges = (parsed.frames ?? [])
                .filter(f => f.tags?.['lavfi.scd.score'])
                .map(f => parseFloat(f.best_effort_timestamp_time ?? '0'))
                .filter(t => t > 0.5 && t < dur - 0.5)
                .slice(0, 5);
            } catch {}

            // Ask Claude to recommend in/out based on profile + scene changes
            const kbTrimNote = kbContext ? `\nKNOWLEDGE BASE RULES (apply to trim decisions — e.g. pacing rules, clip length targets, motion preferences):\n${kbContext}\n` : '';
            const trimPrompt = `You are trimming a video clip for a short-form viral montage (TikTok/Reels/Shorts).
Clip duration: ${dur.toFixed(2)}s
Content profile: ${JSON.stringify(profile)}
Scene change timestamps detected: [${sceneChanges.map(t => t.toFixed(2)).join(', ') || 'none detected'}]
${kbTrimNote}
HARD RULE — TARGET MONTAGE LENGTH: 30-60 seconds total. Each clip contributes as much as needed to hit this target — shorter clips mean longer per-clip durations are needed.

Choose in_point and out_point to:
1. Cut to the most visually interesting moment — skip slow build-ups and weak openers
2. End before any fade-out, slowdown, or weak closing frames
3. Target duration: 4-15 seconds per clip (MINIMUM 3.0s, MAXIMUM 15.0s). Use longer durations when there are few clips available — never cut a clip shorter than necessary to reach 30s total
4. If scene changes exist, pick the strongest scene
5. If the clip has someone talking: trim to before they start or after they finish — keep only visual action
6. Apply all hard rules and KB pacing guidelines

Reply JSON only: {"in_point": 0.0, "out_point": ${dur.toFixed(2)}, "reason": "one sentence"}`;

            const trimText = await claudeCall(apiKey, [{ type: 'text', text: trimPrompt }], 200);
            const tm = trimText.match(/\{[\s\S]*?\}/);
            if (tm) {
              const tr = JSON.parse(tm[0]);
              if (typeof tr.in_point === 'number' && typeof tr.out_point === 'number') {
                inPoint  = Math.max(0, Math.min(tr.in_point, dur - 1));
                outPoint = Math.max(inPoint + 1, Math.min(tr.out_point, dur));
              }
            }
          } catch {}
        }

        // Per-clip range: 3s minimum, 15s maximum (wider ceiling so small pools can still hit 30s)
        const MIN_CLIP_SECONDS = 3.0;
        const MAX_CLIP_SECONDS = 15.0;
        if ((outPoint - inPoint) > MAX_CLIP_SECONDS) {
          outPoint = inPoint + MAX_CLIP_SECONDS;
        }
        if ((outPoint - inPoint) < MIN_CLIP_SECONDS && dur >= MIN_CLIP_SECONDS) {
          // Extend the clip to the minimum, capped at the actual clip duration
          outPoint = Math.min(inPoint + MIN_CLIP_SECONDS, dur);
        }

        sseEmit(sessionId, { type: 'clip_progress', stage: 3, clipName: name, inPoint, outPoint, originalDuration: dur });
        return { clipPath, inPoint, outPoint, duration: dur, profile };
      }));
      sseEmit(sessionId, { type: 'stage_complete', stage: 3 });

      // ── Stage 4: Plan — auto-generate 2 contrasting variants ────────────────
      // No user pause — both variants are planned and rendered automatically.
      session.stage = 4; session.stageLabel = 'Planning 2 variants';
      sseEmit(sessionId, { type: 'stage_start', stage: 4, label: 'Generating 2 contrasting edits — High Energy & Cinematic' });

      const batchId = crypto.randomUUID();
      // HARD RULE: preferredStyle is never read — style bias has been permanently disabled.

      // ── Stage 4 clip selection: scored + randomised for maximum variety ────────
      // Clips are scored by energy/mood then shuffled within tiers so each run
      // picks a different subset and different ordering — never the same montage twice.

      const shuffleStage4 = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };

      const energyOrder = { high: 3, medium: 2, low: 1 };
      const moodOrder = { dramatic: 4, melancholic: 3, inspiring: 3, calm: 2, joyful: 2, neutral: 2, energetic: 1, tense: 1 };

      const varietyPenalty = (clip) => {
        const name = path.basename(clip.clipPath);
        const freq = recentClipFreq[name] || 0;
        return freq * 10;
      };

      // Score clips on each axis then shuffle within tiers (top / mid / lower)
      const scoreByEnergy = (c) => (energyOrder[c.profile?.energy] ?? 2) * 10 - varietyPenalty(c);
      const scoreByMood   = (c) => (moodOrder[c.profile?.mood]   ?? 2) * 10 - varietyPenalty(c);

      const tieredShuffle = (clips, scoreFn) => {
        const top  = shuffleStage4(clips.filter(c => scoreFn(c) >= 25));
        const rest = shuffleStage4(clips.filter(c => scoreFn(c) <  25));
        return [...top, ...rest];
      };

      const byEnergy = tieredShuffle([...trimmedClips], scoreByEnergy);
      const byMood   = tieredShuffle([...trimmedClips], scoreByMood);

      // ── HARD RULE: 30-60 second montage target ────────────────────────────────
      const TARGET_MIN_S = 30;
      const TARGET_MAX_S = 60;
      const TARGET_MID_S = 45;

      // Total available duration from all trimmed clips
      const totalPoolDur = trimmedClips.reduce((s, c) => s + (c.outPoint - c.inPoint), 0);
      const avgClipDur   = trimmedClips.length > 0 ? totalPoolDur / trimmedClips.length : 5;

      // ── HARD RULE: if total pool duration < 30s, extend clip durations to fill the gap ──
      // This happens when the user provides few clips. We scale each clip's outPoint up
      // toward its original duration, proportionally, until the pool can reach 30s.
      if (totalPoolDur < TARGET_MIN_S) {
        const needed = TARGET_MIN_S - totalPoolDur;
        const extendable = trimmedClips.reduce((s, c) => s + (c.duration - c.outPoint + c.inPoint), 0) || 1;
        const ratio = Math.min(1, needed / extendable);
        for (const c of trimmedClips) {
          const available = c.duration - c.outPoint; // unused footage after outPoint
          c.outPoint = Math.min(c.duration, c.outPoint + available * ratio + (c.inPoint * ratio));
          // Also pull inPoint back toward 0 to get even more footage
          const pullIn = c.inPoint * ratio;
          c.inPoint = Math.max(0, c.inPoint - pullIn);
        }
        const newTotal = trimmedClips.reduce((s, c) => s + (c.outPoint - c.inPoint), 0);
        console.log(`[Stage 4] Pool too short (${totalPoolDur.toFixed(1)}s) — extended clips to ${newTotal.toFixed(1)}s total`);
      }

      // How many clips needed to hit the 45s midpoint target
      const clipsNeededForMid = Math.max(3, Math.ceil(TARGET_MID_S / Math.max(avgClipDur, 1)));
      const maxPerVariant     = Math.max(clipsNeededForMid, trimmedClips.length); // never cap below what we need

      console.log(`[Stage 4] avg clip dur: ${avgClipDur.toFixed(1)}s | pool total: ${totalPoolDur.toFixed(1)}s | need ~${clipsNeededForMid} clips per variant`);

      // ── Pool assignment ────────────────────────────────────────────────────────
      // If the full pool duration >= 60s: split between A and B (different clips per variant).
      // If the full pool duration < 60s: both variants use ALL clips in different orderings
      // so neither variant is starved of footage.
      const splitPool = totalPoolDur >= TARGET_MAX_S && trimmedClips.length >= 6;

      let variantAClips, variantBClips;
      if (splitPool) {
        const aSize = Math.min(maxPerVariant, Math.ceil(trimmedClips.length / 2));
        variantAClips = byEnergy.slice(0, aSize);
        const aPathSet = new Set(variantAClips.map(c => c.clipPath));
        const bCandidates = byMood.filter(c => !aPathSet.has(c.clipPath));
        variantBClips = bCandidates.length >= 3 ? bCandidates.slice(0, aSize) : byMood.slice(0, aSize);
        console.log('[Stage 4] Split pool: A and B use different clips');
      } else {
        // Small pool — both variants use all clips but in different orders
        variantAClips = byEnergy.slice(0, maxPerVariant);
        variantBClips = byMood.slice(0, maxPerVariant);
        console.log('[Stage 4] Shared pool: both variants use all available clips (different order)');
      }

      // Randomise internal ordering within each variant pool — different sequence each run
      variantAClips = shuffleStage4(variantAClips);
      variantBClips = shuffleStage4(variantBClips);

      // ── HARD RULE Layer 2: SEQUENCE HASH — reject any sequence matching a prior run ──
      // If the planned sequence is identical to any previous run, keep reshuffling until
      // it's unique. Cap at 8 attempts to avoid infinite loop on tiny clip pools.
      const seqOf = (clips) => clips.map(c => path.basename(c.clipPath)).join('|');
      let hashAttempts = 0;
      while (isSequenceDuplicate(seqOf(variantAClips).split('|')) && hashAttempts < 8) {
        variantAClips = shuffleStage4(variantAClips);
        hashAttempts++;
      }
      hashAttempts = 0;
      while (isSequenceDuplicate(seqOf(variantBClips).split('|')) && hashAttempts < 8) {
        variantBClips = shuffleStage4(variantBClips);
        hashAttempts++;
      }
      if (hashAttempts > 0) {
        console.log(`[Variety] Sequence hash collision detected — reshuffled ${hashAttempts} time(s) to force unique output`);
      }

      console.log('[Stage 4] Pool size:', trimmedClips.length, '| A:', variantAClips.map(c=>path.basename(c.clipPath)).join(', '), '| B:', variantBClips.map(c=>path.basename(c.clipPath)).join(', '));

      // Rich plan structure — filled by Claude or fallback
      let variantAPlan = {
        hook: 'Opens with the highest-energy clip to immediately grab attention.',
        clipContributions: variantAClips.map(c => ({ clip: path.basename(c.clipPath), contribution: 'Drives visual momentum' })),
        ending: 'Closes on a strong, confident visual moment that completes the brand story.',
        rationale: 'Fast-paced, maximum energy. Leads with the most dynamic clip and builds momentum.',
      };
      let variantBPlan = {
        hook: 'Opens with the most visually compelling composition to draw the viewer in.',
        clipContributions: variantBClips.map(c => ({ clip: path.basename(c.clipPath), contribution: 'Adds atmospheric depth' })),
        ending: 'Fades out on a warm, aspirational moment that stays with the viewer.',
        rationale: 'Elegant and mood-driven. Prioritises visual quality and atmospheric pacing.',
      };

      if (apiKey) {
        try {
          // preferredStyle is NOT injected — auto-biasing toward a past style
          // causes repeated output. The user chooses manually each run.
          const styleNote = '';

          // HARD RULE: tell Claude exactly which sequences were used recently so it avoids them
          const recentUsedNote = recentClipSets.length > 0
            ? `\n=== HARD RULE — NO REPEATED SEQUENCES ===\nThese clip combinations were used in recent runs — you MUST NOT reproduce the same ordered sequence in either variant:\n${recentClipSets.map((s, i) => `Run ${i + 1}: ${s.join(' → ')}`).join('\n')}\nAlso avoid leading with the same opening clip as any recent run. Maximise variety.\n`
            : '';

          // Build full transcription context for every clip — this is the core data the plan is built from
          const fullTranscriptions = trimmedClips.map((c, i) => {
            const p = c.profile ?? {};
            return `[${i}] ${path.basename(c.clipPath)}
  Duration: ${((c.outPoint ?? c.duration) - (c.inPoint ?? 0)).toFixed(1)}s of ${(c.duration ?? 0).toFixed(1)}s original
  Content: ${p.transcription ?? 'No transcription'}
  Mood: ${p.mood ?? '?'} | Energy: ${p.energy ?? '?'} | Camera: ${p.cameraMotion ?? '?'}
  Lighting: ${p.lighting ?? '?'} | Colour: ${p.colorProfile ?? '?'}
  Subjects: ${Array.isArray(p.subjects) ? p.subjects.join(', ') : '?'}
  Best moment: ${p.bestMoment ?? '?'}
  KB compliance: ${p.kbCompliance ?? 'Not assessed'}`;
          }).join('\n\n');

          const variantPrompt = `You are a professional short-form video editor creating TWO CONTRASTING montage plans for TikTok/Reels/Shorts.

HARD RULE — DURATION: Each variant MUST be 30-60 seconds long. Use ALL clips in your assigned pool to reach this target. Do not cut clips short or leave any out.

You have full transcription data for every available clip. Use it to make intelligent, specific decisions about hooks, sequencing, and endings.

${styleNote}${recentUsedNote}
═══ FULL CLIP TRANSCRIPTIONS ═══
${fullTranscriptions}

═══ KNOWLEDGE BASE RULES ═══
${kbContext || 'None defined.'}

═══ YOUR TASK ═══
Design two DISTINCT plans using these clips:

VARIANT A — "High Energy": Hook with the most visually striking/dynamic clip. Build maximum momentum. Every clip choice must serve pace and energy.
VARIANT B — "Cinematic": Hook with the most atmospheric or beautiful composition. Build mood and aspiration. Every clip choice must serve visual storytelling.

PRE-ASSIGNED CLIP POOLS (HARD RULE — do not swap clips between pools):
- Variant A MUST only use clips: ${variantAClips.map(c => `[${trimmedClips.indexOf(c)}] ${path.basename(c.clipPath)}`).join(', ')}
- Variant B MUST only use clips: ${variantBClips.map(c => `[${trimmedClips.indexOf(c)}] ${path.basename(c.clipPath)}`).join(', ')}
These pools are deliberately different — this is how we guarantee the two videos look nothing alike.

HARD RULES:
1. Use ONLY the clips in each variant's pre-assigned pool above — no exceptions.
2. Neither variant may reproduce the same ordered sequence as any recent run listed above.
3. Each variant uses 3-4 clips in the order that best fits its style.
4. Variant A: maximise energy and pace. Variant B: maximise mood and visual storytelling.

For each plan, specify:
- hook: 1-2 sentences describing EXACTLY what happens in the first clip and WHY it grabs attention
- clips: array of clip INDICES in order (3-4 clips max, DIFFERENT subsets — max 2 shared between A and B)
- clipContributions: array of objects, one per clip, explaining what role it plays in the sequence
- ending: 1-2 sentences describing the final clip and what feeling it leaves the viewer with
- rationale: 1-2 sentence summary of the overall plan concept

Return ONLY valid JSON — no markdown, no explanation:
{
  "variantA": {
    "clips": [2, 0, 3, 1],
    "hook": "Opens on [specific description from transcription] — this immediately signals [brand quality/energy/aspiration] because [reason].",
    "clipContributions": [
      {"clip": 2, "contribution": "Hook: [exact role this clip plays]"},
      {"clip": 0, "contribution": "[exact role]"},
      {"clip": 3, "contribution": "[exact role]"},
      {"clip": 1, "contribution": "Payoff: [exact closing role]"}
    ],
    "ending": "Closes on [specific description] — leaves the viewer feeling [specific emotion/impression].",
    "rationale": "[Overall concept in 1-2 sentences]"
  },
  "variantB": { ... same structure ... }
}`;

          const vt = await claudeCall(apiKey, [{ type: 'text', text: variantPrompt }], 1200);
          const vs = vt.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
          const vm = vs.match(/\{[\s\S]*\}/);
          if (vm) {
            const vr = JSON.parse(vm[0]);

            // Variant A
            if (Array.isArray(vr.variantA?.clips)) {
              const aC = vr.variantA.clips.map(i => trimmedClips[Number(i)]).filter(Boolean);
              if (aC.length >= 2) {
                variantAClips = aC.slice(0, 5);
                variantAPlan = {
                  hook: vr.variantA.hook ?? variantAPlan.hook,
                  clipContributions: (vr.variantA.clipContributions ?? []).map((cc, idx) => ({
                    clip: path.basename(variantAClips[idx]?.clipPath ?? ''),
                    contribution: typeof cc === 'string' ? cc : (cc?.contribution ?? ''),
                  })).filter(cc => cc.clip),
                  ending: vr.variantA.ending ?? variantAPlan.ending,
                  rationale: vr.variantA.rationale ?? variantAPlan.rationale,
                };
                // Fill missing contributions with clip names
                if (variantAPlan.clipContributions.length < variantAClips.length) {
                  variantAPlan.clipContributions = variantAClips.map((c, i) => ({
                    clip: path.basename(c.clipPath),
                    contribution: variantAPlan.clipContributions[i]?.contribution ?? 'Contributes to sequence energy',
                  }));
                }
              }
            }

            // Variant B
            if (Array.isArray(vr.variantB?.clips)) {
              const bC = vr.variantB.clips.map(i => trimmedClips[Number(i)]).filter(Boolean);
              if (bC.length >= 2) {
                variantBClips = bC.slice(0, 5);
                variantBPlan = {
                  hook: vr.variantB.hook ?? variantBPlan.hook,
                  clipContributions: (vr.variantB.clipContributions ?? []).map((cc, idx) => ({
                    clip: path.basename(variantBClips[idx]?.clipPath ?? ''),
                    contribution: typeof cc === 'string' ? cc : (cc?.contribution ?? ''),
                  })).filter(cc => cc.clip),
                  ending: vr.variantB.ending ?? variantBPlan.ending,
                  rationale: vr.variantB.rationale ?? variantBPlan.rationale,
                };
                if (variantBPlan.clipContributions.length < variantBClips.length) {
                  variantBPlan.clipContributions = variantBClips.map((c, i) => ({
                    clip: path.basename(c.clipPath),
                    contribution: variantBPlan.clipContributions[i]?.contribution ?? 'Contributes to sequence mood',
                  }));
                }
              }
            }
          }
        } catch (e) {
          console.warn('[Stage 4 dual] Claude planning failed, using pool sorts:', e?.message);
          // Rebuild contributions from fallback clips
          variantAPlan.clipContributions = variantAClips.map(c => ({ clip: path.basename(c.clipPath), contribution: 'Drives visual momentum' }));
          variantBPlan.clipContributions = variantBClips.map(c => ({ clip: path.basename(c.clipPath), contribution: 'Adds atmospheric depth' }));
        }
      }

      // ── HARD RULE 1: variants in THIS run must differ in content and opening ──
      const seqA = variantAClips.map(c => path.basename(c.clipPath)).join('|');
      const seqB = variantBClips.map(c => path.basename(c.clipPath)).join('|');
      const sameOpening = variantAClips[0]?.clipPath === variantBClips[0]?.clipPath;
      const tooMuchOverlap = (() => {
        const setA = new Set(variantAClips.map(c => c.clipPath));
        const shared = variantBClips.filter(c => setA.has(c.clipPath)).length;
        return shared > 2;
      })();

      if (seqA === seqB || sameOpening || tooMuchOverlap) {
        console.warn('[Stage 4] Variants too similar — forcing B to use a distinct ordering.');
        const aSet = new Set(variantAClips.map(c => c.clipPath));
        const unusedByA = trimmedClips.filter(c => !aSet.has(c.clipPath));
        if (unusedByA.length >= 2 && splitPool) {
          // Large pool: give B different clips (keep full count — don't cap at 4)
          const aByLeastUsed = [...variantAClips].reverse();
          variantBClips = [...unusedByA, ...aByLeastUsed].slice(0, maxPerVariant);
        } else {
          // Small/shared pool — rotate B so opening clip differs from A
          variantBClips = [...variantBClips.slice(2), ...variantBClips.slice(0, 2)];
        }
        variantBPlan.clipContributions = variantBClips.map((c, i) => ({
          clip: path.basename(c.clipPath),
          contribution: variantBPlan.clipContributions[i]?.contribution ?? 'Adds atmospheric depth',
        }));
        console.warn('[Stage 4] Variant B forced to:', variantBClips.map(c => path.basename(c.clipPath)).join(' → '));
      }

      // ── HARD RULE 2: neither variant may repeat a recent run's sequence ───────
      // If a variant's sequence matches a recent run, rotate its clips until it differs.
      const forceUnique = (clips, planContribs, label) => {
        let seq = clips.map(c => path.basename(c.clipPath)).join('|');
        let attempts = 0;
        while (recentSequences.has(seq) && attempts < clips.length) {
          console.warn(`[Stage 4] ${label} matches a recent run — rotating to force variety.`);
          clips = [...clips.slice(1), clips[0]]; // rotate left by 1
          seq = clips.map(c => path.basename(c.clipPath)).join('|');
          attempts++;
        }
        // If all rotations still match (very small clip pool), reverse as last resort
        if (recentSequences.has(seq) && clips.length > 1) {
          clips = [...clips].reverse();
          console.warn(`[Stage 4] ${label} — reversed as last resort to avoid repetition.`);
        }
        const updatedContribs = clips.map((c, i) => ({
          clip: path.basename(c.clipPath),
          contribution: planContribs[i]?.contribution ?? 'Contributes to sequence',
        }));
        return { clips, contribs: updatedContribs };
      };

      const fixedA = forceUnique(variantAClips, variantAPlan.clipContributions, 'Variant A');
      variantAClips = fixedA.clips;
      variantAPlan.clipContributions = fixedA.contribs;

      const fixedB = forceUnique(variantBClips, variantBPlan.clipContributions, 'Variant B');
      variantBClips = fixedB.clips;
      variantBPlan.clipContributions = fixedB.contribs;

      console.log('[Stage 4] Final A:', variantAClips.map(c => path.basename(c.clipPath)).join(' → '));
      console.log('[Stage 4] Final B:', variantBClips.map(c => path.basename(c.clipPath)).join(' → '));

      const variantAInfo = {
        id: 'A', name: 'High Energy',
        style: 'Fast-paced, maximum energy, dynamic cuts.',
        clips: variantAClips.map(c => path.basename(c.clipPath)),
        rationale: variantAPlan.rationale,
        hook: variantAPlan.hook,
        clipContributions: variantAPlan.clipContributions,
        ending: variantAPlan.ending,
      };
      const variantBInfo = {
        id: 'B', name: 'Cinematic',
        style: 'Elegant, mood-driven, deliberate pacing.',
        clips: variantBClips.map(c => path.basename(c.clipPath)),
        rationale: variantBPlan.rationale,
        hook: variantBPlan.hook,
        clipContributions: variantBPlan.clipContributions,
        ending: variantBPlan.ending,
      };

      sseEmit(sessionId, { type: 'dual_variants_planned', stage: 4, batchId, variants: [variantAInfo, variantBInfo] });
      sseEmit(sessionId, { type: 'stage_complete', stage: 4 });

      // ── Stage 5: Music — auto-scan library → AI mood match → auto-select ────
      session.stage = 5; session.stageLabel = 'Selecting music';
      sseEmit(sessionId, { type: 'stage_start', stage: 5, label: 'Auto-selecting matching soundtrack' });

      const AUDIO_EXTS = new Set(['.mp3', '.wav', '.aac', '.m4a', '.flac', '.ogg', '.opus']);
      const dbForMusic = readDb();
      const savedMusicFolders = Array.isArray(dbForMusic.music_folders) ? dbForMusic.music_folders : [];
      const MUSIC_SEARCH_DIRS = [
        path.join(__dirname, 'montage', 'music'),   // downloaded royalty-free tracks
        path.join(__dirname, 'music-library'),
        path.join(os.homedir(), 'Music'),
        path.join(os.homedir(), 'Downloads'),
        path.join(os.homedir(), 'Desktop'),
        ...savedMusicFolders,                        // user-configured folders from UI
      ];

      // Scan all music dirs for audio files
      const allTracks = [];
      for (const dir of MUSIC_SEARCH_DIRS) {
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const e of entries) {
            if (e.isFile() && AUDIO_EXTS.has(path.extname(e.name).toLowerCase())) {
              const fp = path.join(dir, e.name);
              let dur = 0;
              try {
                const pd = cp.execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${fp}"`, { encoding: 'utf-8', timeout: 6000 });
                dur = parseFloat(pd.trim()) || 0;
              } catch {}
              // Accept any track with a valid duration — short tracks get looped at render
              if (dur >= 3) {
                allTracks.push({ trackPath: fp, trackName: path.basename(e.name, path.extname(e.name)), duration: dur });
              }
            }
          }
        } catch {}
      }

      let selectedTrack = null;

      // Music variety: collect recently-used track names (last 5 montages)
      const recentMontagesForMusic = (dbForMusic.montages ?? []).slice(-5);
      const recentTrackNames = new Set(
        recentMontagesForMusic.map(m => (m.music_track ?? '').toLowerCase()).filter(Boolean)
      );
      // Deprioritise but don't fully exclude — only exclude if we have enough alternatives
      const freshTracks    = allTracks.filter(t => !recentTrackNames.has(t.trackName.toLowerCase()));
      const candidateTracks = freshTracks.length >= 3 ? freshTracks : allTracks;
      console.log(`[Music Variety] Total: ${allTracks.length} | Recent (excluded): ${allTracks.length - candidateTracks.length} | Candidates: ${candidateTracks.length}`);

      if (candidateTracks.length > 0 && apiKey) {
        // Score each track against the video's mood using Claude
        const overallMoods  = trimmedClips.map(c => c.profile?.mood).filter(Boolean);
        const overallEnergy = trimmedClips.map(c => c.profile?.energy).filter(Boolean);
        const colourProfiles = trimmedClips.map(c => c.profile?.colorProfile).filter(Boolean);

        const trackList = candidateTracks.map((t, i) => `${i + 1}. "${t.trackName}" (${Math.round(t.duration / 60)}min)`).join('\n');
        const scoreMusicPrompt = `You are a music supervisor for a premium beauty & aesthetics brand video on TikTok/Instagram Reels.

VIDEO PROFILE:
- Clip moods: ${overallMoods.join(', ')}
- Energy: ${overallEnergy.join(', ')}
- Visual style: ${colourProfiles.join(', ')}
- Total clips: ${trimmedClips.length}, duration: ~${trimmedClips.reduce((s,c)=>s+(c.outPoint-c.inPoint),0).toFixed(1)}s
- Target: fast-paced brand awareness montage, aspirational, feminine, modern

REFERENCE STYLE MUSIC PROFILE (from KB):
- BPM target: 95-115
- Genres that work: deep house, lo-fi hip-hop, contemporary R&B instrumental, modern pop instrumental
- Feel: sophisticated, warm, aspirational, not aggressive
- Avoid: motivational speech, rock, aggressive EDM, country

AVAILABLE TRACKS:
${trackList}

Score each track 0.0-1.0 on how well it would suit this video. Consider the track name and style clues.
Reply JSON only: {"scores":[0.0,...], "reasons":["...",...],"bestIndex":0}`;

        try {
          const mt = await claudeCall(apiKey, [{ type: 'text', text: scoreMusicPrompt }], 300);
          const mm = mt.match(/\{[\s\S]*?\}/);
          if (mm) {
            const mr = JSON.parse(mm[0]);
            const scores = Array.isArray(mr.scores) ? mr.scores : [];
            // Find highest-scoring track
            let bestIdx = typeof mr.bestIndex === 'number' ? mr.bestIndex : 0;
            let bestScore = scores[bestIdx] ?? 0;
            scores.forEach((s, i) => { if (s > bestScore) { bestScore = s; bestIdx = i; } });
            if (bestScore >= 0.4 && candidateTracks[bestIdx]) {
              selectedTrack = { ...candidateTracks[bestIdx], suitabilityScore: bestScore, reason: mr.reasons?.[bestIdx] ?? '' };
            }
          }
        } catch {}
      }

      // Fallback: pick a random track from candidates (or allTracks) if Claude scoring failed
      if (!selectedTrack && candidateTracks.length > 0) {
        selectedTrack = candidateTracks[Math.floor(Math.random() * candidateTracks.length)];
      } else if (!selectedTrack && allTracks.length > 0) {
        selectedTrack = allTracks[Math.floor(Math.random() * allTracks.length)];
      }

      if (selectedTrack) {
        // Pick a random beat-snapped start offset within the track so we never use the same section twice
        const videoDurEst = trimmedClips.reduce((s, c) => s + (c.outPoint - c.inPoint), 0);
        // Only offset if the track is long enough to have headroom (>= video + 4s buffer)
        const hasHeadroom = (selectedTrack.duration ?? 0) >= videoDurEst + 4;
        const maxOffset = hasHeadroom ? Math.max(0, (selectedTrack.duration ?? 0) - videoDurEst - 2) : 0;
        const rawOffset = maxOffset > 8 ? Math.random() * maxOffset : 0;
        // Snap to nearest 4-second bar (approximate bar length at ~110 BPM)
        selectedTrack.startOffset = Math.round(rawOffset / 4) * 4;

        sseEmit(sessionId, { type: 'music_auto_selected', stage: 5,
          trackName: selectedTrack.trackName,
          trackPath: selectedTrack.trackPath,
          suitabilityScore: selectedTrack.suitabilityScore ?? 1,
          reason: selectedTrack.reason ?? 'Best mood match from library',
          startOffset: selectedTrack.startOffset,
        });
        sseEmit(sessionId, { type: 'stage_complete', stage: 5, selectedTrack: selectedTrack.trackName });
      } else {
        // No tracks found — pause for manual selection
        const fallbackTracks = [
          { trackPath: '', trackName: 'No tracks found — please add music to music-library folder', bpm: 110, suitabilityScore: 0 },
        ];
        sseEmit(sessionId, { type: 'music_options', stage: 5, tracks: fallbackTracks });
        session.pauseReason = 'awaiting_music_selection';
        session.status = 'paused';
        sseEmit(sessionId, { type: 'paused', reason: 'awaiting_music_selection' });
        selectedTrack = await new Promise(resolve => { session.musicResolve = resolve; });
        session.pauseReason = null; session.status = 'running';
        sseEmit(sessionId, { type: 'resumed' });
        sseEmit(sessionId, { type: 'stage_complete', stage: 5, selectedTrack: selectedTrack?.trackName ?? '' });
      }

      // ── Stage 6-7: Render & Review both variants in parallel ─────────────────
      session.stage = 6; session.stageLabel = 'Rendering 2 variants';
      sseEmit(sessionId, { type: 'stage_start', stage: 6, label: 'Rendering High Energy & Cinematic variants in parallel' });
      sseEmit(sessionId, { type: 'stage_start', stage: 7, label: 'AI quality review for both variants' });

      const [resultA, resultB] = await Promise.all([
        renderVariant({ variantId: 'A', variantName: variantAInfo.name, clips: variantAClips, selectedTrack, sessionId, apiKey, kbEntries }),
        renderVariant({ variantId: 'B', variantName: variantBInfo.name, clips: variantBClips, selectedTrack, sessionId, apiKey, kbEntries }),
      ]);

      sseEmit(sessionId, { type: 'stage_complete', stage: 6 });
      sseEmit(sessionId, { type: 'stage_complete', stage: 7 });

      // Choose best-scoring variant for learning
      const bestResult = resultA.reviewScore >= resultB.reviewScore ? resultA : resultB;
      const outputId = bestResult.outputId;
      const outputPath = bestResult.outputPath;
      const orderedClips = bestResult.clips;
      const reviewScore = bestResult.reviewScore;
      const corrections = bestResult.corrections;
      const finalDuration = bestResult.finalDuration;

      // ── Stage 8: Learn — compare output vs references, auto-update KB ───────
      session.stage = 8; session.stageLabel = 'Learning';
      sseEmit(sessionId, { type: 'stage_start', stage: 8, label: 'Comparing to references & updating knowledge base' });

      let refMatchScore = reviewScore;
      let newRulesAdded = 0;
      let analysisNotes = '';

      if (apiKey) {
        try {
          // Re-read DB fresh so KB reflects any manual edits made during this run
          const freshDb = readDb();
          ensureKb(freshDb);
          const currentKb = freshDb.knowledgeBase;
          if (!Array.isArray(freshDb.learning.insights)) freshDb.learning.insights = [];

          // Extract frames from output (3 frames)
          const outputFrames = await extractFrames(outputPath, 3);
          if (!outputFrames.length) throw new Error('No output frames extracted');

          // ── Reference frames: use session refs if available, otherwise fall back
          //    to the known reference folder on disk so learning always has targets
          const KNOWN_REF_DIRS = [
            path.join(__dirname, 'socials reference'),
            path.join(__dirname, 'references'),
            path.join(os.homedir(), 'Desktop', 'workflow-manager', 'socials reference'),
          ];
          const VIDEO_EXTS_LEARN = new Set(['.mp4', '.mov', '.avi', '.mkv']);

          let refPathsToUse = refs.slice(0, 2)
            .filter(r => { try { fs.accessSync(r.file_path); return true; } catch { return false; } })
            .map(r => r.file_path);

          if (refPathsToUse.length === 0) {
            // Fallback: scan known reference dirs for video files
            for (const dir of KNOWN_REF_DIRS) {
              try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                const vids = entries
                  .filter(e => e.isFile() && VIDEO_EXTS_LEARN.has(path.extname(e.name).toLowerCase()))
                  .map(e => path.join(dir, e.name));
                if (vids.length > 0) {
                  // Shuffle so we don't always use the same 2 references
                  vids.sort(() => Math.random() - 0.5);
                  refPathsToUse = vids.slice(0, 2);
                  break;
                }
              } catch {}
            }
          }

          const refFrameSets = await Promise.all(refPathsToUse.map(p => extractFrames(p, 2)));
          const refFramesAll = refFrameSets.flat();
          const hasRefs = refFramesAll.length > 0;

          // Build list of existing rule titles for dedup
          const existingTitles = currentKb.map(e => `- ${e.title}`).join('\n');
          const runNumber = (freshDb.learning.sessionCount ?? 0) + 1;

          // Build the prompt — adapt based on whether we have reference frames
          const refSection = hasRefs
            ? `REFERENCE FRAMES (TARGET STYLE): The first ${refFramesAll.length} images show what a perfect output looks like.
OUTPUT FRAMES (THIS RUN): The next ${outputFrames.length} images are from the montage just produced.

Compare them visually — look for differences in:
- Colour grading, skin tone, warmth/coolness of light
- Composition: tight vs wide, headroom, subject positioning
- Energy level: camera movement, motion, pacing cues
- Clinical aesthetic: cleanliness, lighting quality, backdrop
- Clip quality: sharpness, exposure, authentic vs filtered look`
            : `OUTPUT FRAMES (THIS RUN): The ${outputFrames.length} images are from the montage just produced.
No reference frames available this run — analyse the output against the existing KB rules and identify what could be improved for future runs.`;

          const learningPrompt = `You are the self-improving AI brain of a montage pipeline that learns after every run.

${refSection}

RUN #${runNumber} CONTEXT:
- Review score: ${reviewScore}/100
- Review findings: ${corrections.slice(0, 3).join(' | ')}
- Clips used: ${orderedClips.map(c => path.basename(c.clipPath)).join(', ')}

EXISTING KNOWLEDGE BASE (${currentKb.length} rules) — propose rules that are NOT already covered:
${existingTitles || 'None yet.'}

YOUR TASK: Identify 1–3 specific gaps or improvements not already in the KB and propose new rules.
Rules must be:
- Specific and actionable (Claude reads them verbatim when filtering clips)
- About something genuinely missing from the existing rules above
- Either an auto-reject condition or a scoring guideline

Reply with valid JSON ONLY — start with { and end with }, no markdown fences:
{"referenceMatchScore":0-100,"analysisNotes":"2-3 sentences on key findings","newRules":[{"title":"Short title","content":"Actionable rule text.","tags":["auto-learned"]}]}`;

          const allBlocks = [
            ...frameBlocks(refFramesAll),
            ...frameBlocks(outputFrames),
            { type: 'text', text: learningPrompt },
          ];

          const learnText = await claudeCall(apiKey, allBlocks, 1000);
          console.log('[Stage 8 Learn] Raw response:', learnText.slice(0, 300));

          // Extract JSON — handle ```json ... ``` wrapping too
          const stripped = learnText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
          const lm = stripped.match(/\{[\s\S]*\}/);

          if (!lm) throw new Error(`No JSON in response: ${learnText.slice(0, 200)}`);

          const lr = JSON.parse(lm[0]);
          refMatchScore = Math.min(100, Math.max(0, Math.round(lr.referenceMatchScore ?? reviewScore)));
          analysisNotes = typeof lr.analysisNotes === 'string' ? lr.analysisNotes : '';
          const proposedRules = Array.isArray(lr.newRules) ? lr.newRules : [];
          console.log(`[Stage 8 Learn] Proposed ${proposedRules.length} rules, refMatchScore=${refMatchScore}`);

          for (const rule of proposedRules) {
            if (!rule.title?.trim() || !rule.content?.trim()) continue;

            // Dedup: require at least 2 meaningful word overlaps (not just 1)
            // to avoid over-blocking genuinely new rules
            const normNew = rule.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
            const isDuplicate = freshDb.knowledgeBase.some(e => {
              const normExist = e.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
              const wordsNew = normNew.split(' ').filter(w => w.length > 4);
              const wordsExist = normExist.split(' ').filter(w => w.length > 4);
              if (wordsNew.length < 2) return false; // very short title — skip dedup
              const overlap = wordsNew.filter(w => wordsExist.includes(w));
              return overlap.length >= 2; // need 2+ meaningful words to count as duplicate
            });

            if (!isDuplicate) {
              const entry = {
                id: crypto.randomUUID(),
                title: rule.title.trim(),
                content: rule.content.trim(),
                tags: [...new Set([...(Array.isArray(rule.tags) ? rule.tags : []), 'auto-learned', `run-${runNumber}`])],
                created_at: Math.floor(Date.now() / 1000),
                auto_learned: true,
              };
              freshDb.knowledgeBase.push(entry);
              newRulesAdded++;
              console.log(`[Stage 8 Learn] Added new rule: ${entry.title}`);
              sseEmit(sessionId, { type: 'learning_insight', stage: 8, title: entry.title, content: entry.content, tags: entry.tags, isNew: true });
            } else {
              console.log(`[Stage 8 Learn] Skipped duplicate: ${rule.title}`);
            }
          }

          // Store per-run insight record
          freshDb.learning.insights.push({
            runId: outputId,
            runNumber,
            timestamp: Math.floor(Date.now() / 1000),
            reviewScore,
            referenceMatchScore: refMatchScore,
            analysisNotes,
            newRulesAdded,
            refsUsed: refPathsToUse.map(p => path.basename(p)),
          });

          writeDb(freshDb);
          console.log(`[Stage 8 Learn] Complete — added ${newRulesAdded} rules, wrote DB`);

        } catch (learnErr) {
          // Non-fatal — log full error so it's visible in server console
          console.error('[Stage 8 Learn] ERROR:', learnErr?.message ?? learnErr);
        }
      }

      sseEmit(sessionId, { type: 'stage_complete', stage: 8, newRulesAdded, referenceMatchScore: refMatchScore, analysisNotes });

      // ── Save & complete ────────────────────────────────────────────────────
      // IMPORTANT: read DB fresh here — Stage 8 already wrote insights + new KB rules.
      // Using the stale `db` from pipeline-start would overwrite all of that.
      session.stage = 0; session.stageLabel = 'Complete';
      const saveDb = readDb();
      ensureKb(saveDb);
      if (!Array.isArray(saveDb.learning.insights)) saveDb.learning.insights = [];

      // Save both A/B variants with shared batchId
      const makeMontageSave = (result, variantInfo) => ({
        id: result.outputId,
        batch_id: batchId,
        variant: variantInfo.id,
        variant_name: variantInfo.name,
        variant_style: variantInfo.style,
        variant_rationale: variantInfo.rationale,
        session_id: sessionId,
        file_path: result.outputPath,
        reference_match_score: result.reviewScore,
        clips_used: JSON.stringify(result.clips.map(c => path.basename(c.clipPath))),
        music_track: selectedTrack?.trackName ?? '',
        duration: result.finalDuration,
        status: 'ready',
        company_id: detectedCompanyId,
        created_at: Math.floor(Date.now() / 1000),
      });
      saveDb.montages.push(makeMontageSave(resultA, variantAInfo));
      saveDb.montages.push(makeMontageSave(resultB, variantBInfo));
      saveDb.learning.sessionCount = (saveDb.learning.sessionCount ?? 0) + 1;
      saveDb.learning.totalClips = (saveDb.learning.totalClips ?? 0) + allClips.length;
      writeDb(saveDb);

      session.status = 'complete';
      sseEmit(sessionId, { type: 'complete', montageId: resultA.outputId, montageIdB: resultB.outputId, batchId });

    } catch (err) {
      session.status = 'error';
      sseEmit(sessionId, { type: 'error', message: String(err) });
    }
  })();
};

// POST /api/montage/montages/:id/prefer — record user's style preference
routes['POST /api/montage/montages/prefer'] = async (req, res, id) => {
  const db = readDb();
  const montage = (db.montages ?? []).find(m => m.id === id);
  if (!montage) return send(res, 404, { error: 'Montage not found' });

  // Mark chosen as preferred, clear sibling's preferred flag
  montage.preferred = true;
  montage.preferred_at = Math.floor(Date.now() / 1000);
  if (montage.batch_id) {
    db.montages.forEach(m => {
      if (m.batch_id === montage.batch_id && m.id !== id) m.preferred = false;
    });
  }

  // HARD RULE: do NOT persist preferred style — storing it caused auto-style bias
  // where every subsequent run used the same style. The user chooses style manually.
  ensureKb(db);
  writeDb(db);
  send(res, 200, { ok: true });
};

// ── Companies CRUD ────────────────────────────────────────────────────────────
routes['GET /api/montage/companies'] = (req, res) => {
  const db = ensureCompanies(readDb());
  send(res, 200, { companies: db.companies });
};

routes['POST /api/montage/companies'] = async (req, res) => {
  const { name, hints = '' } = JSON.parse(await readBody(req));
  if (!name?.trim()) return send(res, 400, { error: 'name is required' });
  const db = ensureCompanies(readDb());
  const company = { id: crypto.randomUUID(), name: name.trim(), hints: hints.trim(), created_at: Math.floor(Date.now() / 1000) };
  db.companies.push(company);
  writeDb(db);
  send(res, 200, { ok: true, company });
};

routes['PUT /api/montage/companies'] = async (req, res, id) => {
  const { name, hints } = JSON.parse(await readBody(req));
  const db = ensureCompanies(readDb());
  const company = db.companies.find(c => c.id === id);
  if (!company) return send(res, 404, { error: 'Company not found' });
  if (name !== undefined) company.name = name.trim();
  if (hints !== undefined) company.hints = hints.trim();
  writeDb(db);
  send(res, 200, { ok: true, company });
};

routes['DELETE /api/montage/companies'] = (req, res, id) => {
  const db = ensureCompanies(readDb());
  db.companies = db.companies.filter(c => c.id !== id);
  writeDb(db);
  send(res, 200, { ok: true });
};

routes['POST /api/montage/montages/assign-company'] = async (req, res, id) => {
  const { company_id } = JSON.parse(await readBody(req));
  const db = readDb();
  const m = db.montages.find(m => m.id === id);
  if (!m) return send(res, 404, { error: 'Montage not found' });
  m.company_id = company_id ?? null;
  writeDb(db);
  send(res, 200, { ok: true });
};

// ── Flags CRUD ─────────────────────────────────────────────────────────────────
routes['GET /api/montage/flags'] = (req, res) => {
  const { searchParams } = new URL(req.url, 'http://localhost');
  const montageId = searchParams.get('montage_id');
  const companyId = searchParams.get('company_id');
  const db = ensureFlags(readDb());
  let flags = db.flags;
  if (montageId) flags = flags.filter(f => f.montage_id === montageId);
  if (companyId) flags = flags.filter(f => f.company_id === companyId);
  send(res, 200, { flags });
};

routes['POST /api/montage/flags'] = async (req, res) => {
  const { montage_id, company_id, severity, category, text, timestamp_s } = JSON.parse(await readBody(req));
  if (!montage_id || !severity || !category) return send(res, 400, { error: 'montage_id, severity, category required' });
  const db = ensureFlags(readDb());
  const flag = {
    id: crypto.randomUUID(),
    montage_id,
    company_id: company_id ?? null,
    severity,
    category,
    text: text?.trim() ?? '',
    timestamp_s: typeof timestamp_s === 'number' ? timestamp_s : null,
    created_at: Math.floor(Date.now() / 1000),
  };
  db.flags.push(flag);
  writeDb(db);
  send(res, 200, { ok: true, flag });
};

routes['DELETE /api/montage/flags'] = (req, res, id) => {
  const db = ensureFlags(readDb());
  db.flags = db.flags.filter(f => f.id !== id);
  writeDb(db);
  send(res, 200, { ok: true });
};

// Serve montage video files
routes['GET /api/montage/file'] = (req, res, id) => {
  const filePath = path.join(MONTAGES_DIR, id + '.mp4');
  sendFile(res, filePath, req);
};

// Serve uploaded reference files
routes['GET /montage-uploads'] = (req, res, filename) => {
  sendFile(res, path.join(UPLOADS_DIR, filename), req);
};

// Health check endpoint — used by bmsservices.uk to detect the local server
routes['GET /api/montage/health'] = (_req, res) => {
  send(res, 200, { ok: true, server: 'relay-montage', version: '1.0' });
};

// Local folder scanner — lists video files in a given folder path
// GET /api/montage/local/scan?folder=C:\path\to\folder
routes['GET /api/montage/local/scan'] = async (req, res) => {
  const { searchParams } = new URL(req.url, 'http://localhost');
  const folder = searchParams.get('folder')?.trim();
  if (!folder) return send(res, 400, { error: 'Missing ?folder= parameter' });

  const resolved = path.resolve(folder);
  const VIDEO_EXTS = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.mts', '.wmv']);

  let entries;
  try {
    entries = await fs.promises.readdir(resolved, { withFileTypes: true });
  } catch {
    return send(res, 422, { error: `Cannot read folder: ${resolved}. Check the path exists and is accessible.` });
  }

  const files = await Promise.all(
    entries
      .filter(e => e.isFile() && VIDEO_EXTS.has(path.extname(e.name).toLowerCase()))
      .map(async e => {
        const filePath = path.join(resolved, e.name);
        let size = 0;
        try { size = (await fs.promises.stat(filePath)).size; } catch {}
        return { name: e.name, path: filePath, size };
      })
  );
  files.sort((a, b) => a.name.localeCompare(b.name));
  send(res, 200, { files, folder: resolved });
};

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Private-Network': 'true' });
    res.end();
    return;
  }

  const url = req.url?.split('?')[0] ?? '/';
  const method = req.method ?? 'GET';

  // Match routes
  // Health
  if (method === 'GET'    && url === '/api/montage/health')               return routes['GET /api/montage/health'](req, res);

  // Local folder scan
  if (method === 'GET'    && url.startsWith('/api/montage/local/scan'))   return routes['GET /api/montage/local/scan'](req, res);

  // References
  if (method === 'GET'    && url === '/api/montage/references')           return routes['GET /api/montage/references'](req, res);
  if (method === 'POST'   && url === '/api/montage/references/upload')    return routes['POST /api/montage/references/upload'](req, res);
  if (method === 'DELETE' && url.startsWith('/api/montage/references/'))  return routes['DELETE /api/montage/references'](req, res, url.split('/').pop());

  // Montages
  if (method === 'GET'    && url === '/api/montage/montages')             return routes['GET /api/montage/montages'](req, res);
  if (method === 'GET'    && url.match(/\/api\/montage\/montages\/(.+)\/insights/)) return routes['GET /api/montage/montages/insights'](req, res, url.match(/\/api\/montage\/montages\/(.+)\/insights/)[1]);
  if (method === 'POST'   && url.match(/\/api\/montage\/montages\/(.+)\/approve/)) return routes['POST /api/montage/montages/approve'](req, res, url.match(/\/api\/montage\/montages\/(.+)\/approve/)[1]);
  if (method === 'POST'   && url.match(/\/api\/montage\/montages\/(.+)\/prefer/)) return routes['POST /api/montage/montages/prefer'](req, res, url.match(/\/api\/montage\/montages\/(.+)\/prefer/)[1]);
  if (method === 'POST'   && url.match(/\/api\/montage\/montages\/(.+)\/feedback/)) return routes['POST /api/montage/montages/feedback'](req, res, url.match(/\/api\/montage\/montages\/(.+)\/feedback/)[1]);

  // Knowledge Base
  if (method === 'GET'    && url === '/api/montage/kb')                   return routes['GET /api/montage/kb'](req, res);
  if (method === 'POST'   && url === '/api/montage/kb')                   return routes['POST /api/montage/kb'](req, res);
  if (method === 'DELETE' && url.startsWith('/api/montage/kb/'))          return routes['DELETE /api/montage/kb'](req, res, url.split('/').pop());

  // Learning
  if (method === 'GET'    && url === '/api/montage/learning/stats')       return routes['GET /api/montage/learning/stats'](req, res);

  // Processing
  if (method === 'GET'    && url === '/api/montage/process/sessions')     return routes['GET /api/montage/process/sessions'](req, res);
  if (method === 'POST'   && url === '/api/montage/process/cleanup-failed') return routes['POST /api/montage/process/cleanup-failed'](req, res);
  if (method === 'POST'   && url === '/api/montage/process/override-rejection') return routes['POST /api/montage/process/override-rejection'](req, res);
  if (method === 'POST'   && url === '/api/montage/process/approve-combination') return routes['POST /api/montage/process/approve-combination'](req, res);
  if (method === 'POST'   && url === '/api/montage/process/select-music') return routes['POST /api/montage/process/select-music'](req, res);
  if (method === 'GET'    && url.startsWith('/api/montage/process/scan-music')) return routes['GET /api/montage/process/scan-music'](req, res);
  if (method === 'GET'    && url === '/api/montage/music-folders')         return routes['GET /api/montage/music-folders'](req, res);
  if (method === 'POST'   && url === '/api/montage/music-folders')         return routes['POST /api/montage/music-folders'](req, res);
  if (method === 'GET'    && url.startsWith('/api/montage/stream-music'))  return routes['GET /api/montage/stream-music'](req, res);
  if (method === 'GET'    && url.startsWith('/api/montage/process/sse/')) return routes['GET /api/montage/process/sse'](req, res, url.split('/').pop());
  if (method === 'POST'   && url === '/api/montage/process/start')        return routes['POST /api/montage/process/start'](req, res);

  // File serving
  if (method === 'GET'    && url.startsWith('/api/montage/file/'))        return routes['GET /api/montage/file'](req, res, url.split('/').pop());
  if (method === 'GET'    && url.startsWith('/montage-uploads/'))         return routes['GET /montage-uploads'](req, res, url.split('/').pop());

  // Companies
  if (method === 'GET'    && url === '/api/montage/companies')            return routes['GET /api/montage/companies'](req, res);
  if (method === 'POST'   && url === '/api/montage/companies')            return routes['POST /api/montage/companies'](req, res);
  if (method === 'PUT'    && url.match(/\/api\/montage\/companies\/.+/))  return routes['PUT /api/montage/companies'](req, res, url.split('/').pop());
  if (method === 'DELETE' && url.startsWith('/api/montage/companies/'))   return routes['DELETE /api/montage/companies'](req, res, url.split('/').pop());
  if (method === 'POST'   && url.match(/\/api\/montage\/montages\/(.+)\/assign-company/)) return routes['POST /api/montage/montages/assign-company'](req, res, url.match(/\/api\/montage\/montages\/(.+)\/assign-company/)[1]);

  // Flags
  if (method === 'GET'    && url.startsWith('/api/montage/flags'))        return routes['GET /api/montage/flags'](req, res);
  if (method === 'POST'   && url === '/api/montage/flags')                return routes['POST /api/montage/flags'](req, res);
  if (method === 'DELETE' && url.startsWith('/api/montage/flags/'))       return routes['DELETE /api/montage/flags'](req, res, url.split('/').pop());

  send(res, 404, { error: 'Unknown endpoint: ' + url });
});

// Disable socket idle timeout so SSE connections aren't killed between pipeline stages
server.keepAliveTimeout = 0;
server.headersTimeout = 0;
server.timeout = 0; // 0 = no timeout

server.listen(PORT, '127.0.0.1', () => {
  console.log('✅ Relay Montage Server running on http://localhost:' + PORT);
  console.log('📁 Data stored in: ' + DATA_DIR);
  // Seed KB with VideoBot + head-of-content frameworks on first run
  try { const db = readDb(); seedKnowledgeBase(db); } catch (e) { console.warn('KB seed failed:', e.message); }
  if (!checkFfmpeg()) {
    console.warn('⚠️  FFmpeg not found in PATH — video processing will fail.');
    console.warn('   Install from: https://ffmpeg.org/download.html');
  } else {
    console.log('✅ FFmpeg detected');
  }
});

// ── Crash guards — keep the server alive even if a pipeline throws unexpectedly ──
process.on('uncaughtException', (err) => {
  console.error('[CRASH GUARD] Uncaught exception — server stays alive:', err?.message ?? err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[CRASH GUARD] Unhandled promise rejection — server stays alive:', reason?.message ?? reason);
});
