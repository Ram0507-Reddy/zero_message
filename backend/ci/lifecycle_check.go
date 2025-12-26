//go:build ignore

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"time"
)

const BIN_PATH = "./zero-backend.exe"
const API_URL = "http://localhost:8080/api"

func main() {
	fmt.Println("🔹 TEST: Lifecycle (Restart Wipe)")

	// 1. Build
	fmt.Println("  Building...")
	build := exec.Command("go", "build", "-o", "zero-backend.exe", ".")
	if err := build.Run(); err != nil {
		panic(err)
	}

	// 2. Start Server A
	fmt.Println("  Starting Server (Instance 1)...")
	cmd1 := exec.Command(BIN_PATH)
	if err := cmd1.Start(); err != nil {
		panic(err)
	}
	time.Sleep(2 * time.Second)

	// 3. Send Secret
	fmt.Println("  Sending Secret...")
	rx := "PERSIST-TEST-" + fmt.Sprint(time.Now().UnixNano())
	sendBody, _ := json.Marshal(map[string]string{
		"txToken": "TX-Valid", "rxToken": rx, "realityA": "ShouldVanish", "realityB": "ShouldVanish",
	})
	http.Post(API_URL+"/send", "application/json", bytes.NewBuffer(sendBody))

	// 4. Kill Server A
	fmt.Println("  Killing Server...")
	if err := cmd1.Process.Kill(); err != nil {
		fmt.Println("Failed to kill:", err)
	}
	cmd1.Wait()
	time.Sleep(1 * time.Second)

	// 5. Start Server B
	fmt.Println("  Starting Server (Instance 2)...")
	cmd2 := exec.Command(BIN_PATH)
	if err := cmd2.Start(); err != nil {
		panic(err)
	}
	defer cmd2.Process.Kill() // Cleanup
	time.Sleep(2 * time.Second)

	// 6. Read Secret (Should be Gone)
	fmt.Println("  Reading Secret...")
	readBody, _ := json.Marshal(map[string]string{"rxToken": rx})
	resp, err := http.Post(API_URL+"/read", "application/json", bytes.NewBuffer(readBody))

	if err != nil {
		fmt.Println("  ❌ Connection Failed:", err)
		os.Exit(1)
	}

	// Check if we get "No note available" (Generic)
	// Note: With Traffic Masking, it returns 200 OK + "No note available" content.
	// If it PERSISTED, it would return "ShouldVanish".

	// We need to decode content to be sure.
	// But simplistic check: Size or substring.
	// Since "ShouldVanish" is what we wrote.
	// We can just check response body?
	// Let's decode properly.
	var resMap map[string]string
	json.NewDecoder(resp.Body).Decode(&resMap)

	content := resMap["content"]
	if content == "ShouldVanish" {
		fmt.Println("  ❌ FAIL: Secret Persisted after restart!")
		os.Exit(1)
	} else {
		fmt.Println("  ✅ PASS: Secret vanished (RAM Memory Only)")
		os.Exit(0)
	}
}
