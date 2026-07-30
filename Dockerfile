FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies (including devDependencies needed for build)
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Remove devDependencies to slim down the image
RUN npm prune --omit=dev

EXPOSE 3000

CMD ["npm", "run", "deploy"]
