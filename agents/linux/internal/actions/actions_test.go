package actions

import (
	"context"
	"testing"
)

func TestServiceRestartAction_ShellInjectionDefense(t *testing.T) {
	act := &ServiceRestartAction{}
	ctx := context.Background()

	// Malicious payload attempting shell command injection
	maliciousParams := map[string]interface{}{
		"serviceName": "nginx; rm -rf /",
	}

	err := act.Validate(ctx, maliciousParams)
	if err == nil {
		t.Fatalf("Expected validation error for shell injection payload, got nil")
	}

	// Valid payload
	validParams := map[string]interface{}{
		"serviceName": "nginx",
	}

	err = act.Validate(ctx, validParams)
	if err != nil {
		t.Fatalf("Unexpected validation error for valid serviceName: %v", err)
	}
}

func TestBackupCleanupAction_ArbitraryPathRejection(t *testing.T) {
	act := &BackupCleanupAction{}
	ctx := context.Background()

	// Attempting to pass arbitrary file path
	arbitraryPathParams := map[string]interface{}{
		"policyId": "pol-123",
		"path":     "/var/log/*",
	}

	err := act.Validate(ctx, arbitraryPathParams)
	if err == nil {
		t.Fatalf("Expected error when arbitrary path is provided to backup.cleanup, got nil")
	}
}

func TestActionPipelineExecution(t *testing.T) {
	act := &NodeHealthAction{}
	pipeline := NewActionPipeline(act)
	ctx := context.Background()

	res, err := pipeline.Run(ctx, map[string]interface{}{})
	if err != nil {
		t.Fatalf("Pipeline execution failed: %v", err)
	}

	if res.ExitCode != 0 {
		t.Errorf("Expected exit code 0, got %d", res.ExitCode)
	}
}
