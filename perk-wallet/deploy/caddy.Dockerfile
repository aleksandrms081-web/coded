# Custom Caddy build that includes the Cloudflare DNS plugin so we can use the
# DNS-01 ACME challenge — no inbound port 80/443 needed for cert issuance.
#
# proxy.golang.org and sum.golang.org rate-limit (HTTP 403) many cloud-provider
# IP ranges (Hetzner, OVH, etc.), which breaks xcaddy builds. Fetching modules
# directly from their VCS origins (GOPROXY=direct) avoids the proxy entirely.
# It's slower but reliable from rate-limited hosts.
FROM caddy:2-builder-alpine AS builder
ENV GOPROXY=direct
ENV GOSUMDB=off
ENV GOFLAGS=-mod=mod
RUN xcaddy build \
    --with github.com/caddy-dns/cloudflare

FROM caddy:2-alpine
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
