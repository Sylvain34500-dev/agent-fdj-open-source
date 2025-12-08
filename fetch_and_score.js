import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

async function fetchData() {
  const res = await axios.get("https://www.pronosoft.com/fr/loto/statistiques/");
  const html = res.data;

  // Cheerio ESM fix ⬇️
  const $ = cheerio.load(html);

  // Exemple de récupération de données
  let results = [];

  $("table tbody tr").each((i, row) => {
    const cols = $(row).find("td");
    results.push({
      number: $(cols[0]).text().trim(),
      frequency: $(cols[1]).text().trim()
    });
  });

  console.log("DATA SCRAPED:", results);

  // Save to JSON
  fs.writeFileSync("results.json", JSON.stringify(results, null, 2));
}

fetchData().catch(err => console.error("ERROR:", err));
