# Étape 1 : construire le site statique. Étape 2 : le servir avec Caddy (HTTPS automatique).
FROM node:22-alpine AS construction
WORKDIR /site
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npx next build

FROM caddy:2-alpine
COPY --from=construction /site/out /srv
