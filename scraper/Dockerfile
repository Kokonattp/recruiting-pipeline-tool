# Playwright's official image ships Chromium + all OS deps already installed,
# which avoids the painful "missing shared libraries" problems on slim images.
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

WORKDIR /app

# Install deps first for better layer caching.
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and build TypeScript -> dist/.
COPY tsconfig.json ./
COPY types.ts browser.ts server.ts ./
COPY sources ./sources
RUN npm run build

ENV NODE_ENV=production
# PORT is overridden by the platform — Google Cloud Run injects its own $PORT,
# which server.ts reads via process.env.PORT.
ENV PORT=4000
EXPOSE 4000

CMD ["npm", "run", "start"]
