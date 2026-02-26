package analytics

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// Event types tracked in the game world.
const (
	EventBuildingEntered = "building_entered"
	EventNPCTalked       = "npc_talked"
	EventPageViewed      = "page_viewed"
	EventQuestUnlocked   = "quest_unlocked"
	EventModeSelected    = "mode_selected" // "game" | "pro"
)

type Event struct {
	Type      string            `json:"type"`
	Target    string            `json:"target"` // building id, npc id, page key
	SessionID string            `json:"sessionId"`
	Meta      map[string]string `json:"meta,omitempty"`
	Timestamp time.Time         `json:"timestamp"`
}

type Summary struct {
	TotalVisits     int            `json:"totalVisits"`
	BuildingVisits  map[string]int `json:"buildingVisits"`
	ModeBreakdown   map[string]int `json:"modeBreakdown"`
	NPCInteractions map[string]int `json:"npcInteractions"`
}

type Handler struct {
	mu     sync.Mutex
	events []Event
}

func NewHandler() *Handler { return &Handler{} }

func (h *Handler) Track(c *gin.Context) {
	var ev Event
	if err := c.ShouldBindJSON(&ev); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ev.Timestamp = time.Now()

	h.mu.Lock()
	h.events = append(h.events, ev)
	// Keep last 10k events in memory (replace with DB in production)
	if len(h.events) > 10000 {
		h.events = h.events[len(h.events)-10000:]
	}
	h.mu.Unlock()

	c.JSON(http.StatusOK, gin.H{"recorded": true})
}

func (h *Handler) Summary(c *gin.Context) {
	h.mu.Lock()
	defer h.mu.Unlock()

	summary := Summary{
		TotalVisits:     len(h.events),
		BuildingVisits:  make(map[string]int),
		ModeBreakdown:   make(map[string]int),
		NPCInteractions: make(map[string]int),
	}

	for _, ev := range h.events {
		switch ev.Type {
		case EventBuildingEntered:
			summary.BuildingVisits[ev.Target]++
		case EventModeSelected:
			summary.ModeBreakdown[ev.Target]++
		case EventNPCTalked:
			summary.NPCInteractions[ev.Target]++
		}
	}

	c.JSON(http.StatusOK, summary)
}
