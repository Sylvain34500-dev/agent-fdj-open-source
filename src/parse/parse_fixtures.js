import fs from "fs";
import path from "path";

export function parseFixtures() {
  const filePath = path.join(process.cwd(), "src", "data", "fixtures_raw.json");

  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const parsed = raw.fixtures.map((m, i) => ({
    matchId: `${m.home}-${m.away}-${i}`,
    home: m.home,
    away: m.away,
    start: m.date,
    odds: m.odds,
    probModel: {
      home: 1 / m.odds.home / (1 / m.odds.home + 1 / m.odds.away),
      away: 1 / m.odds.away / (1 / m.odds.home + 1 / m.odds.away)
    }
  }));

  return parsed;
}
