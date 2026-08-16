package config

import (
	"os"
)

type Config struct {
	APIBaseURL               string `yaml:"api_base_url" json:"api_base_url"`
	StateDir                 string `yaml:"state_dir" json:"state_dir"`
	HeartbeatIntervalSeconds int    `yaml:"heartbeat_interval_seconds" json:"heartbeat_interval_seconds"`
	EnrollmentToken          string `yaml:"enrollment_token,omitempty" json:"enrollment_token,omitempty"`
}

func DefaultConfig() *Config {
	return &Config{
		APIBaseURL:               getEnv("INFRAOPS_API_URL", "https://infraopsai.awecloudsolution.com/api"),
		StateDir:                 getEnv("INFRAOPS_STATE_DIR", "/var/lib/infraops-agent"),
		HeartbeatIntervalSeconds: 30,
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
