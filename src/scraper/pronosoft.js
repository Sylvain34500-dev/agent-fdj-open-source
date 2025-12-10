// src/scraper/pronosoft.js
// Scraper minimal & robuste pour Pronosoft -> écrit src/data/raw_pronosoft.json
// Utilise axios + cheerio (assure-toi que package.json contient axios & cheerio)

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const PRONOS_URL = "https://pronosoft.com/fr/parions_sport/";
const OUT_RAW = path.join(__dirname, "..", "data", "raw_pronosoft.json");

async function fetchHtml(url) {
  const res = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
    timeout: 15000
  });
  return res.data;
}

function parseMatchesFromHtml(html) {
  const $ = cheerio.load(html);
  const matches = [];

  // Try multiple selectors to be robust
  const rows = $("tr.psm").length ? $("tr.psm") :
               $(".psmg").length ? $(".psmg") :
               $(".match-row").length ? $(".match-row") :
               $("div.match, li.match");

  rows.each((i, el) => {
    const row = $(el);

    // teams
    const teamsText = row.find(".psmt").text().trim() ||
                      row.find(".teams").text().trim() ||
                      row.find(".match-title").text().trim() ||
                      row.text().trim();

    if (!teamsText || !teamsText.includes("-")) {
      // try to find "A vs B" like content
      return;
    }

    const parts = teamsText.split("-").map(s => s.trim());
    const home = parts[0] || `HOME_${i}`;
    const away = parts[1] || `AWAY_${i}`;

    // time / start
    let startText = row.find(".psmh").text().trim() ||
                    row.find(".time").text().trim() ||
                    row.find(".match-time").text().trim() ||
                    null;

    // normalize to ISO — if startText is like "21:00" assume today
    let start = null;
    if (startText) {
      // try to parse HH:MM
      const hhmm = startText.match(/([01]?\d|2[0-3])[:h]([0-5]\d)/);
      if (hhmm) {
        const now = new Date();
        const hh = Number(hhmm[1]);
        const mm = Number(hhmm[2]);
        const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm);
        start = dt.toISOString();
      } else {
        // fallback: keep raw
        start = startText;
      }
    }

    // odds: try to find three numeric odds in the row
    const oddsArr = [];
    row.find(".psmc, .odds, .coef, .price, .odd").each((_, cell) => {
      const tx = $(cell).text().trim().replace(",", ".");
      if (!isNaN(tx) && tx !== "") oddsArr.push(parseFloat(tx));
    });

    // fallback: find numbers in text
    if (oddsArr.length === 0) {
      const numbers = row.text().match(/\d{1,2}[,\.\d]?\d?/g);
      if (numbers && numbers.length) {
        for (const n of numbers) {
          const v = n.replace(",", ".");
          if (!isNaN(v)) oddsArr.push(parseFloat(v));
        }
      }
    }

    const odds = {
      home: oddsArr[0] ?? null,
      draw: oddsArr[1] ?? null,
      away: oddsArr[2] ?? null
    };

    // quick analysis text
    const analysis = row.find(".psm-comment, .analysis, .psm-txt").text().trim() || null;

    // attempt to detect injury words
    const lower = row.text().toLowerCase();
    const injuriesDetected = {
      home: lower.includes("bless") && lower.includes(home.toLowerCase()) ? 1 : 0,
      away: lower.includes("bless") && lower.includes(away.toLowerCase()) ? 1 : 0
    };

    // h2h or form blocks (best effort)
    const h2hText = row.find(".h2h, .history, .face-to-face").text().trim() || null;
    const formText = row.find(".form, .last-results").text().trim() || null;

    // Build simple object
    matches.push({
      matchId: `${home.replace(/\s+/g, "_")}-${away.replace(/\s+/g, "_")}-${i}`,
      home,
      away,
      start,
      odds,
      analysis,
      injuries: injuriesDetected,
      h2hText,
      formText
    });
  });

  return matches;
}

async function main() {
  try {
    console.log("[pronosoft] fetching page...");
    const html = await fetchHtml(PRONOS_URL);

    console.log("[pronosoft] parsing...");
    const matches = parseMatchesFromHtml(html);

    // write output folder if needed
    const outDir = path.dirname(OUT_RAW);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(OUT_RAW, JSON.stringify({ source: "pronosoft", generatedAt: new Date().toISOString(), matches }, null, 2));
    console.log(`[pronosoft] wrote ${matches.length} matches to ${OUT_RAW}`);
  } catch (err) {
    console.error("[pronosoft] error", err.message || err);
    // write empty file to avoid pipeline break
    const outDir = path.dirname(OUT_RAW);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(OUT_RAW, JSON.stringify({ source: "pronosoft", generatedAt: new Date().toISOString(), matches: [], error: err.message }, null, 2));
    process.exit(0);
  }
}

if (require.main === module) main();

