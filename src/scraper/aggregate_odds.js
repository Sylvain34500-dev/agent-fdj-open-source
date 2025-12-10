// src/scraper/aggregate_odds.js
const fs = require("fs");
const path = require("path");

const PRONO_FILE = path.join(__dirname, "..", "data", "raw_pronosoft.json");
const OUT_FILE = path.join(__dirname, "..", "data", "raw_picks.json");

function safeReadJson(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return null;
  }
}

function normalizePronosoft(raw) {
  if (!raw || !raw.matches) return [];
  return raw.matches.map(m => {
    // convert to unified format expected by process_picks
    return {
      matchId: m.matchId,
      start: m.start || null,
      home: m.home,
      away: m.away,
      // We keep odds as single decimal per match (prefer home/away as major)
      odds: {
        home: m.odds?.home ?? null,
        draw: m.odds?.draw ?? null,
        away: m.odds?.away ?? null
      },
      // modelProb is not provided by pronosoft — keep null so next step can compute fallback
      modelProb: null,
      // include raw textual data for later enrichment
      meta: {
        analysis: m.analysis || null,
        formText: m.formText || null,
        h2hText: m.h2hText || null,
        injuries: m.injuries || { home: 0, away: 0 },
        source: "pronosoft"
      }
    };
  });
}

function main() {
  const rawProno = safeReadJson(PRONO_FILE);
  const normalized = normalizePronosoft(rawProno);

  // write output dir
  const outDir = path.dirname(OUT_FILE);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(OUT_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), picks: normalized }, null, 2));
  console.log(`[aggregate] wrote ${normalized.length} picks to ${OUT_FILE}`);
}

if (require.main === module) main();

