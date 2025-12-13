# server.py
from flask import Flask, request, jsonify
import threading
import os
from utils.logger import log

app = Flask(__name__)


# -------------------------------------------------
# HEALTHCHECK
# -------------------------------------------------
@app.route("/", methods=["GET"])
def home():
    return "Agent FDJ running.", 200


# -------------------------------------------------
# WEBHOOK TELEGRAM
# -------------------------------------------------
@app.route("/webhook", methods=["POST"])
def telegram_webhook():
    data = request.get_json(silent=True)
    log(f"[WEBHOOK] Received update | json={bool(data)}")

    if not data:
        return jsonify({"status": "no-json"}), 200

    try:
        from bot_service.handler import handle_update
        handle_update(data)
    except Exception as e:
        log(f"❌ Webhook handler error: {e}")
        # IMPORTANT : toujours 200 pour Telegram
        return jsonify({"status": "error"}), 200

    return jsonify({"status": "ok"}), 200


# -------------------------------------------------
# PIPELINE EXECUTION
# -------------------------------------------------
def run_pipeline():
    try:
        log("🚀 PIPELINE FDJ — DÉMARRAGE")
        from main import main
        main()
        log("✅ PIPELINE FDJ — TERMINÉ")
    except Exception as e:
        log(f"❌ PIPELINE FDJ — ERREUR : {e}")


# -------------------------------------------------
# RUN MANUEL (/run)
# -------------------------------------------------
@app.route("/run", methods=["GET"])
def manual_run():
    log("📡 /run appelé — lancement en arrière-plan")

    thread = threading.Thread(target=run_pipeline, daemon=True)
    thread.start()

    return jsonify({
        "status": "accepted",
        "message": "Pipeline started"
    }), 202


# -------------------------------------------------
# MAIN
# -------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)

