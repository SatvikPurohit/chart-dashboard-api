# apps/[service-name]/Dockerfile
# Step 1 (The Builder): It brings in the raw code (TypeScript) and heavy development tools. 
# It builds the project into a finished, ready-to-run format (JavaScript).
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig*.json ./
COPY src/ ./src
COPY ../shared/ ../shared
RUN npm ci && npm run build

# Step 2 (The Final Container): It throws away the heavy tools and messy source code. 
# It only copies the finished application and the bare essentials needed to run it.
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

# Ingestion-service exposes 3000 | Dashboard-service exposes 3002 [M5]
EXPOSE 3002 
CMD ["node", "dist/server.js"]


