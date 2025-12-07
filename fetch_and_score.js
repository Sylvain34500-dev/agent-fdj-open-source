// fetch_and_score.js
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const OUT1 = path.join(__dirname, "picks.json");
const OUT2 = path.join(__dirname, "picks_full.json");

// URL public Pronosoft (page pronostics). Ajuste si tu as une URL différente.
const PRONOS_URL = "https://pronosoft.com/fr/parions_sport/";

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }});
  if (!res.ok) throw new Error("HTTP " + res.status);
  return await res.text();
}

function parseMatches(html) {
  const $ = cheerio.load(html);
  const matches = [];

  // ATTENTION : les sélecteurs ci-dessous sont basés sur la structure actuelle visible.
  // Ils peuvent nécessiter un ajustement si le site change. On parcourt les blocs de match.
  $(".listeMatch .matchRow, .ticket-row, .odd-row").each((i, el) => {
    // try multiple patterns
  });

  // Implementation plus robuste : rechercher les cartes qui contiennent heure/teams/cotes
  $("div.ticket, div.match, li.match-item").each((i, el) => {
    try {
      const block = $(el);
      // Heure
      const time = block.find(".heure, .time, .ticket-hour").first().text().trim() || block.find(".time").text().trim();

      // equipes — essayer plusieurs sélecteurs
      const home = block.find(".home, .team-home, .equipe-left").first().text().trim() || block.find(".team-left").text().trim();
      const away = block.find(".away, .team-away, .equipe-right").first().text().trim() || block.find(".team-right").text().trim();

      // cotes : on cherche des nombres decimaux dans spans couverts
      const odds = [];
      block.find("span.cote, .odd, .price, .cot").each((i2, o) => {
        const t = $(o).text().trim().replace(",",".");
        if (/^\d+(\.\d+)?$/.test(t)) odds.push(Number(t));
      });

      // commentaire tooltip/description
      let comment = "";
      const tip = block.attr("title") || block.find(".tooltip, .desc, .commentaire").text();
      if (tip) comment = String(tip).trim();

      if ((home || away) && odds.length) {
        matches.push({
          time: time || null,
          home: home || "??",
          away: away || "??",
          odds,
          comment: comment || null,
          source: "pronosoft"
        });
      }
    } catch (e) {
      // ignore, next
    }
  });

  // Fallback: try to find simple table rows
  if (!matches.length) {
    $("table tr").each((i, tr) => {
      const tds = cheerio(tr).find("td");
      if (tds.length >= 3) {
        const home = cheerio(tds[0]).text().trim();
        const away = cheerio(tds[1]).text().trim();
        const maybeOdds = cheerio(tds[2]).text().trim().match(/(\d+[\.,]\d+)/g) || [];
        matches.push({ home, away, odds: (maybeOdds||[]).map(s => Number(s.replace(",", "."))), comment: null, source: "pronosoft" });
      }
    });
  }

  return matches;
}

async function main() {
  console.log("📥 Fetching pronosoft...");
  const html = await fetchHtml(PRONOS_URL);
  const matches = parseMatches(html);

  console.log("🔎 Found matches:", matches.length);
  fs.writeFileSync(OUT2, JSON.stringify({ fetchedAt: new Date().toISOString(), url: PRONOS_URL, matches }, null, 2));
  
  // Basic "score": pick best odds across markets (simple heuristic)
  const top = matches.map(m => {
    // pick best available odd (max) and side guess (1/N/2)
    const bestOdd = m.odds && m.odds.length ? Math.max(...m.odds) : null;
    const pickSide = bestOdd ? (bestOdd === m.odds[0] ? "home" : bestOdd === m.odds[1] ? "away" : "other") : "unknown";
    return { ...m, bestOdd: bestOdd || null, pickSide };
  }).sort((a,b) => (b.bestOdd||0) - (a.bestOdd||0));

  fs.writeFileSync(OUT1, JSON.stringify({ generatedAt: new Date().toISOString(), top }, null, 2));
  console.log("✅ picks written:", OUT1, OUT2);
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}
