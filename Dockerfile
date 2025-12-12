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

# Render requires this environment variable
ENV PORT=10000

# Expose the port used by the server
EXPOSE 10000

# Start the server (which runs Flask + cron scheduler)
CMD ["python", "server.py"]
