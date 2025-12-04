// fetch_and_score.js (scraper Flashscore - version starter)
// NOTE: fragile selon les changements HTML du site. Use responsibly.

const fetch = require("node-fetch");
const cheerio = require("cheerio");
const fs = require("fs").promises;
const pRetry = require("p-retry");

const BASE_URL = "https://www.flashscore.com/football/";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const OUTPUT_PICKS = "./picks.json";
const OUTPUT_FULL = "./picks_full.json";
const OUTPUT_DAILY = "./daily_bets.txt";

// helper fetch with headers + retry
async function safeFetch(url) {
  return pRetry(async () => {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9" }
    });
    if (!res.ok) throw new Error(`Fetch ${url} failed ${res.status}`);
    return res.text();
  }, { retries: 2 });
}

// parse main football page to extract list of matches (best-effort)
async function getMatchesList() {
  const html = await safeFetch(BASE_URL);
  const $ = cheerio.load(html);

  const matches = [];

  // Flashscore complex structure — on cherche les lignes d'événement
  // Sélecteurs : tenter d'attraper les événements ; adapter si nécessaire
  $("div.event__match").each((i, el) => {
    try {
      const $el = $(el);
      const home = $el.find(".event__participant--home").text().trim();
      const away = $el.find(".event__participant--away").text().trim();
      const time = $el.find(".event__time").text().trim() || $el.attr("data-real-date") || "";
      // Odds: flashscore may include bookie odds inside .odds or .odds__value
      // We'll try a few selectors
      let oddsHome = null, oddsAway = null, oddsDraw = null;
      const oHome = $el.find(".odds .odds__value--home").first().text().trim();
      const oAway = $el.find(".odds .odds__value--away").first().text().trim();
      const oDraw = $el.find(".odds .odds__value--draw").first().text().trim();
      if (oHome) oddsHome = parseFloat(oHome.replace(",", "."));
      if (oAway) oddsAway = parseFloat(oAway.replace(",", "."));
      if (oDraw) oddsDraw = parseFloat(oDraw.replace(",", "."));

      // fallback: some markup stores odds in data attributes
      if (!oddsHome && $el.attr("data-odds-home")) {
        oddsHome = parseFloat($el.attr("data-odds-home"));
      }

      matches.push({
        home, away, time,
        odds: { home: oddsHome, draw: oddsDraw, away: oddsAway },
        source: BASE_URL
      });
    } catch (err) {
      // ignore single parse errors
    }
  });

  return matches;
}

// Try to fetch last 5 results for a team by scraping its team page (best-effort)
async function getTeamForm(teamName) {
  // Flashscore team urls are not direct; we try a search approach via the site search
  // fallback: return neutral form 0.5 if we can't get data
  try {
    const searchUrl = `https://www.flashscore.com/search/?q=${encodeURIComponent(teamName)}`;
    const html = await safeFetch(searchUrl);
    const $ = cheerio.load(html);

    // try to find link to the team page
    const teamLink = $("a[href*='/team/']").first().attr("href");
    if (!teamLink) return 0.5;

    const teamPage = await safeFetch("https://www.flashscore.com" + teamLink);
    const $$ = cheerio.load(teamPage);

    // flashscore recent results often appear with classes like .event__scores or .result
    const results = [];
    $$(".event__match--result").each((i, el) => {
      if (i >= 5) return;
      const txt = $$(el).text().trim();
      // crude parse: W/D/L by looking for "1-0", "0-2", etc comparing home/away is tricky
      // fallback: can't parse reliably -> break
      results.push(txt);
    });

    // If we couldn't extract results, fallback neutral
    if (results.length === 0) return 0.5;

    // crude scoring: if last result contains teamName as home or away we can't easily decide W/D/L.
    // Simpler heuristic: count appearances of digits where team likely won (this is fragile).
    // So return a neutral 0.55 if at least one win, else 0.45
    const joined = results.join(" ");
    if (joined.match(/[1-9]-0|[2-9]-[0-9]/)) return 0.55;
    return 0.5;
  } catch (err) {
    return 0.5;
  }
}

