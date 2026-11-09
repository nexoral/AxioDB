package config

import (
	"testing"
)

func TestParseConnectionString(t *testing.T) {
	tests := []struct {
		name         string
		connStr      string
		expectedHost string
		expectedPort int
		expectedUser string
		expectedPass string
		expectErr    bool
	}{
		{
			name:         "standard host:port",
			connStr:      "axiodb://127.0.0.1:27019",
			expectedHost: "127.0.0.1",
			expectedPort: 27019,
			expectedUser: "",
			expectedPass: "",
			expectErr:    false,
		},
		{
			name:         "user and password with host:port",
			connStr:      "axiodb://admin:secret123@localhost:27019",
			expectedHost: "localhost",
			expectedPort: 27019,
			expectedUser: "admin",
			expectedPass: "secret123",
			expectErr:    false,
		},
		{
			name:         "username only with host:port",
			connStr:      "axiodb://admin@127.0.0.1:27019",
			expectedHost: "127.0.0.1",
			expectedPort: 27019,
			expectedUser: "admin",
			expectedPass: "",
			expectErr:    false,
		},
		{
			name:      "missing prefix",
			connStr:   "127.0.0.1:27019",
			expectErr: true,
		},
		{
			name:      "invalid port",
			connStr:   "axiodb://127.0.0.1:99999",
			expectErr: true,
		},
		{
			name:      "empty host",
			connStr:   "axiodb://:27019",
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			host, port, user, pass, err := parseConnectionString(tt.connStr)
			if tt.expectErr {
				if err == nil {
					t.Fatalf("expected error for %q, got nil", tt.connStr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if host != tt.expectedHost {
				t.Errorf("host = %q, want %q", host, tt.expectedHost)
			}
			if port != tt.expectedPort {
				t.Errorf("port = %d, want %d", port, tt.expectedPort)
			}
			if user != tt.expectedUser {
				t.Errorf("user = %q, want %q", user, tt.expectedUser)
			}
			if pass != tt.expectedPass {
				t.Errorf("pass = %q, want %q", pass, tt.expectedPass)
			}
		})
	}
}
