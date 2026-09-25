package serve

import "testing"

func TestParseMode(t *testing.T) {
	tests := []struct {
		name       string
		want       ModeConfig
		authNotice bool
	}{
		{name: "http", want: ModeConfig{Mode: ModeHTTP, HTTP: true}},
		{name: "tcp", want: ModeConfig{Mode: ModeTCP, TCP: true}},
		{name: "tcp-auth", want: ModeConfig{Mode: ModeTCPAuth, TCP: true, TCPAuth: true}, authNotice: true},
		{name: "full", want: ModeConfig{Mode: ModeFull, HTTP: true, TCP: true, TCPAuth: true}},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got, err := ParseMode(test.name)
			if err != nil {
				t.Fatalf("ParseMode() error = %v", err)
			}
			if got != test.want {
				t.Fatalf("ParseMode() = %+v, want %+v", got, test.want)
			}
			if got.RequiresTCPAuthWarning() != test.authNotice {
				t.Fatalf("RequiresTCPAuthWarning() = %v, want %v", got.RequiresTCPAuthWarning(), test.authNotice)
			}
		})
	}
}

func TestParseModeRejectsUnknownMode(t *testing.T) {
	if _, err := ParseMode("gui"); err == nil {
		t.Fatal("ParseMode() unexpectedly accepted gui mode")
	}
}
