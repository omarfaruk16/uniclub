# UniQue: production image (Next.js + Prisma/SQLite)
FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies (the Prisma schema is needed by @prisma/client's postinstall).
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .

# A fixed key keeps Server Action ids stable across builds, so tabs left open
# during a deploy keep working. It must be the same at build time and runtime.
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" npm run build

ENV NODE_ENV=production
EXPOSE 3070

# Apply schema changes (additive) to the SQLite file in the data volume, then start.
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
