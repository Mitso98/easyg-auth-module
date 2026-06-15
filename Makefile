# Verb layer over the monorepo. `make verify` mirrors the CI pipeline.
.PHONY: up down test openapi verify

up:
	docker compose up --build

down:
	docker compose down

test:
	cd backend && npm test
	cd frontend && npm test

openapi:
	cd backend && npm run openapi:gen

verify:
	cd backend && npm ci && npm run lint && npm run typecheck && npm test && npm run build && npm run openapi:gen
	cd frontend && npm ci && npm run lint && npm run typecheck && npm test && npm run build
	docker compose build
