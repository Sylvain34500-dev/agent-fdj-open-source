// manual_send.cjs
const { execSync } = require("child_process");

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

run("node src/fetch_and_score.cjs");
run("node src/index.cjs");
run("node src/send_daily_report.cjs");

console.log("📨 Rapport envoyé manuellement !");
