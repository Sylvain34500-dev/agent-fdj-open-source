import fs from "fs";

// -------------------------
//  Parameters (you can edit)
// -------------------------
const BANKROLL = 1000;  // Example
const SAFE_MULTIPLIER = 0.75;
const CONSERVATIVE_MULTIPLIER = 1.00;
const AGGRESSIVE_MULTIPLIER = 3.00;


// -------------------------
// Read raw model picks
// -------------------------
const raw = JSON.parse(fs.readFileSync("./data/raw_picks.json", "utf8"));


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
  return Math.max(0, k);  // never negative
}


// --------------------------------
// Process all matches
// --------------------------------
const fullOutput = [];
const summaryOutput = [];

for (const m of raw) {
  const { matchId, start, odds, modelProb, confidence = 50 } = m;

  // --- EV
  const ev = {
    home: computeEV(modelProb.home, odds.home),
    draw: computeEV(modelProb.draw, odds.draw),
    away: computeEV(modelProb.away, odds.away)
  };

  // --- Kelly full
  const kellyRaw = {
    home: kelly(modelProb.home, odds.home),
    draw: kelly(modelProb.draw, odds.draw),
    away: kelly(modelProb.away, odds.away)
  };

  // Choose best side (highest positive EV)
  const bestSide =
    ev.home > 0 && ev.home >= ev.draw && ev.home >= ev.away ? "home" :
    ev.draw > 0 && ev.draw >= ev.home && ev.draw >= ev.away ? "draw" :
    ev.away > 0 && ev.away >= ev.home && ev.away >= ev.draw ? "away" :
    null;

  if (!bestSide) {
    // skip No Value match
    continue;
  }

  const rawKelly = kellyRaw[bestSide];

  // Adjust by confidence (linear scaling)
  const k_adj = rawKelly * (confidence / 100);

  // SAFE / CONSERVATIVE / AGGRESSIVE variants
  const k_safe = k_adj * SAFE_MULTIPLIER * 0.5;
  const k_cons = k_adj * CONSERVATIVE_MULTIPLIER * 0.5;
  const k_aggr = k_adj * AGGRESSIVE_MULTIPLIER * 0.5;

  // Convert to stake amount
  const stake_safe = (k_safe * BANKROLL).toFixed(2);
  const stake_cons = (k_cons * BANKROLL).toFixed(2);
  const stake_aggr = (k_aggr * BANKROLL).toFixed(2);

  // -----------------------------
  // picks_full.json entry
  // -----------------------------
  const fullEntry = {
    matchId,
    start,
    odds,
    modelProb,
    ev,
    kelly: {
      rawFraction: rawKelly,
      adjusted: k_adj
    },
    stakeOptions: {
      safe: {
        fraction: k_safe,
        amount_eur: Number(stake_safe)
      },
      conservative: {
        fraction: k_cons,
        amount_eur: Number(stake_cons)
      },
      aggressive: {
        fraction: k_aggr,
        amount_eur: Number(stake_aggr)
      }
    },
    recommended: {
      side: bestSide,
      stakeFraction_safe: k_safe,
      stakeFraction_conservative: k_cons,
      stakeFraction_aggressive: k_aggr,
      confidence
    }
  };

  fullOutput.push(fullEntry);

  // -----------------------------
  // picks.json simplified entry
  // -----------------------------
  summaryOutput.push({
    matchId,
    start,
    pickSide: bestSide,
    odds: odds[bestSide],
    modelProb: modelProb[bestSide],
    ev: ev[bestSide],
    stake_safe: Number(stake_safe),
    stake_conservative: Number(stake_cons),
    stake_aggressive: Number(stake_aggr),
    confidence
  });
}


// -----------------------------
// Write outputs
// -----------------------------
fs.writeFileSync("./picks_full.json", JSON.stringify(fullOutput, null, 2));
fs.writeFileSync(
  "./picks.json",
  JSON.stringify({ top: summaryOutput.slice(0, 1), all: summaryOutput }, null, 2)
);

console.log("✔ picks_full.json and picks.json generated");
