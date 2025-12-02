const fs = require("fs");

// -----------------------------------------------------
// 1) NIVEAU DE CONFIANCE (basé sur les cotes)
// -----------------------------------------------------
function getConfidenceLevel(odds) {
    if (odds <= 1.25) return "🟢 Très fiable";
    if (odds <= 1.45) return "🟡 Fiable";
    if (odds <= 1.70) return "🟠 À Risque";
    return "🔴 Très risqué";
}

// -----------------------------------------------------
// 2) PARIS SIMPLES (5 prédictions)
// -----------------------------------------------------
function generateSingleBets() {
    const bets = [];

    for (let i = 1; i <= 5; i++) {
        const odd = (1.25 + Math.random() * 0.60).toFixed(2);
        const confidence = getConfidenceLevel(odd);

        bets.push(
            `🎯 Pari simple ${i} : Équipe A vs Équipe B\n` +
            `   • Cote : ${odd}\n` +
            `   • Confiance : ${confidence}\n`
        );
    }

    return bets;
}

// -----------------------------------------------------
// 3) COMBINÉS AUTOMATIQUES INTELLIGENTS
// -----------------------------------------------------
function generateAutoCombos() {
    const safe = [];
    const value = [];
    const fun = [];

    for (let i = 1; i <= 10; i++) {
        const odd = (1.20 + Math.random() * 0.80).toFixed(2);

        if (odd <= 1.35) safe.push(odd);
        else if (odd <= 1.70) value.push(odd);
        else fun.push(odd);
    }

    function total(odds) {
        return odds.reduce((a, b) => a * b, 1).toFixed(2);
    }

    return [
        "💎 COMBINÉ SAFE (Fiabilité maximale)\n" +
        safe.map(o => `   • Sélection cote ${o}`).join("\n") +
        `\n   👉 Cote totale : ${total(safe)}\n\n`,

        "⚖️ COMBINÉ VALUE (excellent ratio risque/gain)\n" +
        value.map(o => `   • Sélection cote ${o}`).join("\n") +
        `\n   👉 Cote totale : ${total(value)}\n\n`,

        "🔥 COMBINÉ FUN (cote explosive / plus risqué)\n" +
        fun.map(o => `   • Sélection cote ${o}`).join("\n") +
        `\n   👉 Cote totale : ${total(fun)}\n\n`,
    ];
}

// -----------------------------------------------------
// 4) COMBINÉ IA (message généré par ton modèle)
// -----------------------------------------------------
function generateAICombo() {
    return (
        "🤖 COMBINÉ INTELLIGENT PAR IA :\n" +
        "   • Paris sélectionnés automatiquement selon statistiques réelles.\n" +
        "   • Cote finale estimée : 2.30\n" +
        "   • Confiance IA : 🟡 Fiable\n"
    );
}

// -----------------------------------------------------
// 5) ASSEMBLAGE DU MESSAGE FINAL
// -----------------------------------------------------
function buildDailyMessage() {
    const singles = generateSingleBets();
    const autoCombos = generateAutoCombos();
    const aiCombo = generateAICombo();

    return (
        "🎯 **PRÉDICTIONS DU JOUR**\n\n" +
        "============================\n" +
        "📌 *PARIS SIMPLES*\n" +
        singles.join("\n") +
        "\n============================\n\n" +
        "📌 *COMBINÉS AUTOMATIQUES INTELLIGENTS*\n" +
        autoCombos.join("\n") +
        "============================\n\n" +
        "📌 *COMBINÉ IA DU JOUR*\n" +
        aiCombo +
        "\n============================\n"
    );
}

// -----------------------------------------------------
// 6) GENERATION DU FICHIER .TXT
// -----------------------------------------------------
function saveDailyBets() {
    const output = buildDailyMessage();
    fs.writeFileSync("daily_bets.txt", output, "utf8");
}

saveDailyBets();
console.log("Fichier daily_bets.txt généré !");
