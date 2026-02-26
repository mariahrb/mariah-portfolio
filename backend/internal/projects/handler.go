package projects

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Project represents a portfolio engineering project.
type Project struct {
	ID          string   `json:"id"`
	Number      string   `json:"number"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	LongDesc    string   `json:"longDescription"`
	Tags        []string `json:"tags"`
	GithubURL   string   `json:"githubUrl,omitempty"`
	LiveURL     string   `json:"liveUrl,omitempty"`
	Color       string   `json:"color"`
	Category    string   `json:"category"` // "engineering" | "design" | "innovation"
	Featured    bool     `json:"featured"`
}

// Handler holds the projects service.
type Handler struct {
	projects []Project
	designs  []Project
}

// NewHandler initialises with seed data.
// In production, replace with a DB call or CMS fetch.
func NewHandler() *Handler {
	return &Handler{
		projects: []Project{
			{
				ID: "nexus", Number: "01", Title: "Project Nexus",
				Description: "High-throughput event streaming platform — 2M events/day, sub-10ms p99 latency.",
				LongDesc:    "Built on Go + Kafka, Nexus replaced a brittle webhook system with a durable, ordered event bus. Reduced alert noise by 60% and allowed async fan-out to 8 downstream consumers.",
				Tags:        []string{"Go", "Kafka", "PostgreSQL", "Redis"},
				GithubURL:   "https://github.com/mariah/nexus",
				Color:       "#e8573a", Category: "engineering", Featured: true,
			},
			{
				ID: "devkit", Number: "02", Title: "DevKit CLI",
				Description: "Open-source developer toolkit. 1.2k ★. Scaffolds projects, manages secrets, automates deploys.",
				LongDesc:    "A batteries-included CLI written in Go using Cobra. Handles project scaffolding, .env management, Docker Compose generation, and one-command deploys to Render/Railway.",
				Tags:        []string{"Go", "Cobra", "Docker"},
				GithubURL:   "https://github.com/mariah/devkit",
				Color:       "#5ec4a0", Category: "engineering", Featured: true,
			},
			{
				ID: "atlas", Number: "03", Title: "Atlas API",
				Description: "RESTful platform powering 3 consumer apps. Clean architecture, full test coverage, OpenAPI spec.",
				Tags:        []string{"Go", "Gin", "PostgreSQL"},
				Color:       "#9b7ec8", Category: "engineering",
			},
			{
				ID: "synapse", Number: "04", Title: "Synapse ML",
				Description: "Feature store and model serving layer integrated into production data pipelines.",
				Tags:        []string{"Python", "FastAPI", "Redis", "MLflow"},
				Color:       "#f0c040", Category: "engineering",
			},
		},
		designs: []Project{
			{
				ID: "valley-os", Number: "01", Title: "Valley OS",
				Description: "A design system for developer tools. Tokens, components, full documentation.",
				Tags:        []string{"Figma", "Design Tokens", "Storybook"},
				Color:       "#c8744a", Category: "design", Featured: true,
			},
			{
				ID: "brand-identity", Number: "02", Title: "Brand Identity",
				Description: "End-to-end brand work for a seed-stage startup — logo, system, motion guidelines.",
				Tags:        []string{"Figma", "After Effects", "Branding"},
				Color:       "#9b7ec8", Category: "design",
			},
			{
				ID: "dashboards", Number: "03", Title: "Data Dashboards",
				Description: "Complex analytics interfaces that make dense data legible and beautiful.",
				Tags:        []string{"Figma", "D3.js", "Prototyping"},
				Color:       "#5ec4a0", Category: "design",
			},
		},
	}
}

func (h *Handler) List(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"projects": h.projects, "count": len(h.projects)})
}

func (h *Handler) Get(c *gin.Context) {
	id := c.Param("id")
	for _, p := range h.projects {
		if p.ID == id {
			c.JSON(http.StatusOK, p)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
}

func (h *Handler) ListDesigns(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"designs": h.designs, "count": len(h.designs)})
}
