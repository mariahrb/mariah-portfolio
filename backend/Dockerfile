# ── Build stage ──────────────────────────────────────────────────────────────
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /portfolio ./cmd/server

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app

COPY --from=builder /portfolio .
COPY --from=builder /app/assets ./assets

# Copy frontend build (produced by `npm run build` in CI)
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 8080
ENV ENV=production

CMD ["/app/portfolio"]
