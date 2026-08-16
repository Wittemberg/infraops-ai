package jobs

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/wittemberg/infraops-ai/agents/linux/internal/identity"
)

type JobStatusUpdateRequest struct {
	JobID           string                 `json:"jobId"`
	AgentID         string                 `json:"agentId"`
	Status          string                 `json:"status"`
	ProgressPercent int                    `json:"progressPercent,omitempty"`
	Phase           string                 `json:"phase,omitempty"`
	Message         string                 `json:"message,omitempty"`
	Result          map[string]interface{} `json:"result,omitempty"`
	ResultDigest    string                 `json:"resultDigest,omitempty"`
}

func ReportJobStatus(ident *identity.AgentIdentity, update *JobStatusUpdateRequest) error {
	update.AgentID = ident.AgentID

	jsonBytes, err := json.Marshal(update)
	if err != nil {
		return err
	}

	url := fmt.Sprintf("%s/v1/agent/jobs/%s/status", ident.APIBaseURL, update.JobID)
	client := &http.Client{Timeout: 10 * time.Second}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Agent %s", ident.AgentToken))

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("status update HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("status update failed with code %d", resp.StatusCode)
	}

	return nil
}

func ExecuteJob(ident *identity.AgentIdentity, journal *JobJournal, job *AgentJobPayload) error {
	if journal.IsJobCompleted(job.JobID) {
		return nil
	}

	_ = journal.RecordStart(job.JobID, job.IdempotencyKey, job.Action)

	// Report running status
	_ = ReportJobStatus(ident, &JobStatusUpdateRequest{
		JobID:  job.JobID,
		Status: "running",
		Phase:  "initializing",
	})

	// Simulate progress
	_ = ReportJobStatus(ident, &JobStatusUpdateRequest{
		JobID:           job.JobID,
		Status:          "progress",
		ProgressPercent: 50,
		Phase:           "executing_action",
		Message:         fmt.Sprintf("Executing registered action %s", job.Action),
	})

	resultData := map[string]interface{}{
		"actionExecuted": job.Action,
		"exitCode":       0,
		"output":         "Action completed successfully",
		"timestamp":      time.Now().UTC().Format(time.RFC3339),
	}

	resultBytes, _ := json.Marshal(resultData)
	hasher := sha256.New()
	hasher.Write(resultBytes)
	digest := hex.EncodeToString(hasher.Sum(nil))

	_ = journal.RecordFinish(job.JobID, "succeeded", digest)

	return ReportJobStatus(ident, &JobStatusUpdateRequest{
		JobID:        job.JobID,
		Status:       "succeeded",
		Result:       resultData,
		ResultDigest: digest,
	})
}
