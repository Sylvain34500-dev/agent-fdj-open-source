# server.py
from flask import Flask, request, jsonify
import threading
import subprocess
import os

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
    Lance un run en background au démarrage (non bloquant).
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


# ROUTE POUR TELEGRAM (webhook)
@app.route("/webhook", methods=["POST"])
def telegram_webhook():
    data = request.get_json(silent=True)
    app.logger.info(f"POST /webhook received, json present: {bool(data)}")
    if not data:
        # Telegram envoie parfois non-json => renvoyer 200 mais loguer
        return jsonify({"status": "no-json"}), 200

    try:
        # appelle la fonction de handling (dans telegram/handler.py)
        from telegram.handler import handle_update
        handle_update(data)
    except Exception as e:
        app.logger.exception("Erreur dans handle_update:")
        # renvoyer 200 pour éviter que Telegram désactive le webhook,
        # mais on log l'erreur pour debug
        return jsonify({"status": "error", "message": str(e)}), 200

    return jsonify({"status": "ok"}), 200


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

    return jsonify({"status": "accepted", "message": "Pipeline started"}), 202


if __name__ == "__main__":
    # un run initial en background (optionnel)
    background_run_once()
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)

