FROM node:22.12-bookworm-slim

WORKDIR /app

# unzip is required by Puppeteer's post-install step to extract its bundled
# Chromium download — missing on the plain Debian slim image, and `npm install`
# fails outright without it.
RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

# OS shared libraries the downloaded Chromium binary needs to actually launch
# headless (confirmed by reproducing and fixing the exact
# `libglib-2.0.so.0: cannot open shared object file` failure on this base
# image). Note: Puppeteer has no built-in equivalent of Playwright's
# `install-deps` command, so these are installed explicitly.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
        libcups2 libdbus-1-3 libgbm1 libglib2.0-0 libgtk-3-0 libnspr4 \
        libnss3 libpango-1.0-0 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
        libxdamage1 libxext6 libxfixes3 libxrandr2 libxkbcommon0 libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

COPY . .

EXPOSE 5000
CMD ["npm", "start"]
