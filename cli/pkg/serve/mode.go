package serve

import "fmt"

const (
	HTTPPort = 27018
	TCPPort  = 27019
)

// Seeded admin credentials, mirroring source/config/Keys/Permissions.ts.
const (
	DefaultAdminUsername = "admin"
	DefaultAdminPassword = "admin"
)

type Mode string

const (
	ModeHTTP    Mode = "http"
	ModeTCP     Mode = "tcp"
	ModeTCPAuth Mode = "tcp-auth"
	ModeFull    Mode = "full"
)

type ModeConfig struct {
	Mode    Mode
	GUI     bool
	HTTP    bool
	TCP     bool
	TCPAuth bool
}

func ParseMode(value string) (ModeConfig, error) {
	switch Mode(value) {
	case ModeHTTP:
		return ModeConfig{Mode: ModeHTTP, HTTP: true}, nil
	case ModeTCP:
		return ModeConfig{Mode: ModeTCP, TCP: true}, nil
	case ModeTCPAuth:
		return ModeConfig{Mode: ModeTCPAuth, TCP: true, TCPAuth: true}, nil
	case ModeFull:
		return ModeConfig{Mode: ModeFull, GUI: true, HTTP: true, TCP: true, TCPAuth: true}, nil
	default:
		return ModeConfig{}, fmt.Errorf("unknown serve mode %q (expected http, tcp, tcp-auth, or full)", value)
	}
}

func (c ModeConfig) HasHTTP() bool {
	return c.HTTP
}

func (c ModeConfig) HasTCP() bool {
	return c.TCP
}

// UsesTCPAuth reports whether the mode requires TCP authentication.
func (c ModeConfig) UsesTCPAuth() bool {
	return c.TCP && c.TCPAuth
}

// SeesAuth reports whether the mode creates the shared admin account, which is
// the only case where seeding a custom admin password has any effect.
func (c ModeConfig) SeesAuth() bool {
	return c.HTTP || c.UsesTCPAuth()
}

// NeedsPassword reports whether the mode authenticates TCP without a control
// server to rotate the seeded password through, leaving the password mandatory.
func (c ModeConfig) NeedsPassword() bool {
	return c.UsesTCPAuth() && !c.HTTP
}
