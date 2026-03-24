FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

ENV VITE_API_URL=https://g5-api-757475034422.asia-south1.run.app

RUN npx vite build

FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
