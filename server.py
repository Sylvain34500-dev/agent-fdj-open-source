from flask import Flask
import threading
import time
from main import main as run_agent

app = Flask(__name__)

@app.route('/')
def home():
    return "FDJ Agent Running"

def start_cron_loop():
    while True:
        print("Running agent...")
        run_agent()
        time.sleep(3600)  # toutes les 60 minutes

if __name__ == '__main__':
    # Lancer la boucle de cron en tâche de fond
    thread = threading.Thread(target=start_cron_loop)
    thread.daemon = True
    thread.start()

    app.run(host='0.0.0.0', port=10000)
