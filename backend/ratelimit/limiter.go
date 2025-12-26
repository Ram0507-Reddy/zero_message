package ratelimit

import (
	"net/http"
	"strings"
	"sync"
	"time"
)

// Client holds the state for a single IP
type Client struct {
	tokens     float64
	lastRefill time.Time
}

// Limiter controls the rate of requests
type Limiter struct {
	mu          sync.Mutex
	clients     map[string]*Client
	rate        float64 // Tokens per second
	burst       float64 // Maximum bucket size
	cleanupTick time.Duration
}

// NewLimiter creates a new rate limiter.
// rate = requests per second (e.g., 0.5 for 1 request every 2 seconds)
// burst = max burst (e.g., 5)
func NewLimiter(rate float64, burst float64) *Limiter {
	l := &Limiter{
		clients:     make(map[string]*Client),
		rate:        rate,
		burst:       burst,
		cleanupTick: 5 * time.Minute, // Clean up stale IPs every 5 mins
	}
	go l.cleanupLoop()
	return l
}

func (l *Limiter) Allow(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	client, exists := l.clients[ip]
	now := time.Now()

	if !exists {
		client = &Client{
			tokens:     l.burst,
			lastRefill: now,
		}
		l.clients[ip] = client
	}

	// Calculate refill
	elapsed := now.Sub(client.lastRefill).Seconds()
	tokensToAdd := elapsed * l.rate
	client.tokens += tokensToAdd
	if client.tokens > l.burst {
		client.tokens = l.burst
	}
	client.lastRefill = now

	// Consume
	if client.tokens >= 1.0 {
		client.tokens -= 1.0
		return true
	}

	return false
}

// cleanupLoop removes old entries to prevent memory leaks from casual scanning
func (l *Limiter) cleanupLoop() {
	ticker := time.NewTicker(l.cleanupTick)
	for range ticker.C {
		l.mu.Lock()
		now := time.Now()
		for ip, client := range l.clients {
			// If not seen for 10 mins, remove
			if now.Sub(client.lastRefill) > 10*time.Minute {
				delete(l.clients, ip)
			}
		}
		l.mu.Unlock()
	}
}

// Middleware wraps an http.HandlerFunc with rate limiting
func (l *Limiter) Middleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract IP (Naive implementation, use X-Forwarded-For if behind proxy)
		ip := r.RemoteAddr
		// Strip port if present
		if idx := strings.LastIndex(ip, ":"); idx != -1 {
			ip = ip[:idx]
		}

		// X-Forwarded-For support for when deployed behind Caddy/Nginx
		if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
			ip = fwd
		}

		if !l.Allow(ip) {
			http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
			return
		}

		next(w, r)
	}
}
