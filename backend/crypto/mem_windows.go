//go:build windows

package crypto

import (
	"fmt"
	"syscall"
	"unsafe"
)

var (
	kernel32          = syscall.NewLazyDLL("kernel32.dll")
	procVirtualLock   = kernel32.NewProc("VirtualLock")
	procVirtualUnlock = kernel32.NewProc("VirtualUnlock")
)

// MemLock pins the byte slice to physical memory, preventing it from being swapped to disk.
// This relies on Windows VirtualLock.
func MemLock(data []byte) error {
	if len(data) == 0 {
		return nil
	}
	// Pointer to first byte
	ptr := unsafe.Pointer(&data[0])
	size := uintptr(len(data))

	ret, _, err := procVirtualLock.Call(uintptr(ptr), size)
	if ret == 0 {
		return fmt.Errorf("VirtualLock failed: %v", err)
	}
	return nil
}

// MemUnlock unpins the memory.
func MemUnlock(data []byte) error {
	if len(data) == 0 {
		return nil
	}
	ptr := unsafe.Pointer(&data[0])
	size := uintptr(len(data))

	ret, _, err := procVirtualUnlock.Call(uintptr(ptr), size)
	if ret == 0 {
		return fmt.Errorf("VirtualUnlock failed: %v", err)
	}
	// Optional: Zeroize after unlock is usually good practice,
	// but we handle Zeroize separately in defer.
	return nil
}
