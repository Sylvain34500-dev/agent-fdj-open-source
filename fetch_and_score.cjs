// fetch_and_score.cjs
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const OUT1 = path.join(__dirname, "picks.json");
const OUT2 = path.join(__dirname, "picks_full.json");

const PRONOS_URL = "https://pronosoft.com/fr/parions_sport/";

async function fetchHtml(url) {
  const res = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  return res.data;
}

/******************************
 * PARSING CORRECT
 ******************************/
function parseMatches(html) {
  const $ = cheerio.load(html);
  const matches = [];

  $("tr.psm").each((i, row) => {
    const teams = $(row).find(".psmt").text().trim();
    if (!teams.includes("-")) return;
    const [home, away] = teams.split("-").map(s => s.trim());

    const oddsArr = [];
    $(row).find(".psmc").each((_, cell) => {
      const v = $(cell).text().trim().replace(",", ".");
      if (!isNaN(v) && v !== "") oddsArr.push(parseFloat(v));
    });

    const odds = oddsArr.length ? oddsArr[0] : null;

    matches.push({
      home,
      away,
      odds
    });
  });

  return matches;
}

/******************************
 * DATE DYNAMIQUE
 ******************************/
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

/******************************
 * SCORING
 ******************************/
function scoreMatches(matches) {
  return matches.map(m => {
    const modelProb = 0.35 + Math.random() * 0.30;
    const odds = m.odds || 1.5;
    const ev = (modelProb * odds) - 1;
    const score = modelProb * odds;

    return {
      ...m,
      pickSide: modelProb > 0.50 ? "home" : "away",
      modelProb: parseFloat(modelProb.toFixed(3)),
      ev: parseFloat(ev.toFixed(3)),
      score: parseFloat(score.toFixed(3))
    };
  });
}

/******************************
 * MAIN PROGRAM
 ******************************/
async function main() {
  try {
    console.log("📡 Fetching HTML...");
    const html = await fetchHtml(PRONOS_URL);

    console.log("🔍 Parsing matches...");
    let matches = parseMatches(html);
    console.log("📦 Parsed", matches.length, "matches");

    console.log("⏱ Adding dynamic dates...");
    matches = matches.map(addDynamicDate);

    console.log("🤖 Scoring...");
    const scored = scoreMatches(matches);

    const top = scored
      .filter(x => x.odds)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    fs.writeFileSync(OUT1, JSON.stringify({ top, all: scored }, null, 2));
    fs.writeFileSync(OUT2, JSON.stringify(scored, null, 2));

    console.log("💾 DONE!");

    process.exit(0);
  } catch (err) {
    console.error("❌ fetch_and_score error", err);
    process.exit(1);
  }
}

if (require.main === module) main();

