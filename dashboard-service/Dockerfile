# Dashboard sources live at this directory's root, not in a src folder.
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY ingestion-service/package.json ./ingestion-service/package.json
COPY dashboard-service/package.json ./dashboard-service/package.json
COPY traffic-service/package.json ./traffic-service/package.json
COPY error-service/package.json ./error-service/package.json
COPY performance-service/package.json ./performance-service/package.json
RUN npm ci
COPY . .
RUN npx tsc --ignoreConfig --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --esModuleInterop --skipLibCheck --types node --outDir /app/build --rootDir /app $(find dashboard-service -name '*.ts')
RUN npm prune --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

# Dashboard-service exposes port 3002.
EXPOSE 3002
CMD ["node", "build/dashboard-service/server.js"]
