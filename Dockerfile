FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy everything into the container
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install cron
RUN apt-get update && apt-get install -y cron && apt-get clean

# Copy cron job
COPY cronjob /etc/cron.d/bot-cron

# Permissions
RUN chmod 0644 /etc/cron.d/bot-cron

# Register cron job
RUN crontab /etc/cron.d/bot-cron

# Launch cron in foreground (important for Render)
CMD ["cron", "-f"]
