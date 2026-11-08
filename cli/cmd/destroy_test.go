package cmd

import (
	"testing"
)

func TestDestroyCommandRegistration(t *testing.T) {
	cmd, _, err := rootCmd.Find([]string{"destroy"})
	if err != nil || cmd == nil {
		t.Fatalf("expected 'destroy' command to be registered, got error: %v", err)
	}

	aliasCmd, _, err := rootCmd.Find([]string{"distory"})
	if err != nil || aliasCmd == nil || aliasCmd.Name() != "destroy" {
		t.Fatalf("expected 'distory' alias to resolve to 'destroy', got: %v", aliasCmd)
	}

	uninstallCmd, _, err := rootCmd.Find([]string{"uninstall"})
	if err != nil || uninstallCmd == nil || uninstallCmd.Name() != "destroy" {
		t.Fatalf("expected 'uninstall' alias to resolve to 'destroy', got: %v", uninstallCmd)
	}

	if cmd.Flags().Lookup("yes") == nil {
		t.Error("expected --yes flag on destroy command")
	}
	if cmd.Flags().Lookup("force") == nil {
		t.Error("expected --force flag on destroy command")
	}
}
