# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# install deps (cached layer)
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# build TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# prune dev dependencies for the runtime image
RUN npm prune --omit=dev

# --- runtime stage ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# run as non-root
RUN addgroup -S app && adduser -S app -G app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# data volume for profiles + ciphertext vaults
RUN mkdir -p /app/data && chown -R app:app /app
VOLUME ["/app/data"]
USER app

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1

CMD ["node", "dist/index.js"]
