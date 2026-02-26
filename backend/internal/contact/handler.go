package contact

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

type Message struct {
	Name    string `json:"name"    binding:"required"`
	Email   string `json:"email"   binding:"required,email"`
	Company string `json:"company"`
	Body    string `json:"body"    binding:"required,min=10"`
}

type Handler struct{}

func NewHandler() *Handler { return &Handler{} }

func (h *Handler) Send(c *gin.Context) {
	var msg Message
	if err := c.ShouldBindJSON(&msg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In production: send via SendGrid / Resend / SMTP
	// For now, log to stdout (replace with real email service)
	recipient := os.Getenv("CONTACT_EMAIL")
	if recipient == "" {
		recipient = "hello@mariahvalley.com"
	}

	fmt.Printf("📬 New contact from %s <%s> [%s]\n%s\n", msg.Name, msg.Email, msg.Company, msg.Body)

	// TODO: integrate email provider
	// sendgrid.Send(recipient, msg)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("Thanks %s! I'll be in touch soon.", msg.Name),
	})
}