// Simple model to compute win probabilities from 'form' / home advantage
function computeModelProb(homeForm, awayForm) {
  const homeAdv = 0.06; // ~6% home advantage
  const raw = 0.5 + (homeForm - awayForm) * 0.2 + homeAdv;
  return Math.min(0.95, Math.max(0.05, raw));
}

// Compute EV given market odds and model prob
function computeEV(odds, modelProb) {
  if (!odds || odds <= 1) return -999;
  const implied = 1 / odds;
  return (modelProb - implied) * odds;
}

async function main() {
  console.log("🔎 Scraping matches list...");
  const matches = await getMatchesList();

  if (!matches || matches.length === 0) {
    console.error("❌ Aucune match récupéré — vérifie les sélecteurs ou la connexion.");
    process.exit(1);
  }

  console.log(`✅ ${matches.length} matches trouvés (best-effort).`);
  const full = [];

  for (const m of matches.slice(0, 60)) { // limit to 60 to be safe
    try {
      // get simple form approximations
      const homeForm = await getTeamForm(m.home);
      const awayForm = await getTeamForm(m.away);

      const modelProbHome = computeModelProb(homeForm, awayForm);
      const modelProbAway = 1 - modelProbHome;

      const evHome = m.odds.home ? computeEV(m.odds.home, modelProbHome) : null;
      const evAway = m.odds.away ? computeEV(m.odds.away, modelProbAway) : null;

      // decide pick
      let pickSide = null;
      let pickEv = 0;
      if (evHome !== null && evHome > 0 && (!evAway || evHome >= evAway)) {
        pickSide = "home";
        pickEv = evHome;
      } else if (evAway !== null && evAway > 0) {
        pickSide = "away";
        pickEv = evAway;
      }

      full.push({
        home: m.home,
        away: m.away,
        time: m.time,
        odds: m.odds,
        form: { home: homeForm, away: awayForm },
        modelProb: { home: modelProbHome, away: modelProbAway },
        ev: { home: evHome, away: evAway },
        pick: pickSide,
        pickEv
      });

      // small delay to avoid hammering the site
      await new Promise(r => setTimeout(r, 700));
    } catch (err) {
      console.warn("warning match:", err.message);
    }
  }

  // Filter picks positive EV
  const picksAll = full.filter(p => p.pick && p.pickEv > 0).map(p => ({
    home: p.home,
    away: p.away,
    time: p.time,
    pickSide: p.pick,
    odds: p.odds[p.pick] || null,
    modelProb: p.modelProb[p.pick === 'home' ? 'home' : 'away'],
    ev: p.pickEv
  }));

  // sort by EV desc
  const top = picksAll.sort((a,b) => (b.ev || 0) - (a.ev || 0)).slice(0, 10);

  // write outputs
  await fs.writeFile(OUTPUT_FULL, JSON.stringify(full, null, 2));
  await fs.writeFile(OUTPUT_PICKS, JSON.stringify({ top, all: picksAll }, null, 2));

  // generate daily_bets.txt human readable
  let txt = "🎯 PARIS DU JOUR — Agent Automatisé (Scraper)\n\n";
  if (top.length === 0) {
    txt += "⚠️ Aucun pick EV+ trouvé dans les données récupérées.\n";
  } else {
    txt += "🔥 TOP PICKS (basé sur EV+)\n";
    top.forEach((p, i) => {
      txt += `${i+1}. ${p.home} vs ${p.away} — Pick: ${p.pickSide.toUpperCase()} — Cote: ${p.odds ? p.odds.toFixed(2) : "?"} — EV: ${p.ev.toFixed(3)}\n`;
    });
  }

  await fs.writeFile(OUTPUT_DAILY, txt);

  console.log("✔ Picks generated:", OUTPUT_PICKS);
  console.log("✔ daily_bets.txt generated:", OUTPUT_DAILY);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
