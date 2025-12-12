# server.py (NON bloquant, /run + exécution au démarrage en background)
from flask import Flask, jsonify
import threading
import subprocess
import os
import time

app = Flask(__name__)

def run_pipeline_capture():
    """Lance main.py en subprocess et retourne (stdout, stderr, returncode)."""
    try:
        proc = subprocess.run(["python3", "main.py"], capture_output=True, text=True, timeout=3600)
        return proc.stdout, proc.stderr, proc.returncode
    except subprocess.TimeoutExpired as e:
        return "", f"TimeoutExpired: {e}", 124
    except Exception as e:
        return "", f"Exception: {e}", 1

def background_run_once():
    """Lance le pipeline en background au démarrage (non blocant)."""
    def _worker():
        app.logger.info("Background initial run starting...")
        out, err, code = run_pipeline_capture()
        app.logger.info(f"Initial run done (code={code}). stdout len={len(out)} stderr len={len(err)}")
    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()

@app.route("/")
def home():
    return "Agent FDJ running."

@app.route("/run", methods=["GET"])
def manual_run():
    # Lance le pipeline en background puis répond immédiatement
    def _worker_and_notify():
        out, err, code = run_pipeline_capture()
        # on log le résultat (Render logs)
        app.logger.info(f"/run finished (code={code}). stdout: {out[:800]} stderr: {err[:800]}")
    threading.Thread(target=_worker_and_notify, daemon=True).start()
    return jsonify({"status":"accepted", "message":"Pipeline started"}), 202

if __name__ == "__main__":
    # Lancer 1 run en background au démarrage (optionnel)
    background_run_once()
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
