import fs from "fs";
import path from "path";

// Root directory
const __root = path.dirname(new URL(import.meta.url).pathname);

// Files
const RAW_PICKS_PATH = path.join(__root, "data", "raw_picks.json");
const PICKS_FULL_PATH = path.join(__root, "picks_full.json");
const PICKS_PATH = path.join(__root, "picks.json");

// Parameters
const BANKROLL = 1000;
const SAFE_MULTIPLIER = 0.75;
const CONSERVATIVE_MULTIPLIER = 1.00;
const AGGRESSIVE_MULTIPLIER = 3.00;

// Load raw data
let raw;
try {
  raw = JSON.parse(fs.readFileSync(RAW_PICKS_PATH, "utf8"));
} catch (e) {
  console.error("ERROR: Cannot read raw_picks.json", e);
  process.exit(1);
}

// Force iterable (works for both array and object JSON)
raw = Array.isArray(raw) ? raw : Object.values(raw);

// EV function
function computeEV(prob, odds) {
  return prob * (odds - 1) - (1 - prob);
}

// Kelly fraction
function kelly(prob, odds) {
  const b = odds - 1;
  const k = (prob * b - (1 - prob)) / b;
  return Math.max(0, k);
}

// Outputs
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

  const bestSide =
    ev.home > 0 && ev.home >= ev.draw && ev.home >= ev.away ? "home" :
    ev.draw > 0 && ev.draw >= ev.home && ev.draw >= ev.away ? "draw" :
    ev.away > 0 && ev.away >= ev.home && ev.away >= ev.draw ? "away" :
    null;

  if (!bestSide) continue;

  const rawKelly = kellyRaw[bestSide];
  const k_adj = rawKelly * (confidence / 100);

  const bet_safe = Math.round(BANKROLL * k_adj * SAFE_MULTIPLIER);
  const bet_conservative = Math.round(BANKROLL * k_adj * CONSERVATIVE_MULTIPLIER);
  const bet_aggressive = Math.round(BANKROLL * k_adj * AGGRESSIVE_MULTIPLIER);

  fullOutput.push({
    matchId,
    start,
    odds,
    modelProb,
    ev,
    kellyRaw,
    bestSide,
    confidence,
    bet_safe,
    bet_conservative,
    bet_aggressive
  });

  summaryOutput.push({
    matchId,
    side: bestSide,
    odds: odds[bestSide],
    stake: bet_conservative
  });
}

// Write outputs
fs.writeFileSync(PICKS_FULL_PATH, JSON.stringify(fullOutput, null, 2));
fs.writeFileSync(PICKS_PATH, JSON.stringify(summaryOutput, null, 2));

console.log("Processed picks:", summaryOutput.length);
