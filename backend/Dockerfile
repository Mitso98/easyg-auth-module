# syntax=docker/dockerfile:1

# ---- Build stage ----
# Build and runtime share the SAME base image so any native module resolves
# against the same libc (@node-rs/argon2 ships prebuilt binaries anyway).
# Node major kept in sync with .nvmrc / CI (FROM can't read .nvmrc directly).
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
