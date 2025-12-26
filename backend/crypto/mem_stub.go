//go:build !windows

package crypto

func MemLock(data []byte) error {
	// Not implemented for this OS, silent no-op or log warning
	// For production, we'd implement mlock (Linux)
	return nil
}

func MemUnlock(data []byte) error {
	return nil
}
