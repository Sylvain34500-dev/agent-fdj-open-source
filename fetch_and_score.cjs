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
    const teams = $(el).find(".psmt").text().trim();
    if (!teams.includes("-")) return;
    const [home, away] = teams.split("-").map(s => s.trim());

    const start = $(el).find(".psmh").text().trim();
    const odds = [];
    $(el).find(".psmc").each((_, oddEl) => {
      const v = $(oddEl).text().trim().replace(",", ".");
      if (!isNaN(v) && v !== "") odds.push(parseFloat(v));
    });

    matches.push({
      home,
      away,
      start: start || null,
      odds: odds.length ? odds[0] : null
    });
  });

  return matches;
}

function scoreMatches(matches) {
  return matches.map(m => {
    const prob = 0.33 + Math.random() * 0.3;
    return {
      home: m.home,
      away: m.away,
      start: m.start,
      odds: m.odds,
      pickSide: prob > 0.5 ? "home" : "away",
      modelProb: prob,
      ev: ((prob * m.odds) - 1) || 0,
      score: prob * (m.odds || 1)
    };
  });
}

async function main() {
  try {
    console.log("📡 Fetching HTML from Pronosoft...");
    const html = await fetchHtml(PRONOS_URL);

    console.log("🔍 Parsing matches...");
    const matches = parseMatches(html);
    console.log("📦 Parsed", matches.length, "matches");

    console.log("🤖 Scoring matches...");
    const scored = scoreMatches(matches);

    const top = scored
      .filter(x => x.odds)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    fs.writeFileSync(OUT1, JSON.stringify({ top, all: scored }, null, 2));
    fs.writeFileSync(OUT2, JSON.stringify(scored, null, 2));

    console.log("💾 Data written to picks.json and picks_full.json");

    console.log("⭐️ DEBUG SAMPLE ⭐️");
    console.log(JSON.stringify(top.slice(0,5), null, 2));

    process.exit(0);
  } catch (err) {
    console.error("❌ fetch_and_score error", err);
    process.exit(1);
  }
}

if (require.main === module) main();
