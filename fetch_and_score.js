// fetch_and_score.js
import fs from 'fs/promises';
import fetch from 'node-fetch';

const ODDS_FILE = './odds_fdj.json';
const OUTPUT_PICKS = './picks.json';
const OUTPUT_FULL = './picks_full.json';

// Env keys
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY || '';
const THESPORTSDB_KEY = process.env.THESPORTSDB_KEY || '';
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || '';

// Helper fetch
async function apiFetch(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  return res.json();
}

// Convert odds to implied probability
function impliedProb(odds) {
  return odds > 0 ? 1 / odds : 0.33;
}

// EV computation
function computeEV(odds, modelProb) {
  return (modelProb - (1 / odds)) * odds;
}

// Form score from array of W/D/L
function formScoreFromResults(results) {
  if (!Array.isArray(results) || results.length === 0) return 0.5;
  const map = { W: 1, D: 0.5, L: 0 };
  const vals = results.slice(0, 5).map(r => map[r] ?? 0.5);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// Disabled API call by default (football-data requires IDs)
async function getFormFromFootballData(teamId) {
  return 0.5; // neutral for now
}

// Disabled for now
async function getInjuriesFromSportsDB(teamName) {
  return 0.0;
}

// Disabled H2H
async function getH2HScore(homeId, awayId) {
  return 0.5;
}

// Combine model probability
function computeModelProbability(baseProb, form, h2h, injury) {
  const wBase = 0.5;
  const wForm = 0.2;
  const wH2H = 0.15;
  const wInjury = -0.15;

  let p = wBase * baseProb + wForm * form + wH2H * h2h + wInjury * injury;
  return Math.min(0.99, Math.max(0.01, p));
}

async function main() {
  const raw = await fs.readFile(ODDS_FILE, 'utf8');
  let oddsData = JSON.parse(raw);

  // Ensure array format
  if (!Array.isArray(oddsData) && Array.isArray(oddsData.matches)) {
    oddsData = oddsData.matches;
  }
  if (!Array.isArray(oddsData)) {
    console.error("❌ ERROR: odds_fdj.json must be an array of matches.");
    process.exit(1);
  }

  const full = [];

  for (const match of oddsData) {
    try {
      const home = match.home;
      const away = match.away;

      const oddsHome = match.odds?.home ?? null;
      const oddsDraw = match.odds?.draw ?? null;
      const oddsAway = match.odds?.away ?? null;

      const start = match.startTime || match.date || null;

      const baseProbHome = impliedProb(oddsHome);
      const baseProbAway = impliedProb(oddsAway);

      // Form scores (placeholder)
      const formHome = await getFormFromFootballData(match.homeId);
      const formAway = await getFormFromFootballData(match.awayId);

      // Injuries
      const injHome = await getInjuriesFromSportsDB(home);
      const injAway = await getInjuriesFromSportsDB(away);

      // h2h
      const h2h = await getH2HScore(match.homeId, match.awayId);

      // Model probabilities
      const modelProbHome = computeModelProbability(baseProbHome, formHome, h2h, injHome);
      const modelProbAway = computeModelProbability(baseProbAway, formAway, 1 - h2h, injAway);

      const evHome = oddsHome ? computeEV(oddsHome, modelProbHome) : 0;
      const evAway = oddsAway ? computeEV(oddsAway, modelProbAway) : 0;

      // Scoring
      const wEV = 0.6;
      const wForm = 0.2;
      const wInj = -0.1;
      const wH2H = 0.3;

      const scoreHome =
        wEV * Math.tanh(evHome) +
        wForm * (formHome - formAway) +
        wInj * (injHome - injAway) +
        wH2H * (h2h - 0.5);

      const scoreAway =
        wEV * Math.tanh(evAway) +
        wForm * (formAway - formHome) +
        wInj * (injAway - injHome) +
        wH2H * (0.5 - (h2h - 0.5));

      full.push({
        matchId: match.id || `${home}-${away}-${start}`,
        home, away, start,
        odds: { home: oddsHome, draw: oddsDraw, away: oddsAway },
        baseProb: { home: baseProbHome, away: baseProbAway },
        modelProb: { home: modelProbHome, away: modelProbAway },
        ev: { home: evHome, away: evAway },
        form: { home: formHome, away: formAway },
        injuries: { home: injHome, away: injAway },
        h2h,
        score: { home: scoreHome, away: scoreAway }
      });

    } catch (e) {
      console.warn("match processing error:", e.message);
    }
  }

  // Create picks
  const picksAll = full.map(f => {
    const best = f.score.home >= f.score.away ? 'home' : 'away';
    return {
      matchId: f.matchId,
      home: f.home,
      away: f.away,
      start: f.start,
      pickSide: best,
      odds: f.odds[best],
      modelProb: f.modelProb[best],
      ev: f.ev[best],
      score: f.score[best]
    };
  });

  const positive = picksAll.filter(p => p.ev > 0);
  const top = [...picksAll].sort((a, b) => b.score - a.score).slice(0, 10);

  await fs.writeFile(OUTPUT_FULL, JSON.stringify(full, null, 2));
  await fs.writeFile(OUTPUT_PICKS, JSON.stringify({ top, positive, all: picksAll }, null, 2));

  console.log(`✔ Picks generated: ${OUTPUT_PICKS}`);
  console.log(`✔ Full analysis saved: ${OUTPUT_FULL}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
