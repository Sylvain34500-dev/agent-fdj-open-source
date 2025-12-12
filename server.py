# server.py
from flask import Flask, request, jsonify
import threading
import subprocess
import os
from telegram.send import send_telegram_message

app = Flask(__name__)

def run_pipeline_capture():
    """
    Lance main.py en subprocess et retourne stdout, stderr, returncode.
    """
    try:
        proc = subprocess.run(
            ["python3", "main.py"],
            capture_output=True,
            text=True,
            timeout=3600
        )
        return proc.stdout, proc.stderr, proc.returncode
    except subprocess.TimeoutExpired as e:
        return "", f"TimeoutExpired: {e}", 124
    except Exception as e:
        return "", f"Exception: {e}", 1


def background_run_once():
    """
    Lance un run en background au démarrage.
    """
    def _worker():
        app.logger.info("Background initial run starting...")
        out, err, code = run_pipeline_capture()
        app.logger.info(
            f"Initial run done (code={code}). stdout len={len(out)} stderr len={len(err)}"
        )

    threading.Thread(target=_worker, daemon=True).start()


@app.route("/")
def home():
    return "Agent FDJ running."


@app.route("/run", methods=["GET"])
def manual_run():
    """
    Déclenche un run manuel SANS bloquer la requête.
    """
    def _worker_and_notify():
        out, err, code = run_pipeline_capture()
        app.logger.info(
            f"/run finished (code={code}). stdout: {out[:500]} stderr: {err[:500]}"
        )

    threading.Thread(target=_worker_and_notify, daemon=True).start()

    return jsonify({
        "status": "accepted",
        "message": "Pipeline started"
    }), 202


# ------------- 🔥 ROUTE WEBHOOK TELEGRAM (MANQUANTE) -----------------

@app.route("/webhook", methods=["POST"])
def webhook():
    """
    Reçoit les messages de Telegram.
    """
    data = request.get_json()

    # Protection si Telegram envoie un update vide
    if not data:
        return "OK", 200

    # Si message texte envoyé
    if "message" in data:
        chat_id = data["message"]["chat"]["id"]
        text = data["message"].get("text", "")

        # Accusé réception dans Telegram
        send_telegram_message("🤖 Webhook bien reçu !")
    
    return "OK", 200


# ----------------------------------------------------------------------


if __name__ == "__main__":
    background_run_once()

    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
