FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY src ./src
COPY sql ./sql

EXPOSE 8080

CMD ["node", "src/server.js"]
