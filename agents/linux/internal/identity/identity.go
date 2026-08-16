package identity

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

type AgentIdentity struct {
	AgentID     string `json:"agent_id"`
	NodeID      string `json:"node_id"`
	AgentToken  string `json:"agent_token"`
	EnrolledAt  string `json:"enrolled_at"`
	APIBaseURL  string `json:"api_base_url"`
}

func SaveIdentity(dir string, ident *AgentIdentity) error {
	if err := os.MkdirAll(dir, 0700); err != nil {
		return fmt.Errorf("failed to create state dir: %w", err)
	}

	path := filepath.Join(dir, "identity.json")
	data, err := json.MarshalIndent(ident, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0600)
}

func LoadIdentity(dir string) (*AgentIdentity, error) {
	path := filepath.Join(dir, "identity.json")
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var ident AgentIdentity
	if err := json.Unmarshal(data, &ident); err != nil {
		return nil, err
	}

	return &ident, nil
}
