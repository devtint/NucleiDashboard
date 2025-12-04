package database

import (
	"log"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDB initializes the database connection and performs auto-migration
func InitDB() {
	var err error
	// Use SQLite for local development (easy to swap for Postgres later)
	DB, err = gorm.Open(sqlite.Open("nuclei-dashboard.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connected successfully.")

	// Auto Migrate the schema
	err = DB.AutoMigrate(&Scan{}, &Finding{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}
	log.Println("Database migration completed.")
}
