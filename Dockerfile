FROM node:22-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies (including devDependencies needed for build)
COPY package*.json ./
COPY tsconfig*.json nest-cli.json ./
COPY prisma ./prisma
RUN npm ci

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files, configurations, and compiled artifacts
COPY package*.json ./
COPY tsconfig*.json nest-cli.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/main.js"]
