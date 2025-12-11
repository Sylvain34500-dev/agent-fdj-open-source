from flask import Flask
import threading
import time
import os

from main import main as run_agent

app = Flask(__name__)

@app.route("/")
def home():
    return "Agent FDJ OK"

@app.route("/health")
def health():
    return "OK"

def cron_loop():
    while True:
        print(">>> Lancement automatique de main()")
        try:
            run_agent()
        except Exception as e:
            print("Erreur dans l’agent :", e)
        time.sleep(600)  # toutes les 10 minutes

# Thread pour le cron interne
threading.Thread(target=cron_loop, daemon=True).start()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
