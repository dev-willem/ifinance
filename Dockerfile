# ---------- Build ----------
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --config.only-built-dependencies=false

COPY . .

# URL da API injetada em tempo de build
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Caminho base da SPA (ex: "/" ou "/ifinance/")
ARG VITE_BASE_PATH="/"
ENV VITE_BASE_PATH=$VITE_BASE_PATH

RUN pnpm build

# ---------- Serve ----------
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
