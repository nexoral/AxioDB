package cmd

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/spf13/cobra"
)

var forceDestroy bool

var destroyCmd = &cobra.Command{
	Use:     "destroy",
	Aliases: []string{"distory", "uninstall"},
	Short:   "Self-remove and uninstall the AxioDB CLI binary",
	Long:    "Self-remove and uninstall the AxioDB CLI executable binary from the system.",
	RunE: func(cmd *cobra.Command, args []string) error {
		force, _ := cmd.Flags().GetBool("yes")
		if !force {
			force, _ = cmd.Flags().GetBool("force")
		}

		execPath, err := os.Executable()
		if err != nil {
			return fmt.Errorf("failed to locate executable binary: %w", err)
		}

		if resolved, err := filepath.EvalSymlinks(execPath); err == nil {
			execPath = resolved
		}

		if !force {
			fmt.Printf("Are you sure you want to uninstall AxioDB CLI from %s? [y/N]: ", execPath)
			reader := bufio.NewReader(os.Stdin)
			input, err := reader.ReadString('\n')
			if err != nil && input == "" {
				return fmt.Errorf("failed to read confirmation: %w", err)
			}
			input = strings.TrimSpace(strings.ToLower(input))
			if input != "y" && input != "yes" {
				fmt.Println("Uninstallation canceled.")
				return nil
			}
		}

		if runtime.GOOS == "windows" {
			cleanupCmd := exec.Command("cmd.exe", "/C", fmt.Sprintf("timeout /t 1 /nobreak >nul & del /f /q %q", execPath))
			if err := cleanupCmd.Start(); err != nil {
				return fmt.Errorf("failed to schedule binary deletion on Windows: %w", err)
			}
			fmt.Printf("✦ AxioDB CLI successfully uninstalled from %s\n", execPath)
			return nil
		}

		if err := os.Remove(execPath); err != nil {
			if os.IsPermission(err) {
				return fmt.Errorf("permission denied removing %s. Please run with sudo: sudo axiodb destroy", execPath)
			}
			return fmt.Errorf("failed to remove binary (%s): %w", execPath, err)
		}

		fmt.Printf("✦ AxioDB CLI successfully uninstalled from %s\n", execPath)
		return nil
	},
}

func init() {
	destroyCmd.Flags().BoolVarP(&forceDestroy, "yes", "y", false, "Skip confirmation prompt")
	destroyCmd.Flags().BoolP("force", "f", false, "Skip confirmation prompt")
	rootCmd.AddCommand(destroyCmd)
}
