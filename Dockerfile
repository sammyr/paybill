FROM node:18-bullseye-slim

# Systempakete und Chromium installieren
RUN apt-get update && \
    apt-get install -y chromium

# Optional: Umgebungsvariable für Puppeteer setzen
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Kopiere package.json und package-lock.json (falls vorhanden) und installiere Abhängigkeiten
COPY package*.json ./
RUN npm install

# Kopiere den Rest der Anwendung
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
