const fs = require("fs");

// ------------------------------
// GENERATE 5 SINGLE BETS
// ------------------------------

function generateSingleBets() {
    const bets = [];

    for (let i = 1; i <= 5; i++) {
        bets.push(`🎯 Pari simple ${i} : Équipe A vs Équipe B — Cote ${(1.4 + Math.random() * 1.2).toFixed(2)}`);
    }

    return bets;
}

// ------------------------------
// GENERATE 2 SAFE COMBINATIONS
// ------------------------------

function generateCombinations() {
    const combos = [];

    for (let i = 1; i <= 2; i++) {
        combos.push(
            `🧩 Combinaison sûre ${i} :\n` +
            `  - Match 1 : ${(1.20 + Math.random() * 0.20).toFixed(2)}\n` +
            `  - Match 2 : ${(1.20 + Math.random() * 0.20).toFixed(2)}\n` +
            `  - Cote totale : ${(1.4 + Math.random() * 0.4).toFixed(2)}`
        );
    }

    return combos;
}

// ------------------------------
// FORMAT FINAL
// ------------------------------

const singleBets = generateSingleBets();
const combos = generateCombinations();

let output = "🔥 **Prédictions du jour** 🔥\n\n";

output += "🎯 *PARIS SIMPLES*\n";
singleBets.forEach(bet => {
    output += "• " + bet + "\n";
});

output += "\n🧩 *COMBINAISONS SÛRES*\n";
combos.forEach(combo => {
    output += combo + "\n\n";
});

fs.writeFileSync("daily_bets.txt", output, "utf8");

console.log("daily_bets.txt généré avec succès !");
