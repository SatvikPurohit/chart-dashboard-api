# Build from the repository root so the service can compile shared TypeScript modules.
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx tsc --ignoreConfig --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --esModuleInterop --skipLibCheck --types node --outDir /app/build --rootDir /app $(find ingestion-service/src -name '*.ts')
RUN npm prune --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

# Ingestion-service exposes port 3000.
EXPOSE 3000
CMD ["node", "build/ingestion-service/src/server.js"]
