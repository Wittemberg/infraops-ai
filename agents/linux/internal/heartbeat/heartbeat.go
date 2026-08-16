package heartbeat

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/wittemberg/infraops-ai/agents/linux/internal/identity"
)

type HeartbeatPayload struct {
	AgentID       string   `json:"agentId"`
	AgentVersion  string   `json:"agentVersion"`
	Timestamp     string   `json:"timestamp"`
	UptimeSeconds int64    `json:"uptimeSeconds"`
	Capabilities  []string `json:"capabilities"`
}

type HeartbeatResponse struct {
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
}

func SendHeartbeat(ident *identity.AgentIdentity, agentVersion string, startTime time.Time) error {
	uptime := int64(time.Since(startTime).Seconds())

	payload := HeartbeatPayload{
		AgentID:       ident.AgentID,
		AgentVersion:  agentVersion,
		Timestamp:     time.Now().UTC().Format(time.RFC3339),
		UptimeSeconds: uptime,
		Capabilities: []string{
			"node.health:v1",
			"node.inventory:v1",
		},
	}

	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	url := fmt.Sprintf("%s/v1/agent/heartbeat", ident.APIBaseURL)
	client := &http.Client{Timeout: 10 * time.Second}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Agent %s", ident.AgentToken))

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("heartbeat HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("heartbeat rejected with status %d", resp.StatusCode)
	}

	return nil
}
