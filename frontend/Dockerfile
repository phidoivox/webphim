# ---- Build stage ----
FROM node:24-alpine AS build

RUN corepack enable && corepack prepare pnpm@11.20.0 --activate

WORKDIR /app

# Build args — baked into NEXT_PUBLIC_* at build time
ARG NEXT_PUBLIC_API_URL=http://localhost/api
ARG NEXT_PUBLIC_REVERB_APP_KEY
ARG NEXT_PUBLIC_REVERB_HOST=localhost
ARG NEXT_PUBLIC_REVERB_PORT=8080
ARG NEXT_PUBLIC_REVERB_SCHEME=http
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ---- Production stage ----
FROM node:24-alpine AS runner

RUN addgroup --system --gid 1001 nextjs && adduser --system --uid 1001 nextjs

WORKDIR /app

# Standalone output from Next.js
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nextjs /app/public ./public

# Server-side env (not baked, read at runtime)
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
