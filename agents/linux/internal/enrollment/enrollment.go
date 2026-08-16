package enrollment

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/wittemberg/infraops-ai/agents/linux/internal/inventory"
)

type EnrollRequest struct {
	EnrollmentToken string                   `json:"enrollmentToken"`
	AgentVersion    string                   `json:"agentVersion"`
	Hostname        string                   `json:"hostname"`
	MachineIDHash   string                   `json:"machineIdHash"`
	Inventory       *inventory.SystemInventory `json:"inventory"`
}

type EnrollResponse struct {
	AgentID                 string `json:"agentId"`
	NodeID                  string `json:"nodeId"`
	AgentToken              string `json:"agentToken"`
	APIBaseURL              string `json:"apiBaseUrl"`
	HeartbeatIntervalSeconds int    `json:"heartbeatIntervalSeconds"`
}

func PerformEnrollment(apiBaseURL, token, agentVersion string, inv *inventory.SystemInventory) (*EnrollResponse, error) {
	reqBody := EnrollRequest{
		EnrollmentToken: token,
		AgentVersion:    agentVersion,
		Hostname:        inv.Hostname,
		MachineIDHash:   inv.MachineIDHash,
		Inventory:       inv,
	}

	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("%s/v1/agent/enroll", apiBaseURL)
	client := &http.Client{Timeout: 15 * time.Second}

	resp, err := client.Post(url, "application/json", bytes.NewBuffer(jsonBytes))
	if err != nil {
		return nil, fmt.Errorf("enrollment HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("enrollment failed with status code %d", resp.StatusCode)
	}

	var enrollResp EnrollResponse
	if err := json.NewDecoder(resp.Body).Decode(&enrollResp); err != nil {
		return nil, fmt.Errorf("failed to decode enrollment response: %w", err)
	}

	return &enrollResp, nil
}
