package actions

import (
	"fmt"
	"sync"
)

type ActionRegistry struct {
	mu      sync.RWMutex
	actions map[string]Action
}

var globalRegistry = &ActionRegistry{
	actions: make(map[string]Action),
}

func RegisterAction(act Action) {
	globalRegistry.mu.Lock()
	defer globalRegistry.mu.Unlock()

	id := fmt.Sprintf("%s:%s", act.Key(), act.Version())
	globalRegistry.actions[id] = act
}

func GetAction(key, version string) (Action, error) {
	globalRegistry.mu.RLock()
	defer globalRegistry.mu.RUnlock()

	id := fmt.Sprintf("%s:%s", key, version)
	act, exists := globalRegistry.actions[id]
	if !exists {
		return nil, fmt.Errorf("action '%s' not registered on this agent. Arbitrary command execution is strictly forbidden", id)
	}
	return act, nil
}
