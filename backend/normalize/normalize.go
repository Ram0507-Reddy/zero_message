package normalize

import "strings"

// Normalize ensures both strings are equal length by padding the shorter one.
// Returns the two normalized strings.
func Normalize(a, b string) (string, string) {
	if len(a) == len(b) {
		return a, b
	}

	targetLen := 0
	if len(a) > len(b) {
		targetLen = len(a)
	} else {
		targetLen = len(b)
	}

	// Simple padding with spaces for MVP.
	// In production, this would use standard padding schemes (PKCS#7) or random noise.
	// But since this is application layer text, spaces are safe enough to hide length.
	padA := targetLen - len(a)
	padB := targetLen - len(b)

	if padA > 0 {
		a += strings.Repeat(" ", padA)
	}
	if padB > 0 {
		b += strings.Repeat(" ", padB)
	}

	return a, b
}
