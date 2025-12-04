package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"nuclei-dashboard/database"

	nuclei "github.com/projectdiscovery/nuclei/v3/lib"
	"github.com/projectdiscovery/nuclei/v3/pkg/output"
)

// NucleiEngine wraps the core Nuclei library
type NucleiEngine struct {
	ScanCancellations sync.Map // map[uint]context.CancelFunc (ScanID -> CancelFunc)
}

// InitNuclei initializes the Nuclei engine wrapper
func InitNuclei() (*NucleiEngine, error) {
	return &NucleiEngine{}, nil
}

// RunScan executes a scan on the given target with optional templates
func (n *NucleiEngine) RunScan(target string, templatesList string) error {
	log.Printf("Starting scan for target: %s with templates: %s", target, templatesList)

	// 1. Create Scan Record
	scan := database.Scan{
		Target: target,
		Type:   "fast", // Default for now
		Status: "running",
	}
	if result := database.DB.Create(&scan); result.Error != nil {
		return fmt.Errorf("failed to create scan record: %w", result.Error)
	}

	// 2. Create Context with Cancel
	ctx, cancel := context.WithCancel(context.Background())
	n.ScanCancellations.Store(scan.ID, cancel)
	defer n.ScanCancellations.Delete(scan.ID)

	// 3. Create Per-Scan Engine
	ne, err := nuclei.NewThreadSafeNucleiEngineCtx(ctx)
	if err != nil {
		database.DB.Model(&scan).Update("status", "failed")
		return fmt.Errorf("failed to create nuclei engine: %w", err)
	}

	// 4. Setup Callback
	// We can now use a direct callback because we know the ScanID
	ne.GlobalResultCallback(func(event *output.ResultEvent) {
		processResult(scan.ID, event)
	})

	// 5. Configure Options (Templates)
	// For now, we are keeping it simple as per previous steps, but the structure is here.
	var opts []nuclei.NucleiSDKOptions

	// 6. Execute Scan
	err = ne.ExecuteNucleiWithOpts([]string{target}, opts...)

	if err != nil {
		// Check if it was canceled
		if ctx.Err() == context.Canceled {
			database.DB.Model(&scan).Update("status", "stopped")
			log.Printf("Scan stopped for target: %s", target)
			return nil
		}
		database.DB.Model(&scan).Update("status", "failed")
		return fmt.Errorf("scan execution failed: %w", err)
	}

	// Update Scan Status
	database.DB.Model(&scan).Update("status", "completed")
	log.Printf("Scan completed for target: %s", target)
	return nil
}

// StopScan stops a running scan by ID
func (n *NucleiEngine) StopScan(scanID uint) error {
	cancel, ok := n.ScanCancellations.Load(scanID)
	if ok {
		cancelFunc := cancel.(context.CancelFunc)
		cancelFunc()
		return nil
	}

	// Fallback: Check if the scan is "running" in DB but missing from memory (e.g. after restart)
	var scan database.Scan
	if result := database.DB.First(&scan, scanID); result.Error == nil {
		if scan.Status == "running" {
			database.DB.Model(&scan).Update("status", "stopped")
			return nil
		}
	}

	return fmt.Errorf("scan not found or already finished")
}

// processResult implements the Smart Diffing Logic
func processResult(scanID uint, event *output.ResultEvent) {
	// 1. Calculate Fingerprint
	// SHA256(TemplateID + Host + MatcherName)
	data := event.TemplateID + event.Host + event.MatcherName
	hash := sha256.Sum256([]byte(data))
	fingerprint := hex.EncodeToString(hash[:])

	// 2. Check DB for existing finding (Smart Diffing)
	var existingFinding database.Finding
	result := database.DB.Where("fingerprint = ?", fingerprint).First(&existingFinding)

	now := time.Now()
	infoBytes, _ := json.Marshal(event.Info)

	if result.Error != nil {
		// NEW FINDING
		newFinding := database.Finding{
			ScanID:      scanID,
			TemplateID:  event.TemplateID,
			Info:        string(infoBytes),
			Name:        event.Info.Name,
			Severity:    event.Info.SeverityHolder.Severity.String(),
			Description: event.Info.Description,
			Host:        event.Host,
			MatchedAt:   event.Matched,
			Fingerprint: fingerprint,
			State:       "NEW",
			FirstSeen:   now,
			LastSeen:    now,
		}
		database.DB.Create(&newFinding)
		log.Printf("[NEW] Finding detected: %s", event.TemplateID)
	} else {
		// EXISTING FINDING
		updateData := map[string]interface{}{
			"last_seen": now,
			"scan_id":   scanID, // Update to latest scan
		}

		if existingFinding.State == "FIXED" {
			// REGRESSION
			updateData["state"] = "REGRESSED"
			updateData["fixed_at"] = nil
			log.Printf("[REGRESSED] Finding reappeared: %s", event.TemplateID)
		} else {
			// STILL OPEN
			updateData["state"] = "OPEN"
		}

		database.DB.Model(&existingFinding).Updates(updateData)
	}
}
