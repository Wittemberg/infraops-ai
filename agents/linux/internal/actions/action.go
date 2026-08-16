package actions

import (
	"context"
	"fmt"
)

type PrecheckResult struct {
	Passed bool   `json:"passed"`
	Reason string `json:"reason"`
}

type PlanResult struct {
	ActionSummary string   `json:"actionSummary"`
	AffectedItems []string `json:"affectedItems"`
}

type ExecutionResult struct {
	ExitCode int                    `json:"exitCode"`
	Output   string                 `json:"output"`
	Metadata map[string]interface{} `json:"metadata"`
}

type PostcheckResult struct {
	Passed bool   `json:"passed"`
	Reason string `json:"reason"`
}

type Action interface {
	Key() string
	Version() string
	Validate(ctx context.Context, params map[string]interface{}) error
	Precheck(ctx context.Context, params map[string]interface{}) (*PrecheckResult, error)
	Plan(ctx context.Context, params map[string]interface{}) (*PlanResult, error)
	Execute(ctx context.Context, params map[string]interface{}) (*ExecutionResult, error)
	Postcheck(ctx context.Context, params map[string]interface{}, execRes *ExecutionResult) (*PostcheckResult, error)
}

type ActionPipeline struct {
	action Action
}

func NewActionPipeline(act Action) *ActionPipeline {
	return &ActionPipeline{action: act}
}

func (p *ActionPipeline) Run(ctx context.Context, params map[string]interface{}) (*ExecutionResult, error) {
	// 1. Validate Parameters
	if err := p.action.Validate(ctx, params); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// 2. Precheck
	preRes, err := p.action.Precheck(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("precheck error: %w", err)
	}
	if !preRes.Passed {
		return nil, fmt.Errorf("precheck failed: %s", preRes.Reason)
	}

	// 3. Plan
	_, err = p.action.Plan(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("plan error: %w", err)
	}

	// 4. Execute
	execRes, err := p.action.Execute(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("execution error: %w", err)
	}

	// 5. Postcheck
	postRes, err := p.action.Postcheck(ctx, params, execRes)
	if err != nil {
		return nil, fmt.Errorf("postcheck error: %w", err)
	}
	if !postRes.Passed {
		return nil, fmt.Errorf("postcheck failed: %s", postRes.Reason)
	}

	return execRes, nil
}
