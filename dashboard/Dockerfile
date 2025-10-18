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


COPY --from=build /app/build /usr/share/nginx/html
RUN sed -i 's/listen       80;/listen       8080;/g' /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
