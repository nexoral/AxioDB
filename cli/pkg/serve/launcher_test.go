package serve

import (
	"strings"
	"testing"
)

func TestServerScriptUsesSupportedAxioDBOptions(t *testing.T) {
	config, err := ParseMode("full")
	if err != nil {
		t.Fatalf("ParseMode(full) error = %v", err)
	}
	script := ServerScript(config)

	for _, expected := range []string{
		`GUI: true`,
		`HTTP: true`,
		`TCP: true`,
		`TCPAuth: true`,
		`AdminPassword: process.env.AXIODB_ADMIN_PASSWORD || undefined`,
		`RootName: "AxioDB"`,
		`CustomPath: __dirname`,
	} {
		if !strings.Contains(script, expected) {
			t.Errorf("generated server.js does not contain %q:\n%s", expected, script)
		}
	}

	for _, unsupported := range []string{"Port:", "AdminUser:", ".init("} {
		if strings.Contains(script, unsupported) {
			t.Errorf("generated server.js contains unsupported option or method %q:\n%s", unsupported, script)
		}
	}
}
