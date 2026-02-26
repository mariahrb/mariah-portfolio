package game

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// NPC represents a non-player character in the world.
type NPC struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Role     string  `json:"role"`
	X        float64 `json:"x"`
	Y        float64 `json:"y"`
	Sprite   string  `json:"sprite"` // sprite key in Phaser atlas
	Building string  `json:"building,omitempty"`
}

// DialogueLine is a single line in a conversation tree.
type DialogueLine struct {
	Text    string         `json:"text"`
	Speaker string         `json:"speaker"`
	Choices []DialogueChoice `json:"choices,omitempty"`
}

// DialogueChoice is a player response option.
type DialogueChoice struct {
	Text     string `json:"text"`
	NextID   string `json:"nextId,omitempty"`   // jump to another dialogue line
	Action   string `json:"action,omitempty"`    // "open:devlab" | "unlock:quest-nexus"
}

// DialogueTree maps line IDs to lines.
type DialogueTree struct {
	NPCID string                  `json:"npcId"`
	Lines map[string]DialogueLine `json:"lines"`
	Start string                  `json:"start"`
}

// Quest represents a gamified exploration goal.
type Quest struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Reward      string `json:"reward"`
	Trigger     string `json:"trigger"` // "visit:devlab" | "talk:old-dev" | "find:easter-egg"
	Unlocked    bool   `json:"unlocked"`
}

type Handler struct {
	npcs      []NPC
	dialogues map[string]DialogueTree
	quests    []Quest
}

func NewHandler() *Handler {
	return &Handler{
		npcs: []NPC{
			{ID: "old-dev", Name: "Old Dev", Role: "Retired Engineer", X: 820, Y: 580, Sprite: "npc_olddev"},
			{ID: "designer", Name: "Pixel", Role: "UI Wizard", X: 340, Y: 780, Sprite: "npc_designer"},
			{ID: "recruiter", Name: "Scout", Role: "Talent Scout", X: 1100, Y: 420, Sprite: "npc_recruiter"},
			{ID: "mentor", Name: "Sage", Role: "Engineering Mentor", X: 660, Y: 200, Sprite: "npc_mentor"},
		},
		dialogues: map[string]DialogueTree{
			"old-dev": {
				NPCID: "old-dev", Start: "intro",
				Lines: map[string]DialogueLine{
					"intro": {
						Speaker: "Old Dev",
						Text:    "Ah, a visitor! I've watched Mariah build this valley from nothing. Impressive stuff.",
						Choices: []DialogueChoice{
							{Text: "Tell me about her projects", NextID: "projects"},
							{Text: "What's she like to work with?", NextID: "character"},
							{Text: "Goodbye!", NextID: ""},
						},
					},
					"projects": {
						Speaker: "Old Dev",
						Text:    "She once built a streaming platform that handled 2 million events a day. Want to see it?",
						Choices: []DialogueChoice{
							{Text: "Yes, show me!", Action: "open:devlab"},
							{Text: "Maybe later", NextID: ""},
						},
					},
					"character": {
						Speaker: "Old Dev",
						Text:    "Sharp, curious, and she actually ships. Rare combination. The Dev Lab tells the whole story.",
						Choices: []DialogueChoice{
							{Text: "Take me there", Action: "open:devlab"},
							{Text: "Thanks for sharing", NextID: ""},
						},
					},
				},
			},
			"designer": {
				NPCID: "designer", Start: "intro",
				Lines: map[string]DialogueLine{
					"intro": {
						Speaker: "Pixel",
						Text:    "✨ Oh hi! I live in the Creative Studio. Mariah designed this whole valley, you know.",
						Choices: []DialogueChoice{
							{Text: "I'd love to see her design work", Action: "open:studio"},
							{Text: "Did she build this game too?", NextID: "meta"},
							{Text: "Bye!", NextID: ""},
						},
					},
					"meta": {
						Speaker: "Pixel",
						Text:    "Ha! Yes, the portfolio IS the project. Pretty meta, right? That's kind of her whole thing.",
						Choices: []DialogueChoice{
							{Text: "Love that. Show me more.", Action: "open:studio"},
							{Text: "Cool, thanks!", NextID: ""},
						},
					},
				},
			},
			"recruiter": {
				NPCID: "recruiter", Start: "intro",
				Lines: map[string]DialogueLine{
					"intro": {
						Speaker: "Scout",
						Text:    "I've been looking for Mariah everywhere. You seen her resume? It's in the Library.",
						Choices: []DialogueChoice{
							{Text: "Take me to the Library", Action: "open:library"},
							{Text: "I want to contact her directly", Action: "open:townhall"},
							{Text: "I'll find it myself", NextID: ""},
						},
					},
				},
			},
			"mentor": {
				NPCID: "mentor", Start: "intro",
				Lines: map[string]DialogueLine{
					"intro": {
						Speaker: "Sage",
						Text:    "Every great engineer builds things that outlast them. Mariah understands that deeply.",
						Choices: []DialogueChoice{
							{Text: "What has she built that lasts?", NextID: "oss"},
							{Text: "Wise words. Goodbye.", NextID: ""},
						},
					},
					"oss": {
						Speaker: "Sage",
						Text:    "Her open source work has 2,000 stars and growing. The Innovation Center has the full story.",
						Choices: []DialogueChoice{
							{Text: "Show me", Action: "open:innovation"},
							{Text: "Impressive. Thanks.", NextID: ""},
						},
					},
				},
			},
		},
		quests: []Quest{
			{
				ID: "explorer", Title: "World Explorer",
				Description: "Visit all 6 buildings in Mariah Valley.",
				Reward: "You've seen the full picture.", Trigger: "visit-all",
			},
			{
				ID: "conversationalist", Title: "People Person",
				Description: "Talk to all 4 NPCs.",
				Reward: "Unlocks hidden dialogue.", Trigger: "talk-all",
			},
			{
				ID: "speedrun", Title: "Speedrunner",
				Description: "Visit the Dev Lab within 60 seconds of entering the world.",
				Reward: "Achievement: Fast Learner 🏆", Trigger: "speedrun",
			},
		},
	}
}

func (h *Handler) ListNPCs(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"npcs": h.npcs})
}

func (h *Handler) GetDialogue(c *gin.Context) {
	npcID := c.Param("npcId")
	tree, ok := h.dialogues[npcID]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "dialogue not found"})
		return
	}
	c.JSON(http.StatusOK, tree)
}

func (h *Handler) ListQuests(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"quests": h.quests})
}

func (h *Handler) UnlockAchievement(c *gin.Context) {
	var body struct {
		QuestID  string `json:"questId"`
		PlayerID string `json:"playerId"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// In production: persist to DB, return badge data
	c.JSON(http.StatusOK, gin.H{
		"unlocked": true,
		"questId":  body.QuestID,
		"message":  "Achievement unlocked! 🏆",
	})
}
