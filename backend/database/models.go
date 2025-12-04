package database

import (
	"time"

	"gorm.io/gorm"
)

// Scan represents a single execution of Nuclei
type Scan struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Target   string    `json:"target"`
	Type     string    `json:"type"`
	Status   string    `json:"status"` // running, completed, failed
	Findings []Finding `json:"findings,omitempty"`
}

// Finding represents a single vulnerability found by Nuclei
type Finding struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	ScanID      uint   `json:"scan_id"`
	TemplateID  string `gorm:"index" json:"template_id"`
	Info        string `json:"info"` // JSON string of the 'info' block
	Name        string `json:"name"`
	Severity    string `json:"severity"`
	Description string `json:"description"`
	Host        string `json:"host"`
	MatchedAt   string `json:"matched_at"`

	// Smart Diffing Fields
	Fingerprint string     `gorm:"uniqueIndex" json:"fingerprint"` // SHA256 Hash
	State       string     `gorm:"index" json:"state"`             // NEW, OPEN, FIXED, REGRESSED
	FirstSeen   time.Time  `json:"first_seen"`
	LastSeen    time.Time  `json:"last_seen"`
	FixedAt     *time.Time `json:"fixed_at,omitempty"`
}
