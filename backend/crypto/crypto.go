package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"io"

	"github.com/awnumar/memguard"
	"golang.org/x/crypto/hkdf"
)

// InitSecureMemory must be called on startup
func InitSecureMemory() {
	memguard.CatchInterrupt()
	// memguard.Purge() // implicitly called on exit
}

// DeriveKey generates a 32-byte key in a Secure Enclave (LockedBuffer).
func DeriveKey(masterSecret, context string) (*memguard.LockedBuffer, error) {
	hash := sha256.New
	// HKDF-Extract & Expand into a standard buffer first
	// Note: masterSecret is a string (Go string), hard to protect.
	// Ideally we'd accept LockedBuffer as input, but for this step we focus on the output Key.
	hkdf := hkdf.New(hash, []byte(masterSecret), nil, []byte(context))

	// Generate directly into a memguard buffer?
	// memguard doesn't accept io.Reader easily without intermediate.
	// We'll read to temp, then move to Guard.

	rawKey := make([]byte, 32)
	if _, err := io.ReadFull(hkdf, rawKey); err != nil {
		Zeroize(rawKey) // Wipe temp
		return nil, err
	}

	// Move to Secure Memory
	key := memguard.NewBufferFromBytes(rawKey)
	Zeroize(rawKey) // Wipe temp immediately

	return key, nil
}

func EncryptAESGCM(plaintext []byte, key []byte) ([]byte, []byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, nil, err
	}

	nonce := make([]byte, 12)
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, nil, err
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, nil, err
	}

	ciphertext := aesgcm.Seal(nil, nonce, plaintext, nil)
	return ciphertext, nonce, nil
}

func DecryptAESGCM(ciphertext, key, nonce []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	plaintext, err := aesgcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}

	return plaintext, nil
}

// Zeroize overwrites the byte slice with zeros to prevent memory dumps from recovering keys.
// This is best-effort in Go due to GC, but significantly reduces the window of compromise.
func Zeroize(data []byte) {
	for i := range data {
		data[i] = 0
	}
}
