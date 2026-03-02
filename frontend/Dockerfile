FROM node:20-bookworm-slim AS build

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая dev)
RUN npm ci --include=optional

# Копируем исходники
COPY . .

# Build аргументы
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Собираем приложение
RUN npm run build


# Production стадия
FROM nginx:alpine

# Копируем build
COPY --from=build /app/dist /usr/share/nginx/html

# SPA config
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
