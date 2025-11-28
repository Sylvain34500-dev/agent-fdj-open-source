// fetch_and_score.js
// Node 18+ recommended
import fs from 'fs/promises';
import fetch from 'node-fetch';

const ODDS_FILE = './odds_fdj.json';
const OUTPUT_PICKS = './picks.json';
const OUTPUT_FULL = './picks_full.json';

// Config : clés via env (GitHub Actions -> Secrets)
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY || '';
const THESPORTSDB_KEY = process.env.THESPORTSDB_KEY || '';
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || '';

// Helper simple fetch with headers
async function apiFetch(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status}`);
  }
  return res.json();
}

// Convert odds (decimal) -> implied probability
function impliedProb(odds) {
  // odds decimal like 2.5 -> prob = 1/2.5 = 0.4
  return 1 / odds;
}

// EV calculation example: (p_true - p_market) * payout
// but we don't have p_true; use simplified EV = (1/odds - market_prob) * odds
// We'll use EV = (implied - market_implied) but here market_implied = implied from FDJ (so EV 0)
// Instead we will consider "relative EV" from our model (placeholder)
function computeEV(odds, modelProb) {
  // modelProb between 0 and 1 (our estimated true probability)
  return (modelProb - (1 / odds)) * odds;
}

// Simple model for team form: from last 5 matches
// We'll estimate modelProb using a weighted combination of form/h2h/injuries
function computeModelProbability(baseProb, formScore, h2hScore, injuryPenalty) {
  // baseProb is market implied (1/odds) as starting point
  // weights (tunable)
  const wBase = 0.5;
  const wForm = 0.2;
  const wH2H = 0.15;
  const wInjury = -0.15; // negative
  let p = wBase * baseProb + wForm * formScore + wH2H * h2hScore + wInjury * injuryPenalty;
  // clamp
  if (p < 0.01) p = 0.01;
  if (p > 0.99) p = 0.99;
  return p;
}

// Example function to compute a normalized form score from results array (W/D/L)
function formScoreFromResults(results) {
  // results: array of 'W'|'D'|'L' for the team, most recent first
  // W=1, D=0.5, L=0
  if (!results || results.length === 0) return 0.5;
  const map = { W: 1, D: 0.5, L: 0 };
  const vals = results.slice(0,5).map(r => map[r] ?? 0.5);
  const avg = vals.reduce((a,b) => a + b, 0) / vals.length;
  return avg; // between 0 and 1
}

// Minimal example: Fetch last results from football-data.org (free)
async function getFormFromFootballData(teamId) {
  // football-data: /teams/{id}/matches?limit=5
  // you need to map team name -> teamId with a prior step (search)
  try {
    const url = `https://api.football-data.org/v4/teams/${teamId}/matches?limit=10`;
    const json = await apiFetch(url, { 'X-Auth-Token': FOOTBALL_DATA_KEY });
    // parse last 5 results for team (we'll find matches and compute result)
    const matches = (json.matches || []).slice(0,10);
    const results = matches.map(m => {
      // determine if team won/draw/lost
      const homeTeam = m.homeTeam;
      const awayTeam = m.awayTeam;
      const score = m.score;
      let result = 'D';
      if (score.winner === 'HOME_TEAM') {
        result = (homeTeam.id === teamId) ? 'W' : 'L';
      } else if (score.winner === 'AWAY_TEAM') {
        result = (awayTeam.id === teamId) ? 'W' : 'L';
      } else result = 'D';
      return result;
    });
    return formScoreFromResults(results);
  } catch (e) {
    console.warn('football-data form fetch failed for', teamId, e.message);
    return 0.5; // neutral
  }
}

// Example injuries using TheSportsDB (if available)
// This is highly dependent on API coverage
async function getInjuriesFromSportsDB(teamName) {
  // placeholder: TheSportsDB has events/players but not perfect injuries endpoint
  // We'll return a penalty value between 0 and 0.5 proportional to injuries
  try {
    // Placeholder URL (you must adapt based on chosen API)
    const q = encodeURIComponent(teamName);
    const url = `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_KEY}/searchteams.php?t=${q}`;
    const json = await apiFetch(url);
    // Not reliable; we'll just return 0
    return 0.0;
  } catch (e) {
    return 0.0;
  }
}

