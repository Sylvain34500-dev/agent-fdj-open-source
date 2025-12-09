// fetch_and_score.cjs
// CommonJS version — safe for GitHub Actions & Render

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OUT1 = path.join(__dirname, 'picks.json');
const OUT2 = path.join(__dirname, 'picks_full.json');

// Change this URL if needed
const PRONOS_URL = 'https://pronosoft.com/fr/parions_sport/';

async function fetchHtml(url) {
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)' },
    responseType: 'text',
    timeout: 20_000
  });
  return res.data;
}

function parseMatches(html) {
  const $ = cheerio.load(html);
  const matches = [];

  // Generic table-based fallback + some selectors
  $('table tr').each((i, tr) => {
    const tds = $(tr).find('td');
    if (tds.length >= 2) {
      const home = $(tds[0]).text().trim();
      const away = $(tds[1]).text().trim();
      const maybeOdds = ($(tds[2]).text() || '').trim().match(/(\d+[\.,]\d+)/g) || [];
      const odds = maybeOdds.map(s => Number(s.replace(',', '.'))).filter(n => !Number.isNaN(n));
      if (home || away) {
        matches.push({ home: home || null, away: away || null, odds, source: 'pronosoft' });
      }
    }
  });

  // If nothing found, try some other blocks
  if (!matches.length) {
    // generic selectors fallback
    $('div.ticket, div.match, li.match-item').each((i, el) => {
      try {
        const block = $(el);
        const home = block.find('.home, .team-home, .equipe-left, .team-left').first().text().trim();
        const away = block.find('.away, .team-away, .equipe-right, .team-right').first().text().trim();
        const odds = [];
        block.find('span.cote, .odd, .price, .cot').each((ii, o) => {
          const t = $(o).text().trim().replace(',', '.');
          if (/^\d+(\.\d+)?$/.test(t)) odds.push(Number(t));
        });
        if ((home || away) && odds.length) matches.push({ home, away, odds, source: 'pronosoft' });
      } catch (err) { /* ignore single block errors */ }
    });
  }

  return matches;
}

function produceTop(matches) {
  return matches.map(m => {
    const bestOdd = (m.odds && m.odds.length) ? Math.max(...m.odds) : null;
    const pickSide = bestOdd
      ? (bestOdd === m.odds[0] ? 'home' : bestOdd === m.odds[1] ? 'away' : 'other')
      : 'unknown';
    return { ...m, bestOdd, pickSide };
  }).sort((a,b) => (b.bestOdd || 0) - (a.bestOdd || 0));
}

async function main() {
  try {
    console.log('📥 Fetching pronosoft...');
    const html = await fetchHtml(PRONOS_URL);
    const matches = parseMatches(html);
    console.log('🔎 Found matches:', matches.length);

    fs.writeFileSync(OUT2, JSON.stringify({ fetchedAt: new Date().toISOString(), url: PRONOS_URL, matches }, null, 2));
    const top = produceTop(matches);
    fs.writeFileSync(OUT1, JSON.stringify({ generatedAt: new Date().toISOString(), top }, null, 2));

    console.log('✅ Picks written to', OUT1, OUT2);
    process.exit(0);
  } catch (err) {
    console.error('❌ fetch_and_score error:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

if (require.main === module) main();
