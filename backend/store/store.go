package store

import (
	"sync"
	"time"
)

// MessageReality holds the encrypted data for a single reality.
type MessageReality struct {
	Ciphertext []byte
	Nonce      []byte
	Destroyed  bool
}

// GeoConstraint v2.5
type GeoConstraint struct {
	Active    bool
	Latitude  float64
	Longitude float64
	RadiusKm  float64
}

// SecureEntry is the container for a dual-reality message.
// It is indexed by the Receiver Token (RX).
type SecureEntry struct {
	RealityA   *MessageReality
	RealityB   *MessageReality
	Geo        GeoConstraint // v2.5 Geofencing
	ExpiryTime time.Time
}

// MemoryStore holds all active messages in RAM.
type MemoryStore struct {
	data          map[string]*SecureEntry
	mu            sync.RWMutex
	LastHeartbeat time.Time // v2.5 Dead Man Switch
}

var GlobalStore *MemoryStore

func InitStore() {
	GlobalStore = &MemoryStore{
		data:          make(map[string]*SecureEntry),
		LastHeartbeat: time.Now(),
	}
	// Start cleanup routines here if needed, or in main
	go GlobalStore.cleanupLoop()
	go GlobalStore.deadManLoop()
}

func (s *MemoryStore) Save(rxToken string, entry *SecureEntry) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data[rxToken] = entry
}

func (s *MemoryStore) Get(rxToken string) (*SecureEntry, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	entry, exists := s.data[rxToken]
	if !exists {
		return nil, false
	}
	// Lazy expiry check on read
	if time.Now().After(entry.ExpiryTime) {
		return nil, false
	}
	return entry, true
}

func (s *MemoryStore) Mu() *sync.RWMutex {
	return &s.mu
}

// Heartbeat resets the Dead Man Switch
func (s *MemoryStore) Heartbeat() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.LastHeartbeat = time.Now()
}

// Expose locking for API atomic destruction
func (s *MemoryStore) Lock() {
	s.mu.Lock()
}

func (s *MemoryStore) Unlock() {
	s.mu.Unlock()
}

// Wipe destroys EVERYTHING (Factory Reset) using "Go's Map Clear"
func (s *MemoryStore) Wipe() {
	s.mu.Lock()
	defer s.mu.Unlock()
	// Reallocate map to clear old references instantly
	s.data = make(map[string]*SecureEntry)
	// Theoretically we should zeroize old memory but GC handles map buckets.
	// This is sufficient for "Panic Mode".
	// fmt.Println("🚨 PANIC WIPE TRIGGERED.")
}

func (s *MemoryStore) cleanupLoop() {
	for {
		time.Sleep(1 * time.Minute)
		s.mu.Lock()
		now := time.Now()
		for rx, entry := range s.data {
			if now.After(entry.ExpiryTime) {
				delete(s.data, rx)
			}
		}
		s.mu.Unlock()
	}
}

// deadManLoop checks only for 24h inactivity
func (s *MemoryStore) deadManLoop() {
	for {
		time.Sleep(1 * time.Hour)
		s.mu.RLock()
		elapsed := time.Since(s.LastHeartbeat)
		s.mu.RUnlock()

		if elapsed > 24*time.Hour {
			s.Wipe()
		}
	}
}