// head-to-head (H2H) using football-data / other API
async function getH2HScore(homeId, awayId) {
  // Placeholder: compute H2H normalized score favoring home
  // If no data, return 0.5 neutral
  try {
    // You can use API-Football H2H endpoint (paid). For now return neutral
    return 0.5;
  } catch (e) {
    return 0.5;
  }
}

async function main() {
  const raw = await fs.readFile(ODDS_FILE, 'utf8');
  const oddsJson = JSON.parse(raw); // expect array of matches with decimals odds
  const full = [];
  for (const match of oddsJson.matches || oddsJson || []) {
    // IMPORTANT: adapt to your odds structure
    // Example assumed shape: { id, home: "Team A", away: "Team B", odds: { home: 1.9, draw: 3.4, away: 4.0 }, startTime }
    try {
      const home = match.home;
      const away = match.away;
      const start = match.startTime || match.utc || match.date;
      const oddsHome = match.odds?.home;
      const oddsDraw = match.odds?.draw;
      const oddsAway = match.odds?.away;

      // base implied probability (for home)
      const baseProbHome = oddsHome ? impliedProb(oddsHome) : 0.33;
      const baseProbAway = oddsAway ? impliedProb(oddsAway) : 0.33;

      // get form (you need mapping team -> id; using team names for now)
      const formHome = await getFormFromFootballData(match.homeId || match.homeCode || match.home);
      const formAway = await getFormFromFootballData(match.awayId || match.awayCode || match.away);

      // injuries (penalty)
      const injHome = await getInjuriesFromSportsDB(home);
      const injAway = await getInjuriesFromSportsDB(away);

      // h2h normalized
      const h2h = await getH2HScore(match.homeId, match.awayId);

      // compute model probabilities (home & away) — simplified
      const modelProbHome = computeModelProbability(baseProbHome, formHome, 0.5 + (h2h - 0.5) * 0.1, injHome);
      const modelProbAway = computeModelProbability(baseProbAway, formAway, 0.5 - (h2h - 0.5) * 0.1, injAway);

      // EV for picking home and away
      const evHome = oddsHome ? computeEV(oddsHome, modelProbHome) : 0;
      const evAway = oddsAway ? computeEV(oddsAway, modelProbAway) : 0;

      // score global: combine EV (scaled) + form difference + injury difference + h2h
      // weights:
      const wEV = 0.6;
      const wForm = 0.2;
      const wInj = -0.1;
      const wH2H = 0.3;

      // compute per-side score (higher = better pick)
      const scoreHome = wEV * Math.tanh(evHome*1.0) + wForm * (formHome - formAway) + wInj * (injHome - injAway) + wH2H * (h2h - 0.5);
      const scoreAway = wEV * Math.tanh(evAway*1.0) + wForm * (formAway - formHome) + wInj * (injAway - injHome) + wH2H * (0.5 - (h2h - 0.5));

      const item = {
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
      };

      full.push(item);
    } catch (e) {
      console.warn('match processing error', e.message);
    }
  }

  // Sort and pick top picks (by best score difference)
  const picksAll = [];
  for (const f of full) {
    const bestSide = (f.score.home >= f.score.away) ? 'home' : 'away';
    const bestScore = Math.max(f.score.home, f.score.away);
    const chosenOdds = bestSide === 'home' ? f.odds.home : f.odds.away;
    const chosenModelProb = f.modelProb[bestSide];
    const chosenEV = f.ev[bestSide];
    picksAll.push({
      matchId: f.matchId,
      home: f.home,
      away: f.away,
      start: f.start,
      pickSide: bestSide,
      odds: chosenOdds,
      modelProb: chosenModelProb,
      ev: chosenEV,
      score: bestScore
    });
  }

  // Filter picks with positive EV or top N by score
  const positive = picksAll.filter(p => p.ev > 0);
  const top = picksAll.sort((a,b) => b.score - a.score).slice(0, 10);

  await fs.writeFile(OUTPUT_FULL, JSON.stringify(full, null, 2));
  await fs.writeFile(OUTPUT_PICKS, JSON.stringify({ top, positive, all: picksAll }, null, 2));
  console.log(`Wrote ${OUTPUT_PICKS} and ${OUTPUT_FULL}`);
}

main().catch(err => { console.error(err); process.exit(1); });
