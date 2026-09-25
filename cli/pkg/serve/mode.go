package serve

import "fmt"

const (
	HTTPPort = 27018
	TCPPort  = 27019
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
		return ModeConfig{Mode: ModeFull, HTTP: true, TCP: true, TCPAuth: true}, nil
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

func (c ModeConfig) RequiresTCPAuthWarning() bool {
	return c.TCP && c.TCPAuth && !c.HTTP
}
