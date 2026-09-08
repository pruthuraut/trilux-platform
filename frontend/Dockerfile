# Next.js 14 dashboard — production build (standalone output).
# NEXT_PUBLIC_API_BASE_URL must be provided at BUILD time (Next inlines NEXT_PUBLIC_*
# vars into the client bundle). The browser hits the backend directly, so this is the
# host-reachable URL (e.g. http://localhost:8000), NOT the docker-internal name.
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

FROM node:20-bookworm-slim AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
# Cap V8 heap so `next build` fits inside a small Docker VM (avoids OOM SIGKILL).
ENV NODE_OPTIONS=--max-old-space-size=1536
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Produces .next/standalone (self-contained server + traced node_modules).
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Standalone output: ship only the traced server bundle + static assets.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
# server.js is emitted by Next at the root of the standalone bundle.
CMD ["node", "server.js"]
