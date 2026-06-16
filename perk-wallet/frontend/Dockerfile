# Multi-stage build for the Perk Wallet frontend, served by nginx.
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_DEFAULT_CHAIN_ID
ARG VITE_RPC_URL
ARG VITE_APP_NAME
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_DEFAULT_CHAIN_ID=$VITE_DEFAULT_CHAIN_ID \
    VITE_RPC_URL=$VITE_RPC_URL \
    VITE_APP_NAME=$VITE_APP_NAME

COPY package.json package-lock.json* ./
COPY packages/perklock/package.json packages/perklock/package.json
COPY server/package.json server/package.json
COPY frontend/package.json frontend/package.json
RUN npm install --no-audit --no-fund

COPY packages/perklock packages/perklock
RUN npm run build --workspace @perk-wallet/perklock
COPY frontend frontend
RUN npm run build --workspace @perk-wallet/frontend

FROM nginx:1.27-alpine AS runtime
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
