# ══════════════════════════════════════════════════════════════════════════════
# Mariah Valley — Makefile
# Usage: make <target>
# ══════════════════════════════════════════════════════════════════════════════

.PHONY: dev dev-api dev-ui install build test clean docker docker-down

# ── DEVELOPMENT ───────────────────────────────────────────────────────────────

## Start everything (API + frontend hot-reload) in parallel
dev:
	@echo "🌿 Starting Mariah Valley dev stack..."
	@make -j2 dev-api dev-ui

## Start Go API only (port 8080)
dev-api:
	@echo "⚙️  Starting Go API on :8080"
	@cd backend && go run ./cmd/server

## Start Vite frontend only (port 5173, HMR enabled)
dev-ui:
	@echo "🎮 Starting Vite frontend on :5173"
	@cd frontend && npm run dev

# ── INSTALL ───────────────────────────────────────────────────────────────────

## Install all dependencies (Go modules + Node packages)
install:
	@echo "📦 Installing dependencies..."
	@cd backend  && go mod download
	@cd frontend && npm install
	@echo "✅ Done"

# ── BUILD ─────────────────────────────────────────────────────────────────────

## Build frontend into backend/frontend/dist (ready for Go to serve)
build-ui:
	@cd frontend && npm run build

## Build Go binary
build-api:
	@cd backend && go build -ldflags="-w -s" -o ./bin/portfolio ./cmd/server

## Full production build
build: build-ui build-api
	@echo "✅ Production build complete → backend/bin/portfolio"

# ── TEST ──────────────────────────────────────────────────────────────────────

## Run Go tests
test:
	@cd backend && go test ./... -race -count=1

## TypeScript type-check (no emit)
type-check:
	@cd frontend && npm run type-check

# ── DOCKER ────────────────────────────────────────────────────────────────────

## Build and start full stack with Docker Compose
docker:
	@docker-compose up --build

## Stop Docker stack
docker-down:
	@docker-compose down

# ── CLEAN ─────────────────────────────────────────────────────────────────────

clean:
	@rm -rf backend/bin backend/frontend/dist frontend/dist frontend/node_modules
	@echo "🧹 Cleaned"

# ── HELP ──────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "  Mariah Valley — Dev Commands"
	@echo "  ──────────────────────────────────────────────"
	@echo "  make install     Install all deps (Go + Node)"
	@echo "  make dev         Start API + UI with hot-reload"
	@echo "  make dev-api     Go API only (port 8080)"
	@echo "  make dev-ui      Vite + HMR only (port 5173)"
	@echo "  make build       Full production build"
	@echo "  make test        Run Go tests"
	@echo "  make type-check  TypeScript check"
	@echo "  make docker      Run full stack via Docker"
	@echo "  make clean       Remove build artifacts"
	@echo ""
