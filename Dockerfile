FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files
COPY . .

# Render fournit déjà la variable PORT 
# donc PAS de valeur fixe (sinon ça casse l'environnement Render)
# On NE DOIT PAS faire ENV PORT=10000 ⚠️
#
# On laisse Render injecter $PORT automatiquement.

# EXPOSER un port est correct, mais 10000 n’est qu’un indicatif.
# Render remappe automatiquement vers $PORT.
EXPOSE 10000

# Démarrer ton serveur Flask
CMD ["python", "server.py"]
