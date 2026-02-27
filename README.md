# 🌿 Mariah Valley — Playable Portfolio

A top-down RPG portfolio experience built with **Phaser 3 · React · TypeScript · Go**.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Local Development — Hot Reload](#local-development--hot-reload)
4. [How HMR Works](#how-hmr-works)
5. [Optional: Go Live-Reload with Air](#optional-go-live-reload-with-air)
6. [Environment Variables](#environment-variables)
7. [API Reference](#api-reference)
8. [Production Build](#production-build)
9. [Deployment — Render](#deployment--render-recommended)
10. [Deployment — Docker on any VPS](#deployment--docker-on-any-vps)
11. [CI/CD — GitHub Actions](#cicd--github-actions)
12. [Customising Content](#customising-content)

---

## Project Structure

```
mariah-portfolio/
│
├── Makefile                          ← shortcuts: make dev, make build, …
│
├── backend/                          ← Go (Gin) REST API
│   ├── cmd/server/main.go
│   ├── internal/
│   │   ├── server/server.go          ← routes + CORS
│   │   ├── projects/handler.go       ← GET /api/v1/projects + /designs
│   │   ├── game/handler.go           ← NPCs, dialogue trees, quests
│   │   ├── contact/handler.go        ← POST /api/v1/contact
│   │   └── analytics/handler.go      ← event tracking
│   ├── .env.example                  ← copy → .env
│   ├── Dockerfile
│   └── go.mod
│
├── frontend/                         ← React + Phaser 3 + TypeScript
│   ├── index.html
│   ├── vite.config.ts                ← HMR config + /api proxy to :8080
│   ├── tsconfig.json
│   ├── .env.development
│   ├── .env.example
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                   ← view router (landing / game / page)
│       ├── styles/global.css         ← CSS variables + resets
│       ├── scenes/
│       │   ├── NiteroiScene.ts       ← 🌅 Niterói dusk landing background
│       │   ├── LandingScene.ts       ← (legacy title screen)
│       │   └── GameScene.ts          ← world, NPCs, dialogue, building entry
│       └── ui/
│           ├── Landing.tsx + .css    ← landing screen React overlay
│           ├── GameView.tsx + .css   ← game HUD wrapper
│           └── PageOverlay.tsx + .css← all portfolio pages
│
├── .github/workflows/deploy.yml      ← CI/CD pipeline
├── docker-compose.yml
└── .gitignore
```

---

## Prerequisites

| Tool | Min version | Install |
|---|---|---|
| **Go** | 1.22 | https://go.dev/dl |
| **Node.js** | 20 LTS | https://nodejs.org |
| **npm** | 10+ | bundled with Node |
| **Docker** *(optional)* | 24+ | https://docs.docker.com/get-docker |
| **Make** *(optional)* | any | pre-installed on macOS/Linux |

Verify:
```bash
go version     # go version go1.22.x
node --version  # v20.x.x
npm --version   # 10.x.x
```

---

## Local Development — Hot Reload

### 1 — Clone and install

```bash
git clone https://github.com/yourname/mariah-portfolio.git
cd mariah-portfolio

make install
# — or manually:
cd backend  && go mod download && cd ..
cd frontend && npm install      && cd ..
```

### 2 — Copy environment files

```bash
cp backend/.env.example  backend/.env
# Open backend/.env and set CONTACT_EMAIL=you@example.com

# Frontend: usually not needed in dev — Vite proxies /api automatically
# cp frontend/.env.example frontend/.env.local
```

### 3 — Start the dev stack

```bash
make dev          # starts both API + Vite together (recommended)
```

Or in two separate terminals:

```bash
# Terminal 1
make dev-api      # Go API → http://localhost:8080

# Terminal 2
make dev-ui       # Vite  → http://localhost:5173  ← open this in your browser
```

Open **http://localhost:5173** — the full game is live.

---

## How HMR Works

Vite provides instant **Hot Module Replacement** for all TS/TSX/CSS files.
The Go backend runs separately on `:8080` and Vite proxies `/api/*` to it.

| File you edit | What happens |
|---|---|
| `src/ui/Landing.tsx` | ⚡ React fast-refresh — updates instantly, no state lost |
| `src/ui/PageOverlay.tsx` | ⚡ Same — page content updates without reloading |
| `src/styles/global.css` | ⚡ CSS injected instantly |
| `src/scenes/NiteroiScene.ts` | 🔄 Phaser scene restarts (module re-imported) |
| `src/scenes/GameScene.ts` | 🔄 Game world reloads, player resets to spawn |
| `backend/**/*.go` | ⚠️ Requires restarting `make dev-api` (or use Air — see below) |

---

## Optional: Go Live-Reload with Air

Install [Air](https://github.com/air-verse/air) for automatic Go restarts:

```bash
go install github.com/air-verse/air@latest
```

Create `backend/.air.toml`:

```toml
root = "."
tmp_dir = "tmp"

[build]
  cmd = "go build -o ./tmp/portfolio ./cmd/server"
  bin = "./tmp/portfolio"
  include_ext = ["go"]
  exclude_dir  = ["tmp", "frontend"]
  delay = 1000

[log]
  time = true
```

Then replace `make dev-api` with:

```bash
cd backend && air
```

Now both the frontend **and** backend hot-reload on every save.

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | API listen port |
| `ENV` | `development` | Set `production` for Gin release mode |
| `CONTACT_EMAIL` | — | Receives contact form submissions |
| `SENDGRID_API_KEY` | — | *(optional)* Real email sending |

### Frontend — `frontend/.env.local`

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | *(proxied)* | In dev: not needed. In prod: `https://yourdomain.com/api/v1` |

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | `{"status":"ok","world":"Mariah Valley"}` |
| `GET` | `/api/v1/projects` | All engineering projects |
| `GET` | `/api/v1/projects/:id` | Single project |
| `GET` | `/api/v1/designs` | Design work |
| `GET` | `/api/v1/game/npcs` | NPC list with world positions |
| `GET` | `/api/v1/game/dialogue/:npcId` | Full dialogue tree |
| `GET` | `/api/v1/game/quests` | Quest definitions |
| `POST` | `/api/v1/game/achievement` | Unlock `{"questId":"…","playerId":"…"}` |
| `GET` | `/api/v1/resume` | Stream `backend/assets/resume.pdf` |
| `POST` | `/api/v1/contact` | Submit `{"name","email","company","body"}` |
| `POST` | `/api/v1/analytics/event` | Track `{"type","target","sessionId"}` |
| `GET` | `/api/v1/analytics/summary` | Aggregated analytics |

---

## Production Build

```bash
make build
```

This runs:
1. `npm run build` → compiles frontend into `backend/frontend/dist/`
2. `go build` → compiles Go binary to `backend/bin/portfolio`

The single binary serves everything:

```bash
ENV=production ./backend/bin/portfolio
# → http://localhost:8080
#   / and /* → React SPA (from frontend/dist)
#   /api/v1/* → API handlers
```

---

## Deployment — Render (recommended)

Render has a free tier and deploys directly from GitHub via Docker.

### Step 1 — Push to GitHub

```bash
git add . && git commit -m "initial deploy" && git push origin main
```

### Step 2 — Create a Web Service on Render

1. [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Settings:

| Field | Value |
|---|---|
| Environment | **Docker** |
| Dockerfile Path | `backend/Dockerfile` |
| Branch | `main` |
| Instance Type | Free (dev) / Starter (prod) |

### Step 3 — Set environment variables

In Render dashboard → **Environment**:

```
ENV             = production
PORT            = 10000
CONTACT_EMAIL   = you@example.com
```

> Render auto-assigns port `10000` — set `PORT=10000` to match.

### Step 4 — Wire up the deploy hook (for auto-deploy on push)

1. Render → Service → **Settings** → **Deploy Hook** → copy the URL
2. GitHub → repo → **Settings** → **Secrets and variables** → **Actions** → **New secret**
   - Name: `RENDER_DEPLOY_HOOK_URL`
   - Value: the URL you copied

From now on, every push to `main` → GitHub Actions runs tests → triggers Render deploy.

### Step 5 — Custom domain (optional)

Render → Service → **Custom Domains** → add `mariahvalley.com`
Then add a CNAME in your DNS provider pointing to the Render URL.
Render provisions a free TLS cert automatically.

---

## Deployment — Docker on any VPS

Works on any Linux VPS: DigitalOcean Droplet, Hetzner, Fly.io, Railway, etc.

### Step 1 — Build the image

```bash
# Build frontend first (Dockerfile copies it in)
cd frontend && npm ci && npm run build && cd ..

docker build -t mariah-valley ./backend
```

### Step 2 — Run

```bash
docker run -d \
  --name mariah-valley \
  --restart unless-stopped \
  -p 80:8080 \
  -e ENV=production \
  -e CONTACT_EMAIL=you@example.com \
  mariah-valley
```

Or with Docker Compose:

```bash
docker-compose up -d --build
```

### Step 3 — Nginx reverse proxy + TLS (recommended)

```nginx
server {
    listen 80;
    server_name mariahvalley.com www.mariahvalley.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name mariahvalley.com www.mariahvalley.com;

    # TLS managed by certbot
    ssl_certificate     /etc/letsencrypt/live/mariahvalley.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mariahvalley.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Get a free TLS cert:
```bash
certbot --nginx -d mariahvalley.com -d www.mariahvalley.com
```

---

## CI/CD — GitHub Actions

`.github/workflows/deploy.yml` runs on every push to `main`:

```
push → main
  │
  ├── frontend job ── npm ci → tsc → vite build → upload artifact
  ├── backend job  ── go mod → go vet → go test ./...
  │
  └── (both pass)
        │
        ├── docker job  ── download frontend → docker build → push to GHCR
        └── deploy job  ── curl $RENDER_DEPLOY_HOOK_URL
```

**Required GitHub Secrets:**

| Secret | Where to find it |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render → Service → Settings → Deploy Hook |
| *(GHCR auth is automatic)* | Uses `GITHUB_TOKEN` — no setup needed |

---

## Customising Content

### Portfolio content (no DB required)

| What | Where |
|---|---|
| Engineering projects | `backend/internal/projects/handler.go` → `projects` slice |
| Design work | same file → `designs` slice |
| NPC dialogue trees | `backend/internal/game/handler.go` → `dialogues` map |
| Quest definitions | same file → `quests` slice |

### Visual scenes (hot-reload in dev)

| What | Where |
|---|---|
| Landing background | `frontend/src/scenes/NiteroiScene.ts` |
| Game world | `frontend/src/scenes/GameScene.ts` |
| Portfolio pages | `frontend/src/ui/PageOverlay.tsx` |
| Global colors/fonts | `frontend/src/styles/global.css` — edit CSS variables |

### Add a new portfolio page

1. Add the key to `PAGE_ORDER` in `PageOverlay.tsx`
2. Add a label in `PAGE_LABELS`
3. Add a type in `PAGE_TYPE`
4. Add a `case` in `PageContent`'s switch
5. Add a building in `GameScene.ts` → `BUILDINGS` array

---

## Quick Command Reference

```bash
make dev          # start everything with hot-reload
make dev-api      # Go API only
make dev-ui       # Vite frontend only
make install      # install all deps
make build        # production build
make test         # go test ./...
make type-check   # tsc --noEmit
make docker       # docker-compose up --build
make clean        # remove build artifacts
```
