package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/nexoral/axiodb-cli/internal/config"
	"github.com/nexoral/axiodb-cli/pkg/commands"
	"github.com/spf13/cobra"
)

var importCmd = &cobra.Command{
	Use:   "import <file>",
	Short: "Import a database from a .tar.gz file",
	Long:  "Import an AxioDB database from a .tar.gz archive. Defaults to TCP (:27019), or HTTP (:27018) with --http.",
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

		info, err := os.Stat(filePath)
		if err != nil {
			return fmt.Errorf("file not found: %s", filePath)
		}
		if info.IsDir() {
			return fmt.Errorf("not a file: %s", filePath)
		}

		useHTTP, _ := cmd.Flags().GetBool("http")
		if useHTTP {
			if cfg.Username == "" || cfg.Password == "" {
				return fmt.Errorf("username and password required for HTTP auth (-u, -p)")
			}

			client := cfg.NewHTTPClient()
			fmt.Fprintf(os.Stderr, "Logging in to %s:%d (HTTP)...\n", cfg.HTTPHost, cfg.HTTPPort)
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
		}

		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()

		fmt.Fprintf(os.Stderr, "Importing %s via TCP (%s:%d)...\n", filepath.Base(filePath), cfg.Host, cfg.Port)
		dbName, err := commands.ImportDB(client, filePath)
		if err != nil {
			return err
		}

		fmt.Fprintf(os.Stderr, "Imported database: %s\n", dbName)
		return nil
	},
}

func init() {
	importCmd.Flags().Bool("http", false, "Use HTTP API instead of TCP")
	rootCmd.AddCommand(importCmd)
}
