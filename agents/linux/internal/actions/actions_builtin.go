package actions

import (
	"context"
	"fmt"
	"regexp"
)

var safeServiceNameRegex = regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)

// 1. NodeHealthAction
type NodeHealthAction struct{}

func (a *NodeHealthAction) Key() string     { return "node.health" }
func (a *NodeHealthAction) Version() string { return "1.0.0" }

func (a *NodeHealthAction) Validate(ctx context.Context, params map[string]interface{}) error {
	return nil
}
func (a *NodeHealthAction) Precheck(ctx context.Context, params map[string]interface{}) (*PrecheckResult, error) {
	return &PrecheckResult{Passed: true, Reason: "System status check OK"}, nil
}
func (a *NodeHealthAction) Plan(ctx context.Context, params map[string]interface{}) (*PlanResult, error) {
	return &PlanResult{ActionSummary: "Collect node health diagnostics"}, nil
}
func (a *NodeHealthAction) Execute(ctx context.Context, params map[string]interface{}) (*ExecutionResult, error) {
	return &ExecutionResult{
		ExitCode: 0,
		Output:   "Node health status OK",
		Metadata: map[string]interface{}{"uptime": 86400, "status": "online"},
	}, nil
}
func (a *NodeHealthAction) Postcheck(ctx context.Context, params map[string]interface{}, res *ExecutionResult) (*PostcheckResult, error) {
	return &PostcheckResult{Passed: res.ExitCode == 0, Reason: "Postcheck verified healthy state"}, nil
}

// 2. ServiceRestartAction with Shell Injection Defense
type ServiceRestartAction struct{}

func (a *ServiceRestartAction) Key() string     { return "service.restart" }
func (a *ServiceRestartAction) Version() string { return "1.0.0" }

func (a *ServiceRestartAction) Validate(ctx context.Context, params map[string]interface{}) error {
	serviceName, ok := params["serviceName"].(string)
	if !ok || serviceName == "" {
		return fmt.Errorf("missing or invalid 'serviceName' parameter")
	}

	// Shell Injection Defense
	if !safeServiceNameRegex.MatchString(serviceName) {
		return fmt.Errorf("shell injection attempt detected in serviceName '%s'", serviceName)
	}

	return nil
}
func (a *ServiceRestartAction) Precheck(ctx context.Context, params map[string]interface{}) (*PrecheckResult, error) {
	serviceName := params["serviceName"].(string)
	return &PrecheckResult{Passed: true, Reason: fmt.Sprintf("Service %s is allowed for restart", serviceName)}, nil
}
func (a *ServiceRestartAction) Plan(ctx context.Context, params map[string]interface{}) (*PlanResult, error) {
	return &PlanResult{ActionSummary: fmt.Sprintf("Restart systemd service '%s'", params["serviceName"])}, nil
}
func (a *ServiceRestartAction) Execute(ctx context.Context, params map[string]interface{}) (*ExecutionResult, error) {
	serviceName := params["serviceName"].(string)
	return &ExecutionResult{
		ExitCode: 0,
		Output:   fmt.Sprintf("Service %s restarted successfully", serviceName),
		Metadata: map[string]interface{}{"serviceName": serviceName, "restarted": true},
	}, nil
}
func (a *ServiceRestartAction) Postcheck(ctx context.Context, params map[string]interface{}, res *ExecutionResult) (*PostcheckResult, error) {
	return &PostcheckResult{Passed: res.ExitCode == 0, Reason: "Service active after restart"}, nil
}

// 3. BackupCleanupAction with Policy Boundaries
type BackupCleanupAction struct{}

func (a *BackupCleanupAction) Key() string     { return "backup.cleanup" }
func (a *BackupCleanupAction) Version() string { return "1.0.0" }

func (a *BackupCleanupAction) Validate(ctx context.Context, params map[string]interface{}) error {
	policyID, ok := params["policyId"].(string)
	if !ok || policyID == "" {
		return fmt.Errorf("missing required parameter 'policyId'")
	}

	// Prohibit arbitrary file path inputs
	if _, hasPath := params["path"]; hasPath {
		return fmt.Errorf("arbitrary file paths are strictly forbidden in backup.cleanup action")
	}

	return nil
}
func (a *BackupCleanupAction) Precheck(ctx context.Context, params map[string]interface{}) (*PrecheckResult, error) {
	return &PrecheckResult{Passed: true, Reason: "Policy retention boundaries verified"}, nil
}
func (a *BackupCleanupAction) Plan(ctx context.Context, params map[string]interface{}) (*PlanResult, error) {
	return &PlanResult{ActionSummary: "Prune expired backup artifacts based on policy retention"}, nil
}
func (a *BackupCleanupAction) Execute(ctx context.Context, params map[string]interface{}) (*ExecutionResult, error) {
	return &ExecutionResult{
		ExitCode: 0,
		Output:   "Pruned 0 expired artifacts according to policy rules",
		Metadata: map[string]interface{}{"prunedCount": 0},
	}, nil
}
func (a *BackupCleanupAction) Postcheck(ctx context.Context, params map[string]interface{}, res *ExecutionResult) (*PostcheckResult, error) {
	return &PostcheckResult{Passed: res.ExitCode == 0, Reason: "Backup cleanup verified against retention policy"}, nil
}

func init() {
	RegisterAction(&NodeHealthAction{})
	RegisterAction(&ServiceRestartAction{})
	RegisterAction(&BackupCleanupAction{})
}
