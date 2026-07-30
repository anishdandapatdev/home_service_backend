FROM node:22-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies (including devDependencies needed for build)
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files so npm scripts (e.g. deploy) are available at runtime
COPY package*.json ./

# Copy compiled output and dependencies from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "run", "deploy"]
