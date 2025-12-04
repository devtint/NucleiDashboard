package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"nuclei-dashboard/database"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/golang-jwt/jwt/v5"
)

func main() {
	log.Println("Starting Nuclei Dashboard Backend v2...")

	// Initialize Database
	database.InitDB()

	app := fiber.New()

	// Enable CORS for frontend
	// Enable CORS for frontend
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000, http://127.0.0.1:3000",
		AllowHeaders:     "Origin, Content-Type, Accept",
		AllowCredentials: true,
	}))

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

	app.Get("/api/templates", func(c *fiber.Ctx) error {
		root := "/home/tyrell/nuclei-templates"
		var templates []map[string]string

		err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if !info.IsDir() && strings.HasSuffix(info.Name(), ".yaml") {
				relPath, _ := filepath.Rel(root, path)
				templates = append(templates, map[string]string{
					"name": relPath,
					"path": path,
				})
			}
			return nil
		})

		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		return c.JSON(templates)
	})

	app.Get("/api/templates/content", func(c *fiber.Ctx) error {
		path := c.Query("path")
		if path == "" {
			return c.Status(400).JSON(fiber.Map{"error": "Path is required"})
		}

		// Basic security check: ensure path starts with templates directory
		if !strings.HasPrefix(path, "/home/tyrell/nuclei-templates") {
			return c.Status(403).JSON(fiber.Map{"error": "Access denied"})
		}

		content, err := os.ReadFile(path)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		return c.SendString(string(content))
	})

	// Auth Middleware
	app.Use(func(c *fiber.Ctx) error {
		// Public routes
		if c.Path() == "/api/login" || c.Path() == "/api/health" || !strings.HasPrefix(c.Path(), "/api/") {
			return c.Next()
		}

		cookie := c.Cookies("auth_token")
		if cookie == "" {
			return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
		}

		token, err := jwt.Parse(cookie, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte("secret-key"), nil // In production, use env var
		})

		if err != nil || !token.Valid {
			return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
		}

		return c.Next()
	})

	app.Post("/api/login", func(c *fiber.Ctx) error {
		var input struct {
			Password string `json:"password"`
		}

		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
		}

		adminPassword := os.Getenv("ADMIN_PASSWORD")
		if adminPassword == "" {
			adminPassword = "admin"
		}

		if input.Password != adminPassword {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid password"})
		}

		// Create token
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"admin": true,
			"exp":   time.Now().Add(time.Hour * 24).Unix(),
		})

		tokenString, err := token.SignedString([]byte("secret-key"))
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Could not create token"})
		}

		c.Cookie(&fiber.Cookie{
			Name:     "auth_token",
			Value:    tokenString,
			Expires:  time.Now().Add(time.Hour * 24),
			HTTPOnly: true,
			SameSite: "Lax",
		})

		return c.JSON(fiber.Map{"status": "success"})
	})

	app.Post("/api/logout", func(c *fiber.Ctx) error {
		c.Cookie(&fiber.Cookie{
			Name:     "auth_token",
			Value:    "",
			Expires:  time.Now().Add(-time.Hour),
			HTTPOnly: true,
			SameSite: "Lax",
		})
		return c.JSON(fiber.Map{"status": "success"})
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

		// Calculate trend (vs 7 days ago)
		var totalVulnerabilitiesLastWeek int64
		lastWeek := time.Now().AddDate(0, 0, -7)
		database.DB.Model(&database.Finding{}).Where("state != ? AND created_at < ?", "FIXED", lastWeek).Count(&totalVulnerabilitiesLastWeek)

		var vulnerabilityChange string
		var vulnerabilityTrend string

		if totalVulnerabilitiesLastWeek == 0 {
			if totalVulnerabilities > 0 {
				vulnerabilityChange = "+100%"
				vulnerabilityTrend = "up"
			} else {
				vulnerabilityChange = "0%"
				vulnerabilityTrend = "neutral"
			}
		} else {
			diff := float64(totalVulnerabilities - totalVulnerabilitiesLastWeek)
			percent := (diff / float64(totalVulnerabilitiesLastWeek)) * 100
			if percent > 0 {
				vulnerabilityChange = fmt.Sprintf("+%.0f%% from last week", percent)
				vulnerabilityTrend = "up"
			} else if percent < 0 {
				vulnerabilityChange = fmt.Sprintf("%.0f%% from last week", percent)
				vulnerabilityTrend = "down" // down is actually good for vulnerabilities, but visually we might want green for down
			} else {
				vulnerabilityChange = "No change"
				vulnerabilityTrend = "neutral"
			}
		}

		return c.JSON(fiber.Map{
			"total_vulnerabilities": totalVulnerabilities,
			"active_scans":          activeScans,
			"critical_issues":       criticalIssues,
			"recent_scans":          recentScans,
			"critical_findings":     criticalFindings,
			"vulnerability_change":  vulnerabilityChange,
			"vulnerability_trend":   vulnerabilityTrend,
		})
	})

	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":    "ok",
			"component": "backend",
		})
	})

	log.Fatal(app.Listen("0.0.0.0:3001"))
}
