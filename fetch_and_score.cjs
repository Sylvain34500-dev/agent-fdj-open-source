function scoreMatches(matches) {
  return matches.map(m => {
    // --- MODEL PROB ---
    const prob = 0.42 + Math.random() * 0.18; // 0.42 → 0.60 (moyenne)

    // --- ODDS ---
    const odds = m.odds || 1.70;

    // --- EXPECTED VALUE (EV) ---
    const ev = (prob * odds) - 1;

    // --- SCORE internal ranking ---
    const score = prob * odds;

    // -------------------------------
    //     KELLY CRITERION
    // -------------------------------
    // Kelly si probabilité > 1/odds
    let kellyFull = (prob * odds - 1) / (odds - 1);
    if (kellyFull < 0 || !isFinite(kellyFull)) kellyFull = 0;

    // Kelly 1/2
    const kellyHalf = kellyFull / 2;

    // Kelly 1/4  → MODE RECOMMANDÉ
    const kellyQuarter = kellyFull / 4;

    return {
      matchId: `${m.home}-${m.away}-${m.start}`,
      home: m.home,
      away: m.away,

      start: m.start ?? null,
      odds,

      // 📊 Probabilités utilisées
      modelProb: parseFloat(prob.toFixed(3)),

      // 💰 Expected Value
      ev: parseFloat(ev.toFixed(3)),

      // 🔢 Score ranking
      score: parseFloat(score.toFixed(3)),

      // 🪙 Kelly outputs
      kelly: {
        full: parseFloat(kellyFull.toFixed(3)),
        half: parseFloat(kellyHalf.toFixed(3)),
        quarter: parseFloat(kellyQuarter.toFixed(3)),
      },

      // ✔ Stake final recommandé (SAFE)
      recommendedStake: parseFloat(kellyQuarter.toFixed(3)), // 0–0.05 typiquement

      // 🏆 Pick side
      pickSide: prob > (1 / odds) ? "home" : "away"
    };
  });
}


