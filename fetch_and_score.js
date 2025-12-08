// fetch_and_score.js  (ESM FIX)
import fetch from "node-fetch";
import cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT1 = path.join(__dirname, "picks.json");
const OUT2 = path.join(__dirname, "picks_full.json");

const PRONOS_URL = "https://pronosoft.com/fr/parions_sport/";

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return await res.text();
}

function parseMatches(html) {
  const $ = cheerio.load(html);
  const matches = [];

  $("table tr").each((i, tr) => {
    const tds = cheerio(tr).find("td");
    if (tds.length >= 3) {
      const home = cheerio(tds[0]).text().trim();
      const away = cheerio(tds[1]).text().trim();
      const maybeOdds = cheerio(tds[2]).text().trim().match(/(\d+[\.,]\d+)/g) || [];
      matches.push({
        home,
        away,
        odds: maybeOdds.map(s => Number(s.replace(",", "."))),
        source: "pronosoft"
      });
    }
  });

  return matches;
}

async function main() {
  console.log("📥 Fetching pronosoft...");
  const html = await fetchHtml(PRONOS_URL);
  const matches = parseMatches(html);

  console.log("🔎 Found matches:", matches.length);

  fs.writeFileSync(
    OUT2,
    JSON.stringify({ fetchedAt: new Date().toISOString(), url: PRONOS_URL, matches }, null, 2)
  );

  const top = matches
    .map(m => {
      const bestOdd = m.odds && m.odds.length ? Math.max(...m.odds) : null;
      const pickSide = bestOdd
        ? bestOdd === m.odds[0]
          ? "home"
          : bestOdd === m.odds[1]
            ? "away"
            : "other"
        : "unknown";
      return { ...m, bestOdd, pickSide };
    })
    .sort((a, b) => (b.bestOdd || 0) - (a.bestOdd || 0));

  fs.writeFileSync(
    OUT1,
    JSON.stringify({ generatedAt: new Date().toISOString(), top }, null, 2)
  );

  console.log("✅ Picks written.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
