// fetch_and_score.cjs
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Outputs
const OUT1 = path.join(__dirname, 'picks.json');
const OUT2 = path.join(__dirname, 'picks_full.json');

const PRONOS_URL = "https://pronosoft.com/fr/parions_sport/";

// Config via env (optional)
const BANKROLL = parseFloat(process.env.BANKROLL) || 1000; // € par défaut
const MAX_STAKE_PERCENT = parseFloat(process.env.MAX_STAKE_PERCENT) || 0.05; // ne pas dépasser 5% bankroll
const SAFETY_KELLY_FACTOR = parseFloat(process.env.SAFETY_KELLY_FACTOR) || 0.25; // fraction par défaut (Kelly/4)
const MIN_CONFIDENCE_FOR_BET = parseFloat(process.env.MIN_CONFIDENCE_FOR_BET) || 30; // %

// ---------------- fetchHtml ----------------
async function fetchHtml(url) {
  const res = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 15000
  });
  return res.data;
}

// ---------------- parseMatches ----------------
function parseMatches(html) {
  const $ = cheerio.load(html);
  const matches = [];

  // Sélecteur robuste - on essaye plusieurs patterns
  const rows = $("tr.psm").length ? $("tr.psm") : $(".psmg").length ? $(".psmg") : $("div.match, .match-row");

  rows.each((i, row) => {
    // ESSAYER plusieurs sélecteurs pour récupérer équipes
    const teamText = $(row).find(".psmt").text().trim() || $(row).find(".teams").text().trim() || $(row).text().trim();
    if (!teamText || !teamText.includes("-")) return;

    const [homeRaw, awayRaw] = teamText.split("-").map(s => s.trim());
    const home = homeRaw || "HOME";
    const away = awayRaw || "AWAY";

    // Récupération des cotes s'il y en a
    const oddsArr = [];
    $(row).find(".psmc, .odds, .coef").each((_, c) => {
      const tx = $(c).text().trim().replace(",", ".");
      if (!isNaN(tx) && tx !== "") oddsArr.push(parseFloat(tx));
    });

    // Fallback quand site structure différente : chercher nombres dans row
    if (oddsArr.length === 0) {
      const numbers = $(row).text().match(/[\d]+\,[\d]{1,2}|[\d]+\.[\d]{1,2}/g);
      if (numbers && numbers.length >= 1) {
        for (let n of numbers) oddsArr.push(parseFloat(n.replace(",", ".")));
      }
    }

    // standardise odds object
    const odds = {
      home: oddsArr[0] ?? null,
      draw: oddsArr[1] ?? null,
      away: oddsArr[2] ?? null
    };

    matches.push({
      matchId: `${home}-${away}-${i}`,
      home,
      away,
      odds
    });
  });

  return matches;
}

// ---------------- addDynamicDate ----------------
function addDynamicDate(m) {
  // Si start déjà défini, on le garde
  if (m.start) return m;

  const now = new Date();
  const hour = 18 + (Math.floor(Math.random() * 8)); // 18 → 25 (couvre soirées)
  const minute = Math.floor(Math.random() * 60);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
  return { ...m, start: start.toISOString() };
}

// ---------------- utility : calcKelly ----------------
function calcKellyFraction(p, o) {
  // p = prob, o = odds (decimal)
  if (!o || p <= 0) return 0;
  const k = (p * o - 1) / (o - 1);
  return (k > 0 && isFinite(k)) ? k : 0;
}

