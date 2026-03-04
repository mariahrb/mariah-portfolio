# ── Build stage ──────────────────────────────────────────────────────────────
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy only Go module files from backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy backend source code
COPY backend/. .

# Ensure resume asset path exists for API route /api/v1/resume
RUN mkdir -p /app/assets \
  && if [ -f "/app/frontend/dist/Mariah_Barreto_Resume.pdf" ]; then cp "/app/frontend/dist/Mariah_Barreto_Resume.pdf" "/app/assets/resume.pdf"; fi

# Build the Go server with deterministic module resolution.
# Use lower-memory compiler settings for constrained CI builders.
# "nomsgpack" drops optional Gin msgpack binding to reduce compile surface.
RUN CGO_ENABLED=0 GOOS=linux GOMAXPROCS=1 GOMEMLIMIT=512MiB \
  go build -v -p=1 -tags=nomsgpack -mod=readonly -ldflags="-w -s" -o /portfolio ./cmd/server

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app

# Copy Go binary and assets
COPY --from=builder /portfolio .
COPY --from=builder /app/assets ./assets

# Copy frontend build if you produced it in CI
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 8080
ENV ENV=production

CMD ["/app/portfolio"]
