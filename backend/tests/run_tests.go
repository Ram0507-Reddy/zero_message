package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
)

const BASE_URL = "http://localhost:8080"

// --- Structs ---
type SendRequest struct {
	RealityA string `json:"realityA"`
	RealityB string `json:"realityB"`
	TxToken  string `json:"txToken"`
	RxToken  string `json:"rxToken"`
}

type ReadRequest struct {
	RxToken string `json:"rxToken"`
}

type ReadResponse struct {
	Content string `json:"content"`
}

// --- Helpers ---

func sendNote(tx, rx, a, b string) (*http.Response, error) {
	reqBody, _ := json.Marshal(SendRequest{
		RealityA: a,
		RealityB: b,
		TxToken:  tx,
		RxToken:  rx,
	})
	return http.Post(BASE_URL+"/api/send", "application/json", bytes.NewBuffer(reqBody))
}

func readNote(rx string) (string, int, error) {
	reqBody, _ := json.Marshal(ReadRequest{RxToken: rx})
	resp, err := http.Post(BASE_URL+"/api/read", "application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		return "", 0, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	// Try decode
	var rResp ReadResponse
	_ = json.Unmarshal(body, &rResp)

	// If json decode fails, use raw body (for error messages)
	content := rResp.Content
	if content == "" {
		content = string(body)
	}

	return content, resp.StatusCode, nil
}

func assert(condition bool, msg string) {
	if !condition {
		fmt.Printf("FAIL: %s\n", msg)
		panic("Test Failed")
	} else {
		// fmt.Printf("PASS: %s\n", msg)
	}
}

// --- Tests ---

func TestDualRealityAndLifecycle() {
	fmt.Println("\n[Category 4 & 6] Dual Reality & Lifecycle Tests")
	rxBase := "TEST-RX-" + fmt.Sprint(time.Now().UnixNano())

	// 1. Send Dual Message
	resp, err := sendNote("TX-server907", rxBase, "Secret A", "Secret B")
	if err != nil || resp.StatusCode != 200 {
		fmt.Printf("FAIL: Send note failed. %v\n", err)
		return
	}
	fmt.Println("  ✅ Send Success")

	// 2. Read Reality A (Default)
	contentA, codeA, _ := readNote(rxBase)
	if codeA != 200 || contentA != "Secret A" {
		fmt.Printf("  ❌ Reality A Read Failed. Got: '%s' (Code %d)\n", contentA, codeA)
	} else {
		fmt.Println("  ✅ Reality A Read Success")
	}

	// 3. Read Reality A AGAIN (Should be burnt)
	contentA2, codeA2, _ := readNote(rxBase)
	// Expecting failure. Traffic Masking = 200 OK with "No note available"
	if codeA2 != 200 || contentA2 != "No note available" {
		fmt.Printf("  ❌ Reality A NOT Burnt or Wrong Status. Got: '%s' (Code %d)\n", contentA2, codeA2)
	} else {
		fmt.Println("  ✅ Reality A Burn-on-Close Success")
	}

	// 4. Read Reality B (Hidden)
	contentB, codeB, _ := readNote(rxBase + "-B")
	if codeB != 200 || contentB != "Secret B" {
		fmt.Printf("  ❌ Reality B Read Failed. Got: '%s' (Code %d)\n", contentB, codeB)
	} else {
		fmt.Println("  ✅ Reality B Read Success (Independent from A) [Step 10]")
	}

	// 5. Read Reality B AGAIN (Should be burnt)
	contentB2, codeB2, _ := readNote(rxBase + "-B")
	if codeB2 == 200 && contentB2 == "No note available" {
		fmt.Println("  ✅ Reality B Burn-on-Close Success")
	} else {
		fmt.Printf("  ❌ Reality B NOT Burnt. Got: '%s' (Code %d)\n", contentB2, codeB2)
	}
}

func TestFailureNormalization() {
	fmt.Println("\n[Category 5] Failure Normalization Tests")

	// 1. Wrong RX
	start := time.Now()
	content1, code1, _ := readNote("WRONG-RX-TOKEN")
	duration1 := time.Since(start)

	// 2. Expired/Burnt RX
	// using a random one which effectively acts as non-existent/expired
	randomRx := "RANDOM-" + fmt.Sprint(time.Now().UnixNano())
	start = time.Now()
	content2, code2, _ := readNote(randomRx)
	duration2 := time.Since(start)

	// Verify Responses
	if content1 != content2 || code1 != code2 {
		fmt.Printf("  ❌ Responses differ! \n1: %s (%d)\n2: %s (%d)\n", content1, code1, content2, code2)
	} else {
		fmt.Println("  ✅ Failure Responses Identical Text & Status [Step 13]")
	}

	// Verify Timing
	diff := duration1 - duration2
	if diff < 0 {
		diff = -diff
	}
	fmt.Printf("  ℹ️  Timing Diff: %v [Step 14]\n", diff)
}

func TestAuthAndAbuse() {
	fmt.Println("\n[Category 3 & 7 & 9] Auth & Abuse Tests")

	// 1. Invalid TX Token
	resp, _ := sendNote("INVALID-TX", "RX-TEST", "A", "B")
	body, _ := io.ReadAll(resp.Body)
	// Expecting "Note saved" (silent failure)
	if string(body) == "Note saved" {
		fmt.Println("  ✅ Invalid TX handled silently [Step 7]")
	} else {
		fmt.Printf("  ❌ Invalid TX leaked error? Got: %s\n", string(body))
	}

	// 2. Flooding
	rxFlood := "FLOOD-RX-" + fmt.Sprint(time.Now().UnixNano())
	for i := 0; i < 5; i++ {
		sendNote("TX-server907", rxFlood, fmt.Sprintf("Msg %d", i), "B")
	}
	content, _, _ := readNote(rxFlood)
	if content == "Msg 4" {
		fmt.Println("  ✅ Flooding handled (Last-Write-Wins)")
	} else {
		fmt.Printf("  ℹ️  Flooding Result: '%s'\n", content)
	}
}

func TestConcurrency() {
	fmt.Println("\n[Category 7] Concurrency Tests")
	rxRace := "RACE-" + fmt.Sprint(time.Now().UnixNano())
	sendNote("TX-server907", rxRace, "RaceMsg", "RaceMsgHidden")

	var wg sync.WaitGroup
	successCount := 0
	var mu sync.Mutex

	// Launch 5 concurrent readers for Surface Reality
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, code, _ := readNote(rxRace)
			if code == 200 {
				mu.Lock()
				successCount++
				mu.Unlock()
			}
		}()
	}
	wg.Wait()

	if successCount == 1 {
		fmt.Println("  ✅ Race Condition Handled: Only 1 reader succeeded [Step 19]")
	} else {
		fmt.Printf("  ❌ Race Condition FAILED: %d readers succeeded (Should be 1)\n", successCount)
	}
}

func main() {
	TestDualRealityAndLifecycle()
	TestFailureNormalization()
	TestAuthAndAbuse()
	TestConcurrency()
	fmt.Println("\n✅ ALL TESTS COMPLETED")
}
