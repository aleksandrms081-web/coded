# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# native build tools for modules like better-sqlite3
RUN apk add --no-cache python3 make g++

# install workspace deps (cached layer)
COPY package.json package-lock.json* ./
COPY packages/perklock/package.json packages/perklock/package.json
COPY server/package.json server/package.json
COPY frontend/package.json frontend/package.json
RUN npm install --no-audit --no-fund

# build server TypeScript
COPY server server
RUN npm run build --workspace @perk-wallet/server

# --- runtime stage ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# run as non-root
RUN addgroup -S app && adduser -S app -G app

# copy the full workspace layout: hoisted node_modules + server build output
COPY --from=build /app /app

# data dir mounted from the perk-data compose volume (DATA_DIR=/data)
RUN mkdir -p /data && chown -R app:app /app /data
VOLUME ["/data"]
USER app

WORKDIR /app/server
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1

CMD ["node", "dist/index.js"]
