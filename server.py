# server.py
from flask import Flask, request, jsonify
import threading
import subprocess
import os
import time

from utils.logger import log
from bot_service.bot import send_message

app = Flask(__name__)

RUNNING_LOCK = threading.Lock()


def run_pipeline_capture():
    """
    Lance main.py et capture stdout / stderr.
    """
    try:
        proc = subprocess.run(
            ["python", "main.py"],
            capture_output=True,
            text=True,
            timeout=900  # 15 min max sécurité
        )
        return proc.stdout, proc.stderr, proc.returncode

    except subprocess.TimeoutExpired:
        return "", "Timeout: pipeline trop long", 124

    except Exception as e:
        return "", str(e), 1


def run_pipeline_and_notify(origin="manual"):
    """
    Run pipeline + notification Telegram finale
    """
    if not RUNNING_LOCK.acquire(blocking=False):
        send_message("⚠️ Pipeline déjà en cours. Merci d’attendre.")
        return

    start = time.time()
    send_message("⏳ Lancement du pipeline FDJ…")

    try:
        out, err, code = run_pipeline_capture()
        duration = int(time.time() - start)

        if code == 0:
            msg = (
                "✅ *Pipeline terminé avec succès*\n"
                f"⏱ Durée : {duration}s\n\n"
            )

            if out.strip():
                msg += f"📄 Résumé:\n{out[:3500]}"
            else:
                msg += "ℹ️ Aucun résultat retourné"

        else:
            msg = (
                "❌ *Erreur pipeline FDJ*\n"
                f"⏱ Durée : {duration}s\n"
                f"Code: {code}\n\n"
                f"{err[:3500]}"
            )

        send_message(msg)

    except Exception as e:
        send_message(f"❌ Exception pipeline : {e}")

    finally:
        RUNNING_LOCK.release()


@app.route("/")
def home():
    return "Agent FDJ running."


@app.route("/run", methods=["GET"])
def manual_run():
    """
    Déclenche un run manuel (non bloquant)
    """
    threading.Thread(
        target=run_pipeline_and_notify,
        kwargs={"origin": "api"},
        daemon=True
    ).start()

    return jsonify({
        "status": "accepted",
        "message": "Pipeline started"
    }), 202


@app.route("/webhook", methods=["POST"])
def telegram_webhook():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "no-json"}), 200

    try:
        from bot_service.handler import handle_update
        handle_update(data)
    except Exception as e:
        log(f"Webhook error: {e}")

    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)


