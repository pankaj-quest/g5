FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install --production=false
COPY . .
RUN npx tsc -p tsconfig.build.json

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 8080
ENV PORT=8080

CMD ["node", "dist/index.js"]
