package cmd

import (
	"fmt"
	"os"

	"github.com/nexoral/axiodb-cli/internal/config"
	"github.com/spf13/cobra"
)

var exportCmd = &cobra.Command{
	Use:   "export <dbname>",
	Short: "Export a database to a .tar.gz file via HTTP",
	Long:  "Export an AxioDB database to a .tar.gz archive. Uses the HTTP API (port 27018), not TCP.",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		dbName := args[0]
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}

		if cfg.Username == "" || cfg.Password == "" {
			return fmt.Errorf("username and password required for HTTP auth (-u, -p)")
		}

		client := cfg.NewHTTPClient()

		fmt.Fprintf(os.Stderr, "Logging in to %s:%d...\n", cfg.HTTPHost, cfg.HTTPPort)
		if err := client.Login(cfg.Username, cfg.Password); err != nil {
			return err
		}
		defer client.Logout()

		fmt.Fprintf(os.Stderr, "Exporting %s...\n", dbName)
		filename, size, err := client.Export(dbName)
		if err != nil {
			return err
		}

		fmt.Fprintf(os.Stderr, "Exported %s (%s)\n", filename, formatBytes(size))
		return nil
	},
}

func formatBytes(bytes int64) string {
	const (
		KB = 1024
		MB = 1024 * KB
		GB = 1024 * MB
	)
	switch {
	case bytes >= GB:
		return fmt.Sprintf("%.1f GB", float64(bytes)/float64(GB))
	case bytes >= MB:
		return fmt.Sprintf("%.1f MB", float64(bytes)/float64(MB))
	case bytes >= KB:
		return fmt.Sprintf("%.1f KB", float64(bytes)/float64(KB))
	default:
		return fmt.Sprintf("%d B", bytes)
	}
}

func init() {
	rootCmd.AddCommand(exportCmd)
}
