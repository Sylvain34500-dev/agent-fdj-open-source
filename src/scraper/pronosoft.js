// src/scraper/pronosoft.js
import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Scraper complet Pronosoft — version fusionnée + améliorée
 */
export async function scrapePronosoft() {
  const url = "https://www.pronosoft.com/fr/parions_sport/";

  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
  });

  const $ = cheerio.load(data);
  const matches = [];

  $(".prono_match").each((i, el) => {
    const m = $(el);

    const match = {};

    // Heure
    match.time = m.find(".heure").text().trim() || null;

    // Équipes
    match.teams = m.find(".prono_match_titre").text().trim().replace(/\s+/g, " ") || null;

    // Score
    match.score =
      m.find(".score").text().trim() ||
      m.find(".prono_score").text().trim() ||
      null;

    // Statut
    match.status =
      m.find(".live").text().trim() ||
      m.find(".termine").text().trim() ||
      "À venir";

    // Compétition (structure HTML parfois différente)
    match.league =
      m.closest(".bloc_competition")
        .find(".titre_competition")
        .first()
        .text()
        .trim() ||
      m.find(".competition").text().trim() ||
      null;

    // Icône compétition
    match.league_icon =
      m.find(".competition img").attr("src") ||
      m.closest(".bloc_competition").find(".titre_competition img").attr("src") ||
      null;

    // Cotes principales
    match.odds = {
      home: m.find(".cote1").text().trim() || null,
      draw: m.find(".coteN").text().trim() || null,
      away: m.find(".cote2").text().trim() || null,
      meta: m.find(".cotes").attr("data-cotes") || null // parfois des odds complètes dans attribut
    };

    // Double chance
    match.double_chance = {
      home_draw: m.find(".cote1N").text().trim() || null,
      draw_away: m.find(".coteN2").text().trim() || null,
      home_away: m.find(".cote12").text().trim() || null
    };

    // Handicap, spéciales, etc.
    match.extra_odds = [];
    m.find(".cote_handicap, .cote_speciale, .ps_sp, .ps_plusmoins").each((_, extra) => {
      match.extra_odds.push($(extra).text().trim());
    });

    // Popup infobulle (commentaire)
    const popupHtml = m.find(".infobulle").attr("data-html") || null;

    match.comment = popupHtml
      ? popupHtml
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/?[^>]+(>|$)/g, "") // retire HTML
          .trim()
      : null;

    matches.push(match);
  });

  return matches;
}
