# syntax=docker/dockerfile:1

# ---- Build stage ----
# Build and runtime share the SAME base image so any native module resolves
# against the same libc (@node-rs/argon2 ships prebuilt binaries anyway).
FROM node:lts-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:lts-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
