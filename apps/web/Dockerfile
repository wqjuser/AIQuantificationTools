FROM node:22-alpine AS build

WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm ci --no-audit --fund=false

COPY apps/web apps/web

ARG VITE_QUANT_API_BASE=/
ENV VITE_QUANT_API_BASE=$VITE_QUANT_API_BASE

RUN npm run build --workspace @aiqt/web

FROM nginx:1.27-alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
