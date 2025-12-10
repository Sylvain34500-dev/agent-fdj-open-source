import fs from "fs";
import path from "path";

// --------------------------------------
// Safe path helpers (portable win/mac/linux)
// --------------------------------------
const __root = path.dirname(new URL(import.meta.url).pathname);

// raw input location: src/data/raw_picks.json
const RAW_PICKS_PATH = path.join(__root, "data", "raw_picks.json");

// outputs
const PICKS_FULL_PATH = path.join(__root, "picks_full.json");
const PICKS_PATH = path.join(__root, "picks.json");


// --------------------------------------
// Parameters
// --------------------------------------
const BANKROLL = 1000;
const SAFE_MULTIPLIER = 0.75;
const CONSERVATIVE_MULTIPLIER = 1.00;
const AGGRESSIVE_MULTIPLIER = 3.00;


// --------------------------------------
// Read input
// --------------------------------------
const raw = JSON.parse(fs.readFileSync(RAW_PICKS_PATH, "utf8"));


// --------------------------------------
// Helpers
// --------------------------------------
const ev = (p, o) => p * (o - 1) - (1 - p);

const kelly = (p, o) => {
  const b = o - 1;
  const k = (p * b - (1 - p)) / b;
  return Math.max(0, k);
};


// --------------------------------------
// Computation
// --------------------------------------
const fullOutput = [];
const summaryOutput = [];

for (const m of raw) {
  const { matchId, start, odds, modelProb, confidence = 50 } = m;

  const EV = {
    home: ev(modelProb.home, odds.home),
    draw: ev(modelProb.draw, odds.draw),
    away: ev(modelProb.away, odds.away)
  };

  const K = {
    home: kelly(modelProb.home, odds.home),
    draw: kelly(modelProb.draw, odds.draw),
    away: kelly(modelProb.away, odds.away)
  };

  // choose best positive EV
  const best = 
    EV.home > 0 && EV.home >= EV.draw && EV.home >= EV.away ? "home" :
    EV.draw > 0 && EV.draw >= EV.home && EV.draw >= EV.away ? "draw" :
    EV.away > 0 && EV.away >= EV.home && EV.away >= EV.draw ? "away" :
    null;

  if (!best) continue;

  // Kelly adjusted by confidence
  const k_raw = K[best];
  const k_adj = k_raw * (confidence / 100);

  const k_safe = k_adj * SAFE_MULTIPLIER;
  const k_conservative = k_adj * CONSERVATIVE_MULTIPLIER;
  const k_aggressive = k_adj * AGGRESSIVE_MULTIPLIER;

  const stake_safe = +(BANKROLL * k_safe).toFixed(2);
  const stake_cons = +(BANKROLL * k_conservative).toFixed(2);
  const stake_aggr = +(BANKROLL * k_aggressive).toFixed(2);

  // full-data output
  fullOutput.push({
    matchId,
    start,
    odds,
    modelProb,
    confidence,
    EV,
    K_raw: k_raw,
    K_adj: k_adj,
    k_safe,
    k_conservative,
    k_aggressive,
    stake_safe,
    stake_conservative: stake_cons,
    stake_aggressive: stake_aggr,
  });

  // short summary output (for Telegram)
  summaryOutput.push({
    matchId,
    pick: best,
    odds: odds[best],
    prob: modelProb[best],
    EV: EV[best].toFixed(3),
    stake: stake_safe,        // SAFE version!!!
    confidence,
  });
}


// --------------------------------------
// write outputs
// --------------------------------------
fs.writeFileSync(PICKS_FULL_PATH, JSON.stringify(fullOutput, null, 2));
fs.writeFileSync(PICKS_PATH, JSON.stringify(summaryOutput, null, 2));

console.log("Processing done -> picks saved.");
