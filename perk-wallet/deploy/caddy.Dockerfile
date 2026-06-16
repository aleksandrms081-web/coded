# Custom Caddy build that includes the Cloudflare DNS plugin so we can use the
# DNS-01 ACME challenge — no inbound port 80/443 needed for cert issuance.
# Useful when the upstream network blocks Let's Encrypt's HTTP-01 probes.
FROM caddy:2-builder-alpine AS builder
RUN xcaddy build \
    --with github.com/caddy-dns/cloudflare

FROM caddy:2-alpine
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
