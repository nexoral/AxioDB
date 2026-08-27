package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/nexoral/axiodb-cli/internal/config"
	"github.com/spf13/cobra"
)

var importCmd = &cobra.Command{
	Use:   "import <file>",
	Short: "Import a database from a .tar.gz file via HTTP",
	Long:  "Import an AxioDB database from a .tar.gz archive. Uses the HTTP API (port 27018), not TCP.",
	Args:  cobra.ExactArgs(1),
	ValidArgsFunction: func(cmd *cobra.Command, args []string, toComplete string) ([]string, cobra.ShellCompDirective) {
		dir := "."
		prefix := toComplete

		if idx := strings.LastIndex(toComplete, "/"); idx >= 0 {
			dir = toComplete[:idx+1]
			prefix = toComplete[idx+1:]
		}

		entries, err := os.ReadDir(dir)
		if err != nil {
			return nil, cobra.ShellCompDirectiveDefault
		}

		var completions []string
		for _, entry := range entries {
			if entry.IsDir() {
				continue
			}
			name := entry.Name()
			if strings.HasPrefix(name, prefix) && strings.HasSuffix(name, ".tar.gz") {
				completions = append(completions, filepath.Join(dir, name))
			}
		}
		return completions, cobra.ShellCompDirectiveNoFileComp
	},
	RunE: func(cmd *cobra.Command, args []string) error {
		filePath := args[0]
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}

		if cfg.Username == "" || cfg.Password == "" {
			return fmt.Errorf("username and password required for HTTP auth (-u, -p)")
		}

		info, err := os.Stat(filePath)
		if err != nil {
			return fmt.Errorf("file not found: %s", filePath)
		}
		if info.IsDir() {
			return fmt.Errorf("not a file: %s", filePath)
		}

		client := cfg.NewHTTPClient()

		fmt.Fprintf(os.Stderr, "Logging in to %s:%d...\n", cfg.HTTPHost, cfg.HTTPPort)
		if err := client.Login(cfg.Username, cfg.Password); err != nil {
			return err
		}
		defer client.Logout()

		fmt.Fprintf(os.Stderr, "Importing %s...\n", filepath.Base(filePath))
		dbName, err := client.Import(filePath)
		if err != nil {
			return err
		}

		fmt.Fprintf(os.Stderr, "Imported database: %s\n", dbName)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(importCmd)
}
