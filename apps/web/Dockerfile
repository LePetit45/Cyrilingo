# The web image: builds the static front end, then serves it with Nginx, which also forwards
# /api and /mcp to the api service. Built from the repository root (compose.yaml sets the context).
FROM node:24-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --ignore-scripts --workspace @cyrilingo/web

COPY packages/core packages/core
COPY apps/web apps/web
RUN npm run build

# Only the built files ship: no Node.js, no sources.
FROM nginx:1.29-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/build /usr/share/nginx/html
