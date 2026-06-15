# syntax=docker/dockerfile:1

# ---- Build stage ----
# Node 22: Vite 8 requires Node >=20.19/22.12.
FROM node:22-bookworm-slim AS build
WORKDIR /app
# Baked at build time; relative path kept so the SPA stays same-origin.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime stage ----
# Static files served by nginx (no Node at runtime, so no native concerns).
# Stays on the bookworm family for consistency with the build base.
FROM nginx:stable-bookworm AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