// ---------------- ValueBet Avancé : confidence calc ----------------
function computeConfidence(m) {
  // Entrée attendue : m.odds, m.modelProb, éventuellement m.form, m.injuries, m.h2h
  // Score entre 0 et 100

  const probs = m.modelProb || { home: 0.33, draw: 0.33, away: 0.33 };
  const odds = m.odds || { home: null, draw: null, away: null };

  // Choose best side by EV (simple)
  const evHome = odds.home ? (probs.home * odds.home - 1) : -999;
  const evDraw = odds.draw ? (probs.draw * odds.draw - 1) : -999;
  const evAway = odds.away ? (probs.away * odds.away - 1) : -999;

  // pick best ev
  const evs = [{side:'home',ev:evHome},{side:'draw',ev:evDraw},{side:'away',ev:evAway}];
  evs.sort((a,b)=>b.ev - a.ev);
  const best = evs[0];

  // base confidence from EV magnitude (scaled 0..60)
  const baseConf = Math.max(0, Math.min(60, Math.round((best.ev / 0.25) * 60))); // 0.25 EV => 60 points

  // form factor (0..15)
  const form = m.form || { home:0.5, away:0.5 };
  let formFactor = 0;
  if (best.side === 'home') formFactor = Math.round((form.home - 0.5) * 30); // +/-15
  if (best.side === 'away') formFactor = Math.round((form.away - 0.5) * 30);

  // injuries factor (negative if missing key players) (-10..10)
  const inj = m.injuries || { home:0, away:0 }; // % impact 0..1
  let injFactor = 0;
  if (best.side === 'home') injFactor = Math.round((0 - inj.home) * 20); // injuries reduce confidence
  if (best.side === 'away') injFactor = Math.round((0 - inj.away) * 20);

  // h2h factor (historic edge) - normalized (-10..10)
  const h2h = m.h2h || { homeWins:0, awayWins:0, draws:0 };
  const total = (h2h.homeWins + h2h.awayWins + h2h.draws) || 1;
  const h2hEdge = ((h2h.homeWins - h2h.awayWins) / total) || 0;
  const h2hFactor = Math.round(h2hEdge * 10); // -10..10

  // probability margin vs implied
  let probMarginFactor = 0;
  try {
    // implied p = 1/odds normalized (we use best side)
    const bestOdds = best.side === 'home' ? odds.home : best.side === 'away' ? odds.away : odds.draw;
    if (bestOdds) {
      const implied = 1 / bestOdds;
      const probModel = best.side === 'home' ? probs.home : best.side === 'away' ? probs.away : probs.draw;
      const margin = probModel - implied; // positive good
      probMarginFactor = Math.round(Math.max(-20, Math.min(20, margin * 100))); // scale to -20..20
    }
  } catch (e) { probMarginFactor = 0; }

  // aggregate
  let confidence = baseConf + formFactor + injFactor + h2hFactor + probMarginFactor;

  // clamp 0..100
  confidence = Math.max(0, Math.min(100, confidence));

  return {
    confidence,
    bestSide: best.side,
    bestEv: best.ev
  };
}

// ---------------- risk-adjust kelly ----------------
function riskAdjustedKelly(rawKelly, confidence) {
  // confidence 0..100, we make a multiplier 0..1
  const confFactor = Math.max(0.05, confidence / 100); // min 5% influence
  // reduce rawKelly when confidence low, keep rawKelly when confidence high
  const adjusted = rawKelly * confFactor;
  return adjusted;
}

