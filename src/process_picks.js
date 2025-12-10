
import fs from "fs";
import path from "path";

// -------------------------
// Safe path helpers (fix)
// -------------------------
const __root = path.dirname(new URL(import.meta.url).pathname);

// raw input location (src/data/raw_picks.json)
const RAW_PICKS_PATH = path.join(__root, "data", "raw_picks.json");

// output folder (src/)
const PICKS_FULL_PATH = path.join(__root, "picks_full.json");
const PICKS_PATH = path.join(__root, "picks.json");


// -------------------------
//  Parameters (editable)
// -------------------------
const BANKROLL = 1000;
const SAFE_MULTIPLIER = 0.75;
const CONSERVATIVE_MULTIPLIER = 1.00;
const AGGRESSIVE_MULTIPLIER = 3.00;


// -------------------------
// Read raw model picks
// -------------------------
const raw = JSON.parse(fs.readFileSync(RAW_PICKS_PATH, "utf8"));


// --------------------------------
// Helper: Expected value EV
// --------------------------------
function computeEV(prob, odds) {
  return prob * (odds - 1) - (1 - prob);
}


// --------------------------------
// Helper: Kelly fraction
// --------------------------------
function kelly(prob, odds) {
  const b = odds - 1;
  const k = (prob * b - (1 - prob)) / b;
  return Math.max(0, k);
}


// --------------------------------
// Process all matches
// --------------------------------
const fullOutput = [];
const summaryOutput = [];

for (const m of raw) {
  const { matchId, start, odds, modelProb, confidence = 50 } = m;

  const ev = {
    home: computeEV(modelProb.home, odds.home),
    draw: computeEV(modelProb.draw, odds.draw),
    away: computeEV(modelProb.away, odds.away)
  };

  const kellyRaw = {
    home: kelly(modelProb.home, odds.home),
    draw: kelly(modelProb.draw, odds.draw),
    away: kelly(modelProb.away, odds.away)
  };

  // best side
  const bestSide =
    ev.home > 0 && ev.home >= ev.draw && ev.home >= ev.away ? "home" :
    ev.draw > 0 && ev.draw >= ev.home && ev.draw >= ev.away ? "draw" :
    ev.away > 0 && ev.away >= ev.home && ev.away >= ev.draw ? "away" :
    null;

  if (!bestSide) continue;

  const rawKelly = kellyRaw[bestSide];

  const k_adj = rawKelly * (confidence / 100);

  const k_safe = k_adj * SAFE_MULTI_*
