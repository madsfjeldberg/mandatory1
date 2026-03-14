# Build context is backend/

# ── Stage 1: compile TypeScript ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY index.ts ./
COPY src ./src
RUN npm run build

# ── Stage 2: production image ─────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Compiled output
COPY --from=builder /app/dist ./dist

# Person-names JSON — __dirname is dist/src at runtime, so ../../ resolves to /app/
COPY data/person-names.json ./data/person-names.json

EXPOSE 3000
CMD ["node", "dist/index.js"]
