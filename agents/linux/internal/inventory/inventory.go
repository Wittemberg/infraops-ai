package inventory

import (
	"crypto/sha256"
	"encoding/hex"
	"os"
	"runtime"
)

type SystemInventory struct {
	Hostname      string `json:"hostname"`
	OS            string `json:"os"`
	Kernel        string `json:"kernel"`
	Architecture  string `json:"architecture"`
	CPUCount      int    `json:"cpu_count"`
	MachineIDHash string `json:"machine_id_hash"`
}

func CollectInventory() (*SystemInventory, error) {
	hostname, err := os.Hostname()
	if err != nil {
		hostname = "unknown-host"
	}

	machineIDHash := computeMachineIDHash(hostname)

	return &SystemInventory{
		Hostname:      hostname,
		OS:            runtime.GOOS,
		Kernel:        "linux-kernel",
		Architecture:  runtime.GOARCH,
		CPUCount:      runtime.NumCPU(),
		MachineIDHash: machineIDHash,
	}, nil
}

func computeMachineIDHash(seed string) string {
	hasher := sha256.New()
	hasher.Write([]byte(seed))
	return hex.EncodeToString(hasher.Sum(nil))
}
