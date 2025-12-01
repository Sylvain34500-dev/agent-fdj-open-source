const fs = require("fs");

// -----------------------------------------
// 1) NIVEAU DE CONFIANCE (basé sur les cotes)
// -----------------------------------------
function getConfidenceLevel(odds) {
    if (odds <= 1.25) return "🔒 Très fiable";
    if (odds <= 1.45) return "🟡 Fiable";
    if (odds <= 1.70) return "⚠️ Risqué";
    return "🔴 Très risqué";
}

// -----------------------------------------
// 2) PARIS SIMPLES (5 prédictions)
// -----------------------------------------
function generateSingleBets() {
    const bets = [];

    for (let i = 1; i <= 5; i++) {
        const odd = +(1.25 + Math.random() * 0.60).toFixed(2);
        const confidence = getConfidenceLevel(odd);

        bets.push(
            `🎯 Pari simple ${i} : Équipe A vs Équipe B\n` +
            `   • Cote : ${odd}\n` +
            `   • Confiance : ${confidence}`
        );
    }

    return bets;
}

// -----------------------------------------
// 3) COMBINÉS INTELLIGENTS (analyse simple)
// -----------------------------------------
function createSmartCombo() {
    const match1 = +(1.18 + Math.random() * 0.15).toFixed(2);
    const match2 = +(1.20 + Math.random() * 0.20).toFixed(2);
    const match3 = +(1.22 + Math.random() * 0.18).toFixed(2);

    const total = (match1 * match2 * match3).toFixed(2);
    const confidence = getConfidenceLevel(total);

    return (
        `🧠 Combinaison intelligente :\n` +
        `   • Match 1 : ${match1}\n` +
        `   • Match 2 : ${match2}\n` +
        `   • Match 3 : ${match3}\n` +
        `   → Cote totale : ${total}\n` +
        `   → Confiance : ${confidence}\n`
    );
}

// -----------------------------------------
// 4) COMBINAISONS SÛRES (2 combos classiques)
// -----------------------------------------
function generateSafeCombinations() {
    const combos = [];

    for (let i = 1; i <= 2; i++) {
        const c1 = +(1.18 + Math.random() * 0.15).toFixed(2);
        const c2 = +(1.18 + Math.random() * 0.15).toFixed(2);
        const total = (c1 * c2).toFixed(2);
        const confidence = getConfidenceLevel(total);

        combos.push(
            `🧩 Combinaison sûre ${i} :\n` +
            `   • Match 1 : ${c1}\n` +
            `   • Match 2 : ${c2}\n` +
            `   → Cote totale : ${total}\n` +
            `   → Confiance : ${confidence}\n`
        );
    }

    return combos;
}

// -----------------------------------------
// 5) FORMATAGE FINAL
// -----------------------------------------
const singleBets = generateSingleBets();
const smartCombo = createSmartCombo();
const safeCombos = generateSafeCombinations();

let output = "🔥 **Prédictions du jour** 🔥\n\n";

// Paris simples
output += "🎯 **PARIS SIMPLES**\n";
singleBets.forEach(bet => {
    output += bet + "\n\n";
});

// Combinés intelligents
output += "🧠 **COMBINÉ INTELLIGENT**\n";
output += smartCombo + "\n";

// Combinaisons sûres
output += "🧩 **COMBINAISONS SÛRES**\n";
safeCombos.forEach(c => (output += c + "\n"));

// Sauvegarde
fs.writeFileSync("daily_bets.txt", output, "utf8");
console.log("✅ daily_bets.txt généré avec succès !");
