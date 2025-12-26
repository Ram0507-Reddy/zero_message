package main

import (
	"fmt"
	"net/http"
	"zero-system/api"
	"zero-system/crypto"
	"zero-system/ratelimit"
	"zero-system/store"
)

func main() {
	fmt.Println("🛡️ ZERO System Backend (Canonical Architecture v2.2 + MemGuard)")

	// 0. Initialize Secure Memory
	crypto.InitSecureMemory()

	// 1. Initialize Memory Store
	store.InitStore()
	fmt.Println("✓ Memory Store Initialized")

	// 2. Initialize Rate Limiters
	// Send: 5 per minute (Strict) -> 0.083 tokens/sec, Burst 2
	sendLimiter := ratelimit.NewLimiter(0.083, 2)

	// Read: 60 per minute (Normal + Noise) -> 1 token/sec, Burst 10
	readLimiter := ratelimit.NewLimiter(1.0, 10)

	fmt.Println("✓ Rate Limiting Active (DDoS Protection)")

	// 3. Register Routes with Middleware
	http.HandleFunc("/api/send", sendLimiter.Middleware(api.HandleSend))
	http.HandleFunc("/api/read", readLimiter.Middleware(api.HandleRead))
	http.HandleFunc("/api/panic", api.HandlePanic) // No rate limit? Or shared?
	http.HandleFunc("/api/heartbeat", api.HandleHeartbeat)

	// 4. Start Server
	fmt.Println("✓ Listening on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		panic(err)
	}
}
