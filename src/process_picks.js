// src/process_picks.js
import fs from "fs";
import path from "path";

const __root = path.dirname(new URL(import.meta.url).pathname);

const RAW_PICKS_PATH = path.join(__root, "data", "raw_picks.json");
const PICKS_FULL_PATH = path.join(__root, "picks_full.json");
const PICKS_PATH = path.join(__root, "picks.json");

const BANKROLL = 1000;
const SAFE_MULTIPLIER = 0.75;
const CONSERVATIVE_MULTIPLIER = 1.0;
const AGGRESSIVE_MULTIPLIER = 3.0;

function safeNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function computeEV(prob, odds) {
  // prob and odds expected numeric
  if (prob == null || odds == null) return null;
  return prob * (odds - 1) - (1 - prob);
}

function kelly(prob, odds) {
  if (prob == null || odds == null) return 0;
  const b = odds - 1;
  if (b <= 0) return 0;
  const k = (prob * b - (1 - prob)) / b;
  return Math.max(0, k);
}

// read raw
let rawFile;
try {
  rawFile = JSON.parse(fs.readFileSync(RAW_PICKS_PATH, "utf8"));
} catch (e) {
  console.error(`ERROR: cannot read ${RAW_PICKS_PATH} —`, e.message);
  // write empty outputs to avoid breaking pipeline consumers
  fs.writeFileSync(PICKS_PATH, JSON.stringify({ top: [], all: [] }, null, 2));
  fs.writeFileSync(PICKS_FULL_PATH, JSON.stringify([], null, 2));
  process.exit(0);
}

const raw = Array.isArray(rawFile) ? rawFile : (rawFile.picks ?? rawFile.matches ?? Object.values(rawFile));

// outputs
const fullOutput = [];
const summaryOutput = [];

if (!Array.isArray(raw) || raw.length === 0) {
  console.log("No raw picks found (empty array) — writing empty outputs.");
  fs.writeFileSync(PICKS_PATH, JSON.stringify({ top: [], all: [] }, null, 2));
  fs.writeFileSync(PICKS_FULL_PATH, JSON.stringify([], null, 2));
  process.exit(0);
}

let skipped = 0;
for (const m of raw) {
  // normalize presence
  const matchId = m.matchId ?? m.id ?? `${m.home ?? "home"}-${m.away ?? "away"}`; 
  const start = m.start ?? null;

  // attempt to find odds object (could be nested)
  const oddsRaw = m.odds ?? m.odds_value ?? m.prices ?? null;
  const modelProbRaw = m.modelProb ?? m.prob ?? m.probs ?? null;
  const confidence = safeNum(m.confidence ?? m.conf ?? 50);

  // validate odds shape
  const odds = {
    home: safeNum(oddsRaw?.home ?? oddsRaw?.h ?? oddsRaw?.[0]),
    draw: safeNum(oddsRaw?.draw ?? oddsRaw?.d ?? oddsRaw?.[1]),
    away: safeNum(oddsRaw?.away ?? oddsRaw?.a ?? oddsRaw?.[2])
  };

  // validate modelProb shape (must be object with home/draw/away numeric)
  const modelProb = {
    home: safeNum(modelProbRaw?.home ?? modelProbRaw?.h ?? modelProbRaw?.[0]),
    draw: safeNum(modelProbRaw?.draw ?? modelProbRaw?.d ?? modelProbRaw?.[1]),
    away: safeNum(modelProbRaw?.away ?? modelProbRaw?.a ?? modelProbRaw?.[2])
  };

  // Basic checks — skip if important fields missing
  const missing = [];
  if (odds.home == null && odds.draw == null && odds.away == null) missing.push("odds");
  if (modelProb.home == null && modelProb.draw == null && modelProb.away == null) missing.push("modelProb");

  if (missing.length) {
    console.warn(`[process_picks] skipping ${matchId} — missing: ${missing.join(", ")}`);
    skipped++;
    continue;
  }

  // ensure numeric fallback: if some sides missing try to fill with reasonable defaults
  // (e.g., if draw missing, set to average of others)
  if (odds.draw == null) {
    const vals = [odds.home, odds.away].filter(v => v != null);
    odds.draw = vals.length ? +(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2) : null;
  }
  if (modelProb.draw == null) {
    const vals = [modelProb.home, modelProb.away].filter(v => v != null);
    modelProb.draw = vals.length ? +(1 - (vals[0] + (vals[1] ?? 0)) / 2).toFixed(3) : null;
  }

  // final safety check (if still missing any side, skip)
  if (odds.home == null || odds.away == null || modelProb.home == null || modelProb.away == null) {
    console.warn(`[process_picks] skipping ${matchId} — incomplete sides after fallback (odds/home:${odds.home}, odds/away:${odds.away}, prob/home:${modelProb.home}, prob/away:${modelProb.away})`);
    skipped++;
    continue;
  }

  // compute EVs
  const evHome = computeEV(modelProb.home, odds.home);
  const evDraw = computeEV(modelProb.draw, odds.draw);
  const evAway = computeEV(modelProb.away, odds.away);

  const evObj = { home: evHome, draw: evDraw, away: evAway };

  // compute kelly raw per side
  const kRaw = { home: kelly(modelProb.home, odds.home), draw: kelly(modelProb.draw, odds.draw), away: kelly(modelProb.away, odds.away) };

  // choose best positive EV
  const bestSide =
    evHome > 0 && evHome >= evDraw && evHome >= evAway ? "home" :
    evDraw > 0 && evDraw >= evHome && evDraw >= evAway ? "draw" :
    evAway > 0 && evAway >= evHome && evAway >= evDraw ? "away" :
    null;

  if (!bestSide) {
    // no positive EV, skip
    console.log(`[process_picks] no positive EV for ${matchId} -> skipped`);
    skipped++;
    continue;
  }

  const rawKelly = kRaw[bestSide];
  const kAdj = rawKelly * (confidence / 100);

  const safeFraction = +(kAdj * SAFE_MULTIPLIER).toFixed(6);
  const consFraction = +(kAdj * CONSERVATIVE_MULTIPLIER).toFixed(6);
  const aggrFraction = +(kAdj * AGGRESSIVE_MULTIPLIER).toFixed(6);

  const stake_safe = +(BANKROLL * safeFraction).toFixed(2);
  const stake_cons = +(BANKROLL * consFraction).toFixed(2);
  const stake_aggr = +(BANKROLL * aggrFraction).toFixed(2);

  fullOutput.push({
    matchId,
    start,
    odds,
    modelProb,
    confidence,
    ev: evObj,
    kelly_raw: kRaw,
    bestSide,
    fractions: { safeFraction, consFraction, aggrFraction },
    stakes_eur: { stake_safe, stake_conservative: stake_cons, stake_aggressive: stake_aggr }
  });

  summaryOutput.push({
    matchId,
    start,
    pickSide: bestSide,
    odds: odds[bestSide],
    modelProb: modelProb[bestSide],
    ev: +(evObj[bestSide] ?? 0).toFixed(3),
    stake_safe,
    stake_conservative: stake_cons,
    stake_aggressive: stake_aggr,
    confidence
  });
}

console.log(`[process_picks] processed ${fullOutput.length} picks, skipped ${skipped}`);

fs.writeFileSync(PICKS_FULL_PATH, JSON.stringify(fullOutput, null, 2));
fs.writeFileSync(PICKS_PATH, JSON.stringify({ top: summaryOutput.slice(0, 10), all: summaryOutput }, null, 2));

console.log("✔ picks written:", PICKS_PATH, PICKS_FULL_PATH);
