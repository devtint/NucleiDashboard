package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"time"

	"nuclei-dashboard/database"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	log.Println("Starting Nuclei Dashboard Backend v2...")

	// Initialize Database
	database.InitDB()

	app := fiber.New()

	// Enable CORS for frontend
	app.Use(cors.New())

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Nuclei Dashboard Backend is Running!")
	})

	// Initialize Nuclei Engine
	nucleiEngine, err := InitNuclei()
	if err != nil {
		log.Fatalf("Failed to initialize Nuclei: %v", err)
	}

	app.Post("/api/scan", func(c *fiber.Ctx) error {
		type ScanRequest struct {
			Target    string `json:"target"`
			Type      string `json:"type"`
			Templates string `json:"templates"` // Comma-separated list of templates/tags
		}

		var req ScanRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
		}

		if req.Target == "" {
			return c.Status(400).JSON(fiber.Map{"error": "Target is required"})
		}

		// Run scan in a goroutine to not block the API
		go func() {
			if err := nucleiEngine.RunScan(req.Target, req.Templates); err != nil {
				log.Printf("Scan failed for %s: %v", req.Target, err)
			}
		}()

		return c.JSON(fiber.Map{
			"status":  "started",
			"message": fmt.Sprintf("Scan started for %s", req.Target),
		})
	})

	app.Post("/api/scan/:id/stop", func(c *fiber.Ctx) error {
		id, err := c.ParamsInt("id")
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid scan ID"})
		}

		if err := nucleiEngine.StopScan(uint(id)); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}

		return c.JSON(fiber.Map{"status": "stopped", "message": "Scan stop requested"})
	})

	app.Get("/api/findings", func(c *fiber.Ctx) error {
		var findings []database.Finding
		// Fetch all findings, ordered by severity (High -> Low) and time
		result := database.DB.Order("created_at desc").Find(&findings)
		if result.Error != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch findings"})
		}
		return c.JSON(findings)
	})

	app.Get("/api/findings/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		var finding database.Finding
		result := database.DB.First(&finding, id)
		if result.Error != nil {
			return c.Status(404).JSON(fiber.Map{"error": "Finding not found"})
		}
		return c.JSON(finding)
	})

	app.Patch("/api/findings/:id/status", func(c *fiber.Ctx) error {
		id := c.Params("id")
		type UpdateRequest struct {
			State string `json:"state"`
		}
		var req UpdateRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
		}

		// Validate state
		validStates := map[string]bool{
			"OPEN":           true,
			"FIXED":          true,
			"FALSE_POSITIVE": true,
			"ACCEPTED_RISK":  true,
		}
		if !validStates[req.State] {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid state"})
		}

		var finding database.Finding
		if result := database.DB.First(&finding, id); result.Error != nil {
			return c.Status(404).JSON(fiber.Map{"error": "Finding not found"})
		}

		finding.State = req.State
		database.DB.Save(&finding)

		return c.JSON(finding)
	})

	app.Delete("/api/findings/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		var finding database.Finding
		if result := database.DB.First(&finding, id); result.Error != nil {
			return c.Status(404).JSON(fiber.Map{"error": "Finding not found"})
		}

		// Soft delete
		database.DB.Delete(&finding)
		return c.JSON(fiber.Map{"status": "deleted", "id": id})
	})

	app.Get("/api/export", func(c *fiber.Ctx) error {
		var findings []database.Finding
		if result := database.DB.Find(&findings); result.Error != nil {
			return c.Status(500).SendString("Failed to fetch findings")
		}

		c.Set("Content-Type", "text/csv")
		c.Set("Content-Disposition", "attachment; filename=findings.csv")

		writer := csv.NewWriter(c.Response().BodyWriter())
		defer writer.Flush()

		// Headers
		writer.Write([]string{"ID", "Name", "Severity", "Host", "Template ID", "State", "Matched At", "First Seen", "Last Seen"})

		// Data
		for _, f := range findings {
			writer.Write([]string{
				fmt.Sprintf("%d", f.ID),
				f.Name,
				f.Severity,
				f.Host,
				f.TemplateID,
				f.State,
				f.MatchedAt,
				f.FirstSeen.Format(time.RFC3339),
				f.LastSeen.Format(time.RFC3339),
			})
		}

		return nil
	})

	app.Get("/api/stats", func(c *fiber.Ctx) error {
		var totalVulnerabilities int64
		var activeScans int64
		var criticalIssues int64

		// Count total vulnerabilities (excluding fixed)
		database.DB.Model(&database.Finding{}).Where("state != ?", "FIXED").Count(&totalVulnerabilities)

		// Count active scans
		database.DB.Model(&database.Scan{}).Where("status = ?", "running").Count(&activeScans)

		// Count critical/high issues
		database.DB.Model(&database.Finding{}).Where("state != ? AND (severity = ? OR severity = ?)", "FIXED", "critical", "high").Count(&criticalIssues)

		// Fetch recent scans (limit 5)
		var recentScans []database.Scan
		database.DB.Order("created_at desc").Limit(5).Find(&recentScans)

		// Fetch recent critical/high findings (limit 5)
		var criticalFindings []database.Finding
		database.DB.Where("state != ? AND (severity = ? OR severity = ?)", "FIXED", "critical", "high").Order("created_at desc").Limit(5).Find(&criticalFindings)

		return c.JSON(fiber.Map{
			"total_vulnerabilities": totalVulnerabilities,
			"active_scans":          activeScans,
			"critical_issues":       criticalIssues,
			"recent_scans":          recentScans,
			"critical_findings":     criticalFindings,
		})
	})

	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":    "ok",
			"component": "backend",
		})
	})

	log.Fatal(app.Listen(":3001"))
}
