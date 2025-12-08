// send_daily_report.js
// Lit generated_report.json (ou picks_full.json) et poste un message sur Telegram


const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');


// Lecture des variables : privilégier les variables d'env
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || (function(){
try { const cfg = require('./config.json'); return cfg.telegram && cfg.telegram.bot_token; } catch(e){ return null; }
})();
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || (function(){
try { const cfg = require('./config.json'); return cfg.telegram && cfg.telegram.chat_id; } catch(e){ return null; }
})();


if (!BOT_TOKEN || !CHAT_ID) {
console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID (env or config.json)');
process.exit(1);
}


const root = __dirname;
const reportPaths = [
path.join(root, 'generated_report.json'),
path.join(root, 'picks_full.json'),
path.join(root, 'picks.json')
];


let report = null;
for (const rp of reportPaths) {
if (fs.existsSync(rp)) {
try { report = JSON.parse(fs.readFileSync(rp,'utf8')); break; } catch(e) { /* ignore */ }
}
}


if (!report) {
console.error('Aucun fichier de rapport trouvé (generated_report.json, picks_full.json ou picks.json)');
process.exit(1);
}


// Normalise la structure attendue pour 'candidates' ou 'top'
let candidates = [];
if (report.candidates) candidates = report.candidates;
else if (report.top) {
// transform top into candidates
candidates = report.top.map((m, i) => ({
index: i+1,
matchId: m.matchId || `match_${i+1}`,
side: (m.pickSide || m.pick || 'unknown').toString().toUpperCase(),
modelProb: (m.modelProb||m.baseProb||{}).home ? (m.modelProb.home || m.modelProb.away || 0) : (m.modelProb||0),
confidence: m.score || m.confidence || 0,
odds: m.odds || m.odds || {}
}));
} else if (Array.isArray(report)) {
// picks_full.json sometimes is an array
candidates = report.map((m, i) => {
const modelProb = (m.modelProb && (m.modelProb.home || m.modelProb.away)) || (m.baseProb && (m.baseProb.home || m.baseProb.away)) || 0;
const side = (m.modelProb && m.modelProb.home && m.modelProb.home> (m.modelProb.away||0)) ? 'HOME' : 'AWAY';
return {
index: i+1,
matchId: m.matchId || `match_${i+1}`,
side,
modelProb,
})();
