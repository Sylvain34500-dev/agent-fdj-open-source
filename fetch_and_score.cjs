// fetch_and_score.cjs
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PICKS_MIN = 10;
const PRONOS_URL = "https://pronosoft.com/fr/parions_sport/";

const OUT1 = path.join(__dirname, 'picks.json');
const OUT2 = path.join(__dirname, 'picks_full.json');
const RAW_FIXT = path.join(__dirname, 'scraper/fixtures_raw.json');

// -----------------------------------------------
async function fetchHtml(url) {
  const res = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  return res.data;
}

// -----------------------------------------------
function parseMatches(html) {
  const $ = cheerio.load(html);
  const matches = [];

  $(".psmg").each((i, el) => {
    const teams = $(el).find(".psmt").text().trim();
    if (!teams.includes("-")) return;

    const [home, away] = teams.split("-").map(s => s.trim());

    const hour = $(el).find(".psmh").text().trim();
    // ⚡️ Construction automatique date complète du jour
    const today = new Date();
    const isoDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}T${hour}:00Z`;

    const oddsArr = [];
    $(el).find(".psmc").each((_, oddEl) => {
      const v = $(oddEl).text().trim().replace(",", ".");
      if (!isNaN(v) && v !== "") oddsArr.push(parseFloat(v));
    });

    matches.push({
      home,
      away,
      date: isoDate,
      odds: {
        home: oddsArr[0] || null,
        draw: oddsArr[1] || null,
        away: oddsArr[2] || null
      }
    });
  });

  return matches;
}

// -----------------------------------------------
function scoreMatches(matches) {
  return matches.map(m => {
    const prob = 0.33 + Math.random() * 0.3;
    const choice = prob > 0.5 ? "home" : "away";
    const chosenOdds = m.odds[choice];

    return {
      ...m,
      pick: choice,
      modelProb: prob,
      ev: chosenOdds ? ((prob * chosenOdds) - 1) : 0,
      score: chosenOdds ? (prob * chosenOdds) : 0
    };
  });
}

// -----------------------------------------------
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
      .filter(x => x.score)
      .sort((a, b) => b.score - a.score)
      .slice(0, PICKS_MIN);

    // 💾 Sauvegarde
    fs.writeFileSync(OUT1, JSON.stringify({ top, all: scored }, null, 2));
    fs.writeFileSync(OUT2, JSON.stringify(scored, null, 2));
    fs.writeFileSync(RAW_FIXT, JSON.stringify({ fixtures: matches }, null, 2));

    console.log("💾 Data written to picks.json / picks_full.json / fixtures_raw.json");

    console.log("⭐️ DEBUG TOP ⭐️");
    console.log(JSON.stringify(top.slice(0,5), null, 2));

    process.exit(0);
  } catch (err) {
    console.error("❌ fetch_and_score error", err);
    process.exit(1);
  }
}

if (require.main === module) main();
