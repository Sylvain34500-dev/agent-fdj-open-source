import threading
import time
from flask import Flask
import subprocess
import os

app = Flask(__name__)

# --- CONFIGURATION ---
CRON_INTERVAL_MINUTES = int(os.getenv("CRON_INTERVAL", 60))  # 60 = toutes les heures par défaut


def run_main():
    """Execute main.py as a subprocess."""
    print("🚀 Running pipeline main.py ...")
    result = subprocess.run(["python", "main.py"], capture_output=True, text=True)

    print("✔️ Pipeline finished")
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)


def cron_loop():
    """Internal cron scheduler."""
    while True:
        run_main()
        print(f"⏳ Waiting {CRON_INTERVAL_MINUTES} minutes before next run...")
        time.sleep(CRON_INTERVAL_MINUTES * 60)


@app.route("/")
def home():
    return "Bot FDJ running."


if __name__ == "__main__":
    # Start cron thread
    threading.Thread(target=cron_loop, daemon=True).start()

    # Start Flask server
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 10000)))
