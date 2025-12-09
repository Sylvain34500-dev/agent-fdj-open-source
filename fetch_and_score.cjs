function scoreMatches(matches) {
  return matches.map(m => {
    // ------------------------------------------------------
    // 🔢 PROBABILITÉ MODELE (on utilise le modelProb fourni)
    // ------------------------------------------------------
    const probHome = m.modelProb?.home ?? 0;
    const probAway = m.modelProb?.away ?? 0;
    const probDraw = m.modelProb?.draw ?? 0;

    // ------------------------------------------------------
    // 💰 ODDS
    // ------------------------------------------------------
    const oddsHome = m.odds?.home ?? null;
    const oddsDraw = m.odds?.draw ?? null;
    const oddsAway = m.odds?.away ?? null;

    // ------------------------------------------------------
    // 🧮 Expected Value (EV)
    // EV = p * odds - 1
    // ------------------------------------------------------
    const evHome = oddsHome ? (probHome * oddsHome - 1) : null;
    const evDraw = oddsDraw ? (probDraw * oddsDraw - 1) : null;
    const evAway = oddsAway ? (probAway * oddsAway - 1) : null;

    // ------------------------------------------------------
    // 🔢 Score global (utilisé pour ranking)
    // ------------------------------------------------------
    const scoreHome = oddsHome ? probHome * oddsHome : null;
    const scoreDraw = oddsDraw ? probDraw * oddsDraw : null;
    const scoreAway = oddsAway ? probAway * oddsAway : null;

    // ------------------------------------------------------
    // 🪙 KELLY CRITERION
    // Kelly = (p * (odds-1) - (1-p)) / (odds-1)
    // ------------------------------------------------------
    const calcKelly = (p, o) => {
      if (!o || p <= 0) return 0;
      const k = (p * o - 1) / (o - 1);
      return k > 0 && isFinite(k) ? k : 0;
    };

    const kellyHome = calcKelly(probHome, oddsHome);
    const kellyDraw = calcKelly(probDraw, oddsDraw);
    const kellyAway = calcKelly(probAway, oddsAway);

    // Fraction recommandée (SAFE)
    const kellyQuarterHome = kellyHome / 4;
    const kellyQuarterDraw = kellyDraw / 4;
    const kellyQuarterAway = kellyAway / 4;

    // ------------------------------------------------------
    // 🏆 CHOIX FINAL (le plus EV positif avec Kelly > 0)
    // ------------------------------------------------------
    const candidates = [
      {side:"home", ev:evHome, stake:kellyQuarterHome},
      {side:"draw", ev:evDraw, stake:kellyQuarterDraw},
      {side:"away", ev:evAway, stake:kellyQuarterAway},
    ].filter(x => x.ev !== null && x.ev > 0 && x.stake > 0);

    // default no bet
    let pickSide = "NoBet";
    let recommendedStake = 0;

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.ev - a.ev);
      pickSide = candidates[0].side;
      recommendedStake = parseFloat(candidates[0].stake.toFixed(3));
    }

    // ------------------------------------------------------
    // 🏁 OUTPUT FINAL
    // ------------------------------------------------------
    return {
      matchId: m.matchId ?? null,
      start: m.start ?? null,

      odds: m.odds,
      modelProb: m.modelProb,
      ev: {
        home: evHome,
        draw: evDraw,
        away: evAway
      },
      score: {
        home: scoreHome,
        draw: scoreDraw,
        away: scoreAway
      },
      kelly: {
        home: kellyHome,
        draw: kellyDraw,
        away: kellyAway,
        safe: {
          home: kellyQuarterHome,
          draw: kellyQuarterDraw,
          away: kellyQuarterAway
        }
      },

      pickSide,
      recommendedStake   // montant recommandé
    };
  });
}

