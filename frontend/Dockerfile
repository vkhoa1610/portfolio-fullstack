# ============================================
# NOTE: Build context is the REPO ROOT (see docker-compose.yml), not ./frontend.
# All COPY sources are therefore prefixed with `frontend/`, and the repo-root
# `docs/` folder is copied into the image so the /wiki route's SSG works.
# ============================================

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files (from ./frontend in the build context)
COPY frontend/package.json frontend/package-lock.json* ./

# Install ALL dependencies (including devDependencies for build)
# --ignore-scripts prevents husky from running in Docker
RUN npm ci --ignore-scripts

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the frontend project itself
COPY frontend/. .

# Copy the repo-root docs/ folder into /app/docs so lib/wiki.ts can find it
# during `next build`. The candidate-paths logic in lib/wiki.ts handles both
# this Docker layout AND the local dev layout (../docs).
COPY docs ./docs

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Inject BFF URL at build time for next.config.ts rewrites()
ARG BFF_INTERNAL_URL=http://nextjs-bff:4000
ENV BFF_INTERNAL_URL=$BFF_INTERNAL_URL

# Build the application
RUN npm run build

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set hostname
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Start the application
CMD ["node", "server.js"]
