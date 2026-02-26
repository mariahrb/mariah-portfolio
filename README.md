# 🌿 Mariah Valley — Playable Portfolio

A top-down RPG portfolio experience built with **Phaser 3 + React + Go**.

## Architecture

```
mariah-portfolio/
│
├── backend/                    ← Go (Gin) REST API
│   ├── cmd/server/main.go      ← Entry point
│   ├── internal/
│   │   ├── server/server.go    ← Route registration + CORS
│   │   ├── projects/           ← GET /api/v1/projects, /designs
│   │   ├── game/               ← NPCs, dialogue trees, quests
│   │   ├── contact/            ← POST /api/v1/contact
│   │   └── analytics/          ← Event tracking + summary
│   ├── Dockerfile
│   └── go.mod
│
├── frontend/                   ← React + Phaser 3 + TypeScript
│   ├── src/
│   │   ├── scenes/
│   │   │   ├── LandingScene.ts ← Animated title screen
│   │   │   └── GameScene.ts    ← World, NPCs, dialogue, building entry
│   │   ├── ui/                 ← React overlays (pages, HUD, nav)
│   │   └── data/               ← Fallback data if API is down
│   └── package.json
│
├── .github/workflows/
│   └── deploy.yml              ← CI/CD: test → build → Docker → Render
│
├── docker-compose.yml          ← Local dev stack
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/projects` | All engineering projects |
| GET | `/api/v1/projects/:id` | Single project |
| GET | `/api/v1/designs` | Design work |
| GET | `/api/v1/game/npcs` | NPC positions + metadata |
| GET | `/api/v1/game/dialogue/:npcId` | Dialogue tree for an NPC |
| GET | `/api/v1/game/quests` | Quest list |
| POST | `/api/v1/game/achievement` | Unlock an achievement |
| GET | `/api/v1/resume` | Serve resume PDF |
| POST | `/api/v1/contact` | Submit contact form |
| POST | `/api/v1/analytics/event` | Track a game event |
| GET | `/api/v1/analytics/summary` | View analytics summary |

## Quick Start

### Backend

```bash
cd backend
go mod tidy
go run ./cmd/server
# API live at http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env          # set VITE_API_URL=http://localhost:8080/api/v1
npm run dev
# App live at http://localhost:5173
```

### Docker (full stack)

```bash
docker-compose up --build
# Full stack at http://localhost:8080
```

## Deployment

### Render (recommended)
1. Push to GitHub
2. Create a Web Service → Docker → point to `/backend/Dockerfile`
3. Set env vars: `ENV=production`, `CONTACT_EMAIL`
4. Add `RENDER_DEPLOY_HOOK_URL` to GitHub Secrets → auto-deploy on push

### GitHub Actions
CI runs on every push to `main`:
- Type-check + build frontend
- `go vet` + `go test` backend  
- Build + push Docker image to GHCR
- Trigger Render deploy hook

## Customising Content

All portfolio content lives in Go structs in `backend/internal/`:
- **Projects** → `projects/handler.go` → `NewHandler()` seed data
- **NPC dialogue** → `game/handler.go` → `dialogues` map
- **Quests** → `game/handler.go` → `quests` slice

Replace with DB calls (Postgres + sqlc recommended) when ready to scale.

## Roadmap

- [ ] Tiled tilemap editor integration (replace procedural ground)  
- [ ] Spritesheet player + NPC animations  
- [ ] PostgreSQL persistence for analytics + quest state  
- [ ] Email via Resend/SendGrid for contact form  
- [ ] Easter egg hidden area  
- [ ] Mobile touch controls polish  
- [ ] Light/dark mode for professional pages  
