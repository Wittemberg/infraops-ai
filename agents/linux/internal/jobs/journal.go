package jobs

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type JournalEntry struct {
	JobID          string    `json:"job_id"`
	IdempotencyKey string    `json:"idempotency_key"`
	Action         string    `json:"action"`
	Status         string    `json:"status"`
	StartedAt      time.Time `json:"started_at"`
	FinishedAt     time.Time `json:"finished_at,omitempty"`
	ResultDigest   string    `json:"result_digest,omitempty"`
}

type JobJournal struct {
	mu       sync.RWMutex
	filePath string
	Entries  map[string]JournalEntry `json:"entries"`
}

func NewJobJournal(stateDir string) (*JobJournal, error) {
	if err := os.MkdirAll(stateDir, 0700); err != nil {
		return nil, fmt.Errorf("failed to create state dir: %w", err)
	}

	path := filepath.Join(stateDir, "jobs_journal.json")
	j := &JobJournal{
		filePath: path,
		Entries:  make(map[string]JournalEntry),
	}

	_ = j.load()
	return j, nil
}

func (j *JobJournal) load() error {
	j.mu.Lock()
	defer j.mu.Unlock()

	data, err := os.ReadFile(j.filePath)
	if err != nil {
		return err
	}

	var loaded map[string]JournalEntry
	if err := json.Unmarshal(data, &loaded); err != nil {
		return err
	}

	if loaded != nil {
		j.Entries = loaded
	}
	return nil
}

func (j *JobJournal) saveLocked() error {
	data, err := json.MarshalIndent(j.Entries, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(j.filePath, data, 0600)
}

func (j *JobJournal) IsJobCompleted(jobID string) bool {
	j.mu.RLock()
	defer j.mu.RUnlock()

	entry, exists := j.Entries[jobID]
	return exists && (entry.Status == "succeeded" || entry.Status == "failed" || entry.Status == "cancelled")
}

func (j *JobJournal) RecordStart(jobID, idempotencyKey, action string) error {
	j.mu.Lock()
	defer j.mu.Unlock()

	j.Entries[jobID] = JournalEntry{
		JobID:          jobID,
		IdempotencyKey: idempotencyKey,
		Action:         action,
		Status:         "running",
		StartedAt:      time.Now().UTC(),
	}

	return j.saveLocked()
}

func (j *JobJournal) RecordFinish(jobID, status, digest string) error {
	j.mu.Lock()
	defer j.mu.Unlock()

	entry, exists := j.Entries[jobID]
	if !exists {
		entry = JournalEntry{
			JobID: jobID,
			StartedAt: time.Now().UTC(),
		}
	}

	entry.Status = status
	entry.FinishedAt = time.Now().UTC()
	entry.ResultDigest = digest
	j.Entries[jobID] = entry

	return j.saveLocked()
}
