import subprocess
from flask import Flask

app = Flask(__name__)

def run_pipeline():
    print("🚀 Running pipeline main.py ...")
    result = subprocess.run(["python", "main.py"], capture_output=True, text=True)

    print("✔️ Pipeline finished")
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)


@app.route("/")
def home():
    return "Bot FDJ running."


@app.route("/run")
def manual_run():
    run_pipeline()
    return "Pipeline executed manually."


if __name__ == "__main__":
    # Run once automatically at startup (before Telegram sends)
    run_pipeline()

    # Start Flask server (Render needs this)
    app.run(host="0.0.0.0", port=10000)
