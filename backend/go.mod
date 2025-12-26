module zero-system

go 1.23.0

require (
	github.com/awnumar/memguard v0.23.0
	golang.org/x/crypto v0.21.0
	golang.org/x/sys v0.18.0 // Force downgrade for Go 1.23
)
