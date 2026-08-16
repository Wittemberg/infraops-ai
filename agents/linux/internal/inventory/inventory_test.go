package inventory

import (
	"testing"
)

func TestCollectInventory(t *testing.T) {
	inv, err := CollectInventory()
	if err != nil {
		t.Fatalf("Unexpected error collecting inventory: %v", err)
	}

	if inv.Hostname == "" {
		t.Errorf("Expected non-empty hostname")
	}

	if inv.CPUCount <= 0 {
		t.Errorf("Expected CPU count > 0, got %d", inv.CPUCount)
	}

	if len(inv.MachineIDHash) != 64 {
		t.Errorf("Expected 64-char SHA256 hex string for MachineIDHash, got length %d", len(inv.MachineIDHash))
	}
}
