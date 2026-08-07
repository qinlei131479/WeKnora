# Docs site — build context: ./docs (parent of site/)
# Layout in image mirrors host: /app = docs/, /app/site = VitePress project
FROM node:20-alpine AS builder
WORKDIR /app

COPY site/package.json site/package-lock.json* ./site/
WORKDIR /app/site
RUN npm ci

WORKDIR /app
COPY . .
WORKDIR /app/site
RUN npm run docs:build

FROM nginx:alpine
COPY site/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/site/.vitepress/dist /usr/share/nginx/html
EXPOSE 80
