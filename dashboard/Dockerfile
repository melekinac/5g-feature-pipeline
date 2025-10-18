# ======================================================
# 5G ENERGY OPTIMIZATION - DASHBOARD (React Frontend)
# ======================================================
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ======================================================
# Deploy stage: NGINX static hosting (Cloud Run compatible)
# ======================================================
FROM nginx:alpine

# React Router için özel Nginx yapılandırmasını kopyala
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build edilmiş dosyaları kopyala
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
