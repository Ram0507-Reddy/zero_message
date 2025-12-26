package auth

import "crypto/subtle"

// ValidateSenderToken checks if the TX token is authorized to send.
// In MVP: Checks length > 2 and prefix "TX-".
func ValidateSenderToken(tx string) bool {
	if len(tx) < 3 {
		return false
	}
	// Constant-Time check for "TX-"
	// We convert strings to byte slices for subtle comparison
	expected := []byte("TX-")
	actual := []byte(tx[0:3])
	if subtle.ConstantTimeCompare(actual, expected) != 1 {
		return false
	}
	return true
}

// ValidateReceiverToken checks if the RX token is a valid slot format.
// In MVP: Checks length > 2 and prefix "RX-".
func ValidateReceiverToken(rx string) bool {
	if len(rx) < 3 {
		return false
	}
	// Constant-Time check for "RX-"
	expected := []byte("RX-")
	actual := []byte(rx[0:3])
	if subtle.ConstantTimeCompare(actual, expected) != 1 {
		return false
	}
	return true
}
