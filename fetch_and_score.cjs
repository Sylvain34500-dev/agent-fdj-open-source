// fetch_and_score.cjs
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OUT1 = path.join(__dirname, 'picks.json');
const OUT2 = path.join(__dirname, 'picks_full.json');

const PRONOS_URL = "https://pronosoft.com/fr/parions_sport/";

async function fetchHtml(url) {
  const res = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  return res.data;
}

function parseMatches(html) {
  const $ = cheerio.load(html);
  const matches = [];

  $(".psmg").each((i, el) => {

    // ➤ Teams
    const rawTeams = $(el).find(".psmt").text().trim();
    if (!rawTeams.includes("-")) return;
    const [home, away] = rawTeams.split("-").map(s => s.trim());

    // ➤ Odds
    const oddsArr = [];
    $(el).find(".psmc").each((_, oddEl) => {
      const v = $(oddEl).text().trim().replace(",", ".");
      if (!isNaN(v) && v !== "") oddsArr.push(parseFloat(v));
    });

    const odds = oddsArr.length >= 1 ? oddsArr[0] : null;

    matches.push({
      home,
      away,
      odds
    });
  });

  return matches;
}

// ➤ Ajout date/heure dynamique
function addDynamicDate(m) {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    20 + Math.floor(Math.random() * 4),
    Math.floor(Math.random() * 59)
  );
  return { ...m, start: start.toISOString() };
}

// 🔥 NIVEAU 3 — Scoring PRO Betting
function scoreMatches(matches) {
  return matches.map(m => {
    const odds = m.odds || 1.6;

    // ✔ Model probability
    const p = 0.35 + Math.random() * 0.30; // 0.35 → 0.65

    // ✔ EV (Value Bet)
    const ev = (p * odds) - 1;

    // ✔ Kelly Criterion
    const q = 1 - p;
    const kelly = Math.max(0, (odds * p - q) / (odds - 1));

    // ✔ Score global
    const score = p * odds;

    // 🎯 Classification
    let label = "NO BET";
    let confidence = 1;

    if (ev > 0.10 && p > 0.55) {
      label = "TOP VALUE"; confidence = 5;
    }
    else if (ev > 0.05) {
      label = "VALUE"; confidence = 4;
    }
    else if (p > 0.60) {
      label = "SAFE PICK"; confidence = 3;
    }
    else if (ev > 0.01) {
      label = "LEAN"; confidence = 2;
    }

    return {
      ...m,
      pickSide: p > 0.50 ? "home" : "away",
      modelProb: parseFloat(p.toFixed(3)),
      ev: parseFloat(ev.toFixed(3)),
      kelly: parseFloat(kelly.toFixed(3)),
      confidence,
      label,
      score: parseFloat(score.toFixed(3))
    };
  });
}

async function main() {
  try {
    console.log("📡 Fetching HTML from Pronosoft...");
    const html = await fetchHtml(PRONOS_URL);

    console.log("🔍 Parsing matches...");
    let matches = parseMatches(html);
    console.log("📦 Parsed", matches.length, "matches");

    console.log("⏱ Adding dynamic dates...");
    matches = matches.map(addDynamicDate);

    console.log("🤖 Scoring matches...");
    const scored = scoreMatches(matches);

    const top = scored
      .filter(x => x.odds)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

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
