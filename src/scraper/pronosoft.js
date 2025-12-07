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

    match.time = $(el).find(".heure").text().trim();
    match.teams = $(el)
      .find(".prono_match_titre")
      .text()
      .trim()
      .replace(/\s+/g, " ");

    match.odds = {
      home: $(el).find(".cote1").text().trim() || null,
      draw: $(el).find(".coteN").text().trim() || null,
      away: $(el).find(".cote2").text().trim() || null,
    };

    const popup = $(el).find(".infobulle").attr("data-html");
    match.comment = popup
      ? popup.replace(/<br\s*\/?>/g, "\n")
      : null;

    matches.push(match);
  });

  return matches;
}
