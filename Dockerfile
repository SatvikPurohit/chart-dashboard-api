# Step 1 (The Builder): It brings in the raw code (TypeScript) and heavy development tools. 
# It builds the project into a finished, ready-to-run format (JavaScript).
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Step 2 (The Final Container): It throws away the heavy tools and messy source code. 
# It only copies the finished application and the bare essentials needed to run it.
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npm", "start"]