# Build from repository root:
#   docker build --platform linux/amd64 -f apps/docs/Dockerfile -t kjsc/agent-middle-docs:latest .
#
# Gateway / host access (DOCS_PORT default 9900):
#   http://<host>:9900/docs/
#
# VitePress reads VERSION from the repo root (see .vitepress/version.ts).
FROM node:22-bookworm-slim AS builder

RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

COPY VERSION VERSION
COPY apps/docs/package.json apps/docs/package-lock.json apps/docs/
RUN cd apps/docs && npm ci

COPY apps/docs/ apps/docs/
RUN cd apps/docs && npm run build

FROM nginx:stable-alpine AS production-stage

COPY --from=builder /build/apps/docs/.vitepress/dist /usr/share/nginx/html

RUN apk add --no-cache bash

COPY apps/docs/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/docs/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8081

ENTRYPOINT ["/docker-entrypoint.sh"]
