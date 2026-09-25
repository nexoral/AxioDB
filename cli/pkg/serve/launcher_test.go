package serve

import (
	"strings"
	"testing"
)

func TestServerScriptUsesSupportedAxioDBOptions(t *testing.T) {
	script := ServerScript(ModeConfig{
		Mode:    ModeFull,
		HTTP:    true,
		TCP:     true,
		TCPAuth: true,
	})

	for _, expected := range []string{
		`GUI: false`,
		`HTTP: true`,
		`TCP: true`,
		`TCPAuth: true`,
		`RootName: "AxioDB"`,
		`CustomPath: __dirname`,
	} {
		if !strings.Contains(script, expected) {
			t.Errorf("generated server.js does not contain %q:\n%s", expected, script)
		}
	}

	for _, unsupported := range []string{"Port:", "AdminUser:", "AdminPassword:", ".init("} {
		if strings.Contains(script, unsupported) {
			t.Errorf("generated server.js contains unsupported option or method %q:\n%s", unsupported, script)
		}
	}
}
