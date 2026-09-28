# apps/[consumer-name]/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig*.json ./
COPY src/ ./src
COPY ../shared/ ../shared
RUN npm ci && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

# No ports exposed! Pure background data processing [M5].
CMD ["node", "dist/worker.js"]