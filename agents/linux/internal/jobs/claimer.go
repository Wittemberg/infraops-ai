package jobs

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/wittemberg/infraops-ai/agents/linux/internal/identity"
)

type ClaimJobsRequest struct {
	AgentID      string   `json:"agentId"`
	MaxJobs      int      `json:"maxJobs"`
	Capabilities []string `json:"capabilities"`
}

type AgentJobPayload struct {
	JobID          string                 `json:"jobId"`
	NodeID         string                 `json:"nodeId"`
	TenantID       string                 `json:"tenantId"`
	IdempotencyKey string                 `json:"idempotencyKey"`
	Action         string                 `json:"action"`
	ActionVersion  string                 `json:"actionVersion"`
	Parameters     map[string]interface{} `json:"parameters"`
	TimeoutSeconds int                    `json:"timeoutSeconds"`
	IssuedAt       string                 `json:"issuedAt"`
	ExpiresAt      string                 `json:"expiresAt"`
}

type ClaimJobsResponse struct {
	Jobs []AgentJobPayload `json:"jobs"`
}

func ClaimJobs(ident *identity.AgentIdentity, journal *JobJournal, capabilities []string) ([]AgentJobPayload, error) {
	reqPayload := ClaimJobsRequest{
		AgentID:      ident.AgentID,
		MaxJobs:      1,
		Capabilities: capabilities,
	}

	jsonBytes, err := json.Marshal(reqPayload)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("%s/v1/agent/jobs/claim", ident.APIBaseURL)
	client := &http.Client{Timeout: 10 * time.Second}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Agent %s", ident.AgentToken))

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("claim jobs HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("claim jobs failed with status %d", resp.StatusCode)
	}

	var claimResp ClaimJobsResponse
	if err := json.NewDecoder(resp.Body).Decode(&claimResp); err != nil {
		return nil, fmt.Errorf("failed to decode claim response: %w", err)
	}

	var validJobs []AgentJobPayload
	now := time.Now().UTC()

	for _, job := range claimResp.Jobs {
		// 1. Check if node ID matches agent node ID
		if job.NodeID != ident.NodeID {
			continue
		}

		// 2. Check temporal validity
		if job.ExpiresAt != "" {
			expTime, err := time.Parse(time.RFC3339, job.ExpiresAt)
			if err == nil && now.After(expTime) {
				continue // Skip expired job
			}
		}

		// 3. Check local journal for idempotency / completion
		if journal.IsJobCompleted(job.JobID) {
			continue // Skip already executed job
		}

		validJobs = append(validJobs, job)
	}

	return validJobs, nil
}
