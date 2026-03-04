# ── Go build stage ────────────────────────────────────────────────────────────
FROM golang:1.24-alpine AS go-builder

WORKDIR /app/backend

# Copy module files first for better layer caching.
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy backend source and compile.
COPY backend/. ./
RUN CGO_ENABLED=0 GOOS=linux GOMAXPROCS=1 GOMEMLIMIT=512MiB \
  go build -v -p=1 -tags=nomsgpack -mod=readonly -ldflags="-w -s" -o /portfolio ./cmd/server

# ── Frontend build stage ──────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Build frontend from source so /frontend/dist always exists in CI.
COPY frontend/. ./
RUN mkdir -p /app/backend/frontend && npm install && npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app

RUN mkdir -p /app/assets /app/frontend/dist

# Copy backend binary.
COPY --from=go-builder /portfolio ./portfolio

# Copy built frontend.
# Vite outDir is configured as ../backend/frontend/dist (see frontend/vite.config.ts).
COPY --from=frontend-builder /app/backend/frontend/dist ./frontend/dist

# Keep resume endpoint path used by backend (/api/v1/resume).
COPY --from=frontend-builder /app/backend/frontend/dist/Mariah_Barreto_Resume.pdf ./assets/resume.pdf

EXPOSE 8080
ENV ENV=production

CMD ["/app/portfolio"]