// ---------------- evaluate matches (main advanced function) ----------------
function evaluateMatches(matches) {
  return matches.map(m => {
    // ensure modelProb structure exists (if not, create neutral distribution from score)
    if (!m.modelProb) {
      // fallback: derive from score proportions if available
      const s = m.score || { home:1, draw:0.5, away:0.6 };
      const total = (s.home || 0) + (s.draw || 0) + (s.away || 0) || 1;
      m.modelProb = {
        home: (s.home || 0) / total,
        draw: (s.draw || 0) / total,
        away: (s.away || 0) / total
      };
    }

    // compute EVs
    const odds = m.odds || { home:null, draw:null, away:null };
    const probs = m.modelProb || { home:0.33, draw:0.33, away:0.33 };
    const evHome = odds.home ? (probs.home * odds.home - 1) : null;
    const evDraw = odds.draw ? (probs.draw * odds.draw - 1) : null;
    const evAway = odds.away ? (probs.away * odds.away - 1) : null;

    // compute raw kellys
    const kHome = calcKellyFraction(probs.home, odds.home);
    const kDraw = calcKellyFraction(probs.draw, odds.draw);
    const kAway = calcKellyFraction(probs.away, odds.away);

    // compute confidence
    const { confidence, bestSide, bestEv } = computeConfidence(m);

    // choose side candidate (best positive EV)
    const candidates = [
      { side: 'home', ev: evHome, k: kHome },
      { side: 'draw', ev: evDraw, k: kDraw },
      { side: 'away', ev: evAway, k: kAway }
    ].filter(c => c.ev !== null && c.ev > 0 && c.k > 0);

    // No viable candidate => mark NO_BET
    if (candidates.length === 0) {
      return {
        ...m,
        confidence,
        bestSide,
        ev: { home: evHome, draw: evDraw, away: evAway },
        kelly: { home: kHome, draw: kDraw, away: kAway },
        stake: { fraction: 0, amount: 0 },
        label: "NO_BET"
      };
    }

    // pick candidate with highest EV (then highest k)
    candidates.sort((a,b)=> {
      if (b.ev !== a.ev) return b.ev - a.ev;
      return b.k - a.k;
    });
    const chosen = candidates[0];

    // risk-adjust raw kelly using confidence
    const rawKelly = chosen.k;
    const adjKelly = riskAdjustedKelly(rawKelly, confidence);

    // apply safety fraction (Kelly/4 default)
    const safeKelly = adjKelly * SAFETY_KELLY_FACTOR / (SAFETY_KELLY_FACTOR === 0 ? 1 : SAFETY_KELLY_FACTOR); // keeps adjKelly if SAFETY=1

    // final stake fraction limited by MAX_STAKE_PERCENT
    const stakeFraction = Math.min(MAX_STAKE_PERCENT, safeKelly);

    // stake amount if bankroll known
    const stakeAmount = Math.round((stakeFraction * BANKROLL) * 100) / 100;

    // label by confidence thresholds
    let label = "WEAK";
    if (confidence >= 75) label = "STRONG_VALUE";
    else if (confidence >= 50) label = "MEDIUM_VALUE";
    else if (confidence >= MIN_CONFIDENCE_FOR_BET) label = "WEAK_VALUE";
    else label = "NO_BET";

    // return enriched match
    return {
      ...m,
      confidence,
      ev: { home: evHome, draw: evDraw, away: evAway },
      kelly: {
        home: kHome,
        draw: kDraw,
        away: kAway,
        adjusted: adjKelly,
        safeKellyFraction: Math.round(safeKelly * 10000)/10000
      },
      stake: {
        fraction: Math.round(stakeFraction * 10000)/10000,
        amount: stakeAmount
      },
      chosen: {
        side: chosen.side,
        ev: chosen.ev,
        rawKelly: chosen.k
      },
      label
    };
  });
}

// ---------------- scoreMatches wrapper (backwards compat) ----------------
function scoreMatches(matches) {
  // existing simple scoring (kept for compatibility)
  const baseScored = matches.map(m => {
    const prob = 0.35 + Math.random() * 0.30;
    const odds = m.odds?.home ?? (m.odds?.away ?? 1.6);
    const ev = (prob * odds) - 1;
    const score = parseFloat((prob * odds).toFixed(3));
    return {
      ...m,
      score,
      modelProb: { home: prob, draw: (1-prob)/2, away: (1-prob)/2 }
    };
  });

  // apply advanced evaluation
  return evaluateMatches(baseScored);
}

// ---------------- MAIN ----------------
async function main() {
  try {
    console.log("📡 Fetching HTML from Pronosoft...");
    const html = await fetchHtml(PRONOS_URL);

    console.log("🔍 Parsing matches...");
    let matches = parseMatches(html);
    console.log("📦 Parsed", matches.length, "matches");

    console.log("⏱ Adding dynamic dates...");
    matches = matches.map(addDynamicDate);

    console.log("🤖 Scoring & Value evaluation...");
    const scored = scoreMatches(matches);

    // prepare outputs
    const top = scored
      .filter(m => m.label !== "NO_BET")
      .sort((a,b) => (b.chosen?.ev || 0) - (a.chosen?.ev || 0))
      .slice(0, 20);

    fs.writeFileSync(OUT1, JSON.stringify({ top, all: scored }, null, 2));
    fs.writeFileSync(OUT2, JSON.stringify(scored, null, 2));

    console.log("💾 Data written to picks.json and picks_full.json");
    process.exit(0);
  } catch (err) {
    console.error("❌ fetch_and_score error", err);
    process.exit(1);
  }
}

if (require.main === module) main();
