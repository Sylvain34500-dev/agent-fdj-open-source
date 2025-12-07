import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapePronosoft() {
  const url = "https://www.pronosoft.com/fr/parions_sport/";

  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const $ = cheerio.load(data);
  const matches = [];

  $(".prono_match").each((i, el) => {
    const match = {};

    // Heure
    match.time = $(el).find(".heure").text().trim();

    // Équipes
    match.teams = $(el)
      .find(".prono_match_titre")
      .text()
      .trim()
      .replace(/\s+/g, " ");

    // Score (si présent)
    match.score =
      $(el).find(".score").text().trim() ||
      $(el).find(".prono_score").text().trim() ||
      null;

    // Statut (Live, Terminé...)
    match.status =
      $(el).find(".live").text().trim() ||
      $(el).find(".termine").text().trim() ||
      "À venir";

    // Compétition
    match.league = $(el).find(".competition").text().trim() || null;

    // Icône compétition
    match.league_icon =
      $(el).find(".competition img").attr("src") || null;

    // Cotes principales
    match.odds = {
      home: $(el).find(".cote1").text().trim() || null,
      draw: $(el).find(".coteN").text().trim() || null,
      away: $(el).find(".cote2").text().trim() || null,
    };

    // Double chance si existant
    match.double_chance = {
      home_draw: $(el).find(".cote1N").text().trim() || null,
      draw_away: $(el).find(".coteN2").text().trim() || null,
      home_away: $(el).find(".cote12").text().trim() || null,
    };

    // Handicap ou autres cotes annexes
    match.extra_odds = [];
    $(el)
      .find(".cote_handicap, .cote_speciale")
      .each((i2, extra) => {
        match.extra_odds.push($(extra).text().trim());
      });

    // Infobulle (commentaire)
    const popup = $(el).find(".infobulle").attr("data-html");
    match.comment = popup
      ? popup.replace(/<br\s*\/?>/g, "\n")
      : null;

    matches.push(match);
  });

  return matches;
}

