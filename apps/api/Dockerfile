# The API image. Built from the repository root
# (compose.yaml sets the context), since the API depends on the packages/core workspace.
FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

# Every workspace manifest, so npm can read the monorepo; only the API's production
# dependencies (and packages/core) are installed.
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev --ignore-scripts --workspace @cyrilingo/api && npm cache clean --force

COPY packages/core packages/core
COPY apps/api apps/api

WORKDIR /app/apps/api
USER node
EXPOSE 3000
# At each start: the pending migrations and the seed first, then the server, only if they
# succeeded. TypeScript runs through tsx, as with `npm start`: no build step. `exec` hands the
# process over to Node (not npm or sh), so SIGTERM from `docker stop` reaches the server.
CMD ["sh", "-c", "node --import tsx src/db/migrate-cli.ts && exec node --import tsx src/main.ts"]
