package server

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/mariah/portfolio/internal/analytics"
	"github.com/mariah/portfolio/internal/contact"
	"github.com/mariah/portfolio/internal/game"
	"github.com/mariah/portfolio/internal/projects"
)

// New creates and configures the Gin engine with all routes registered.
func New() *gin.Engine {
	if os.Getenv("ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// ── CORS ──────────────────────────────────────────────
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "https://mariahvalley.com"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
	}))

	// ── HEALTH ────────────────────────────────────────────
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "world": "Mariah Valley"})
	})

	// ── API v1 ────────────────────────────────────────────
	v1 := r.Group("/api/v1")
	{
		// Projects
		projectHandler := projects.NewHandler()
		v1.GET("/projects", projectHandler.List)
		v1.GET("/projects/:id", projectHandler.Get)
		v1.GET("/designs", projectHandler.ListDesigns)

		// Game data (NPCs, dialogue, quests, achievements)
		gameHandler := game.NewHandler()
		v1.GET("/game/npcs", gameHandler.ListNPCs)
		v1.GET("/game/dialogue/:npcId", gameHandler.GetDialogue)
		v1.GET("/game/quests", gameHandler.ListQuests)
		v1.POST("/game/achievement", gameHandler.UnlockAchievement)

		// Contact form
		contactHandler := contact.NewHandler()
		v1.POST("/contact", contactHandler.Send)

		// Resume download
		v1.GET("/resume", func(c *gin.Context) {
			c.File("./assets/resume.pdf")
		})

		// Analytics (page visits, building entries)
		analyticsHandler := analytics.NewHandler()
		v1.POST("/analytics/event", analyticsHandler.Track)
		v1.GET("/analytics/summary", analyticsHandler.Summary)
	}

	// ── SERVE FRONTEND BUILD ──────────────────────────────
	// In production, Go serves the compiled React/Vite build
	distRoot := filepath.Clean("./frontend/dist")
	r.NoRoute(func(c *gin.Context) {
		reqPath := filepath.Clean(c.Request.URL.Path)

		// Never treat API-like paths as frontend files.
		if strings.HasPrefix(reqPath, "/api/") || reqPath == "/api" {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}

		// Candidate file inside dist; serve it if it exists and isn't a directory.
		candidate := filepath.Join(distRoot, reqPath)
		if strings.HasPrefix(candidate, distRoot) {
			if st, err := os.Stat(candidate); err == nil && !st.IsDir() {
				c.File(candidate)
				return
			}
		}

		// SPA fallback
		c.File(filepath.Join(distRoot, "index.html"))
	})

	return r
}
