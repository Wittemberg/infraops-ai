package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/wittemberg/infraops-ai/agents/linux/internal/config"
	"github.com/wittemberg/infraops-ai/agents/linux/internal/enrollment"
	"github.com/wittemberg/infraops-ai/agents/linux/internal/heartbeat"
	"github.com/wittemberg/infraops-ai/agents/linux/internal/identity"
	"github.com/wittemberg/infraops-ai/agents/linux/internal/inventory"
)

const Version = "0.1.0"

func main() {
	enrollTokenFlag := flag.String("enroll-token", "", "One-time enrollment token to register this agent with InfraOps AI Central")
	apiURLFlag := flag.String("api-url", "", "InfraOps AI API base URL override")
	stateDirFlag := flag.String("state-dir", "", "State directory path override")
	flag.Parse()

	cfg := config.DefaultConfig()
	if *apiURLFlag != "" {
		cfg.APIBaseURL = *apiURLFlag
	}
	if *stateDirFlag != "" {
		cfg.StateDir = *stateDirFlag
	}

	fmt.Printf("InfraOps AI Agent Linux v%s\n", Version)
	fmt.Printf("API Base URL: %s\n", cfg.APIBaseURL)
	fmt.Printf("State Directory: %s\n", cfg.StateDir)

	// Collect local system inventory
	inv, err := inventory.CollectInventory()
	if err != nil {
		log.Fatalf("Failed to collect system inventory: %v", err)
	}

	// 1. Enrollment Flow
	if *enrollTokenFlag != "" {
		fmt.Println("Initiating enrollment with central platform...")
		resp, err := enrollment.PerformEnrollment(cfg.APIBaseURL, *enrollTokenFlag, Version, inv)
		if err != nil {
			log.Fatalf("Enrollment failed: %v", err)
		}

		ident := &identity.AgentIdentity{
			AgentID:    resp.AgentID,
			NodeID:     resp.NodeID,
			AgentToken: resp.AgentToken,
			EnrolledAt: time.Now().UTC().Format(time.RFC3339),
			APIBaseURL: cfg.APIBaseURL,
		}

		if err := identity.SaveIdentity(cfg.StateDir, ident); err != nil {
			log.Fatalf("Failed to save identity credentials: %v", err)
		}

		fmt.Printf("Enrollment successful! Agent ID: %s | Node ID: %s\n", resp.AgentID, resp.NodeID)
		os.Exit(0)
	}

	// 2. Load Existing Identity & Run Daemon Heartbeat Loop
	ident, err := identity.LoadIdentity(cfg.StateDir)
	if err != nil {
		log.Fatalf("Agent not enrolled. Please run with --enroll-token=<token> to register this node. Error: %v", err)
	}

	fmt.Printf("Agent identity loaded (Agent ID: %s). Starting outbound heartbeat ticker...\n", ident.AgentID)

	startTime := time.Now()
	ticker := time.NewTicker(time.Duration(cfg.HeartbeatIntervalSeconds) * time.Second)
	defer ticker.Stop()

	// Initial Heartbeat
	if err := heartbeat.SendHeartbeat(ident, Version, startTime); err != nil {
		log.Printf("[WARNING] Initial heartbeat failed: %v", err)
	} else {
		log.Printf("[INFO] Initial heartbeat sent successfully")
	}

	for range ticker.C {
		if err := heartbeat.SendHeartbeat(ident, Version, startTime); err != nil {
			log.Printf("[WARNING] Heartbeat failed: %v", err)
		} else {
			log.Printf("[INFO] Heartbeat sent OK")
		}
	}
}
