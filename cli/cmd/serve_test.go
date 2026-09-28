package cmd

import (
	"strings"
	"testing"

	"github.com/nexoral/axiodb-cli/pkg/serve"
)

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		mode, password, wantErr string
	}{
		{mode: "tcp-auth", password: "s3cret"},
		{mode: "full"},
		{mode: "http"},
		{mode: "tcp"},
		{mode: "full", password: "s3cret"},
		{mode: "http", password: "s3cret"},
		{mode: "tcp-auth", wantErr: "requires a password"},
		{mode: "tcp", password: "s3cret", wantErr: "never creates"},
		{mode: "tcp-auth", password: serve.DefaultAdminPassword, wantErr: "must differ from the default"},
		{mode: "http", password: serve.DefaultAdminPassword, wantErr: "must differ from the default"},
	}

	for _, test := range tests {
		config, err := serve.ParseMode(test.mode)
		if err != nil {
			t.Fatalf("ParseMode(%q) error = %v", test.mode, err)
		}

		err = validatePassword(config, test.password)
		if test.wantErr == "" {
			if err != nil {
				t.Errorf("mode %q password %q: unexpected error = %v", test.mode, test.password, err)
			}
			continue
		}
		if err == nil || !strings.Contains(err.Error(), test.wantErr) {
			t.Errorf("mode %q password %q: error = %v, want it to contain %q", test.mode, test.password, err, test.wantErr)
		}
	}
}

func TestPrintReadyDoesNotEchoPassword(t *testing.T) {
	config, _ := serve.ParseMode("tcp-auth")

	var output strings.Builder
	printReady(&output, config, "s3cret")

	if strings.Contains(output.String(), "s3cret") {
		t.Errorf("printReady() leaked the password:\n%s", output.String())
	}
	if strings.Contains(output.String(), serve.DefaultAdminPassword) {
		t.Errorf("printReady() warned about the default admin despite a password being set:\n%s", output.String())
	}
}
