# Build from the repository root so the worker can compile shared TypeScript modules.
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx tsc --ignoreConfig --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --esModuleInterop --skipLibCheck --types node --outDir /app/build --rootDir /app $(find error-service/src -name '*.ts')
RUN npm prune --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

# No ports exposed: pure background data processing.
CMD ["node", "build/error-service/src/worker.js"]
