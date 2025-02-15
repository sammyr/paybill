FROM node:20-slim

# Install Chromium und benötigte Abhängigkeiten
RUN apt-get update \
    && apt-get install -y chromium \
       fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
       --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Abhängigkeiten kopieren und installieren
COPY package*.json ./
RUN npm install

# App-Dateien kopieren
COPY . .

# Build der App
RUN npm run build

# Umgebungsvariablen setzen
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Port freigeben
EXPOSE 3000

# Start-Befehl
CMD ["npm", "run", "start"]
