// index.js
// Agent FDJ simple : charge odds_fdj.json -> calcule EV et Kelly -> écrit picks.json

const fs = require('fs');

const INPUT = 'odds_fdj.json';
const OUTPUT = 'picks.json';

// Config
const MIN_ODDS_FOR_HIGH_RISK = 4.0;
const MIN_VALUE = 0.02;
const KELLY_FRACTION = 0.25;
const ALPHA = 1.1; // param du modèle

// ----------- LECTURE SÉCURISÉE ----------- //
function readInput() {
  if (!fs.existsSync(INPUT)) {
    console.error(`❌ Fichier introuvable : ${INPUT}.`);
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(INPUT, 'utf8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      console.error("❌ Le fichier odds_fdj.json doit contenir un tableau JSON.");
      process.exit(1);
    }

    return parsed;

  } catch (err) {
    console.error("❌ Erreur lors du parsing de odds_fdj.json :", err.message);
    process.exit(1);
  }
}

// ----------- CALCULS ----------- //
function impliedProbabilities(arr) {
  const grouped = {};
  arr.forEach((r, i) => {
    const key = `${r.event_id}::${r.market}`;
    grouped[key] = grouped[key] || [];
    grouped[key].push(i);
  });

  const res = arr.map(r => ({
    ...r,
    odds: Number(r.odds)
  }));

  Object.keys(grouped).forEach(key => {
    const idxs = grouped[key];
    let sum = 0;

    idxs.forEach(i => {
      res[i].p_imp_raw = 1.0 / res[i].odds;
      sum += res[i].p_imp_raw;
    });

    idxs.forEach(i => {
      res[i].p_imp_norm = res[i].p_imp_raw / sum;
    });
  });

  return res;
}

function exampleModelProbability(arr) {
  const grouped = {};
  arr.forEach((r, i) => {
    const key = `${r.event_id}::${r.market}`;
    grouped[key] = grouped[key] || [];
    grouped[key].push(i);
  });

  const res = arr.map(r => ({ ...r }));
  Object.keys(grouped).forEach(key => {
    const idxs = grouped[key];
    let sum = 0;

    idxs.forEach(i => {
      res[i].score = 1.0 / Math.pow(res[i].odds, ALPHA);
      sum += res[i].score;
    });

    idxs.forEach(i => {
      res[i].p_model = res[i].score / sum;
    });
  });

  return res;
}

function expectedValue(arr) {
  return arr.map(r => ({
    ...r,
    EV: r.odds * r.p_model - 1.0
  }));
}

function kellyFraction(odds, p_model) {
  const b = odds - 1.0;
  const q = 1.0 - p_model;
  if (b <= 0) return 0.0;
  const f = (b * p_model - q) / b;
  return Math.max(0, f);
}

function applyKelly(arr) {
  return arr.map(r => ({
    ...r,
    kelly: KELLY_FRACTION * kellyFraction(r.odds, r.p_model)
  }));
}

function pickHighRisk(arr) {
  return arr
    .filter(r => r.odds >= MIN_ODDS_FOR_HIGH_RISK && r.EV >= MIN_VALUE)
    .sort((a, b) => b.EV - a.EV);
}

// ----------- ÉCRITURE ----------- //
function writeOutput(picks) {
  try {
    fs.writeFileSync(OUTPUT, JSON.stringify(picks, null, 2), 'utf8');
    console.log(`✅ ${picks.length} picks sauvegardés dans ${OUTPUT}`);
  } catch (err) {
    console.error("❌ Impossible d'écrire le fichier picks.json :", err.message);
  }
}

// ----------- MAIN ----------- //
function main() {
  const data = readInput();
  let s = impliedProbabilities(data);
  s = exampleModelProbability(s);
  s = expectedValue(s);
  s = applyKelly(s);

  const picks = pickHighRisk(s);
  writeOutput(picks);

  if (picks.length === 0) {
    console.log('⚠️ Aucun pick trouvé avec les critères actuels.');
  } else {
    console.log('🎯 Top picks :');
    picks.slice(0, 10).forEach(p => {
      console.log(
        `- ${p.event_id} | ${p.market} | ${p.runner} @ ${p.odds} ` +
        `| EV=${p.EV.toFixed(3)} | kelly=${p.kelly.toFixed(3)}`
      );
    });
  }
}

main();
