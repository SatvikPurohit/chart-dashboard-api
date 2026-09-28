# apps/[service-name]/Dockerfile
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

# Ingestion-service exposes 3000 | Dashboard-service exposes 3002 [M5]
EXPOSE 3000 
CMD ["node", "dist/server.js"]