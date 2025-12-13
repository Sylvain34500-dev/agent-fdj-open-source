import os
import threading
from flask import Flask, request
from utils.logger import log

app = Flask(__name__)

@app.route("/", methods=["GET"])
def health():
    return "OK", 200

@app.route("/run", methods=["GET"])
def run():
    log("🚀 Lancement du pipeline")
    from pipeline.run_pipeline import run_pipeline
    threading.Thread(target=run_pipeline, daemon=True).start()
    return "Pipeline lancé", 202

@app.route("/webhook", methods=["POST"])
def webhook():
    from bot.telegram_bot import handle_update
    update = request.get_json()
    handle_update(update)
    return "OK", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)

