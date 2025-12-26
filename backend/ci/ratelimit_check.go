//go:build ignore

package main

import (
	"fmt"
	"net/http"
	"os"
	"sync"
)

func main() {
	fmt.Println("🔹 TEST: Rate Limiting (DDoS Protection)")

	url := "http://localhost:8080/api/send"
	// Send endpoint has Burst 2.

	var wg sync.WaitGroup
	results := make(chan int, 10)

	// Fire 6 requests concurrently.
	// Should allow ~2-3, block the rest.
	for i := 0; i < 6; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			resp, err := http.Post(url, "application/json", nil)
			if err != nil {
				results <- 0
				return
			}
			results <- resp.StatusCode
		}(i)
	}
	wg.Wait()
	close(results)

	allowed := 0
	blocked := 0

	for code := range results {
		if code == 200 {
			allowed++
		} else if code == 429 {
			blocked++
		} else {
			fmt.Printf("  Got unexpected code: %d\n", code)
		}
	}

	fmt.Printf("  Allowed: %d | Blocked: %d\n", allowed, blocked)

	if blocked > 0 {
		fmt.Println("  ✅ Rate Limiting Active (429 Responses received)")
		os.Exit(0)
	} else {
		fmt.Println("  ❌ Rate Limiting FAILED (No blocks)")
		os.Exit(1)
	}
}
