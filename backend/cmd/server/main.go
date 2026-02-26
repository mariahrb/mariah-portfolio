package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/mariah/portfolio/internal/server"
)

func main() {
	// Load .env if present (ignored in production)
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	s := server.New()
	log.Printf("🌿 Mariah Valley API starting on :%s", port)
	if err := s.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
