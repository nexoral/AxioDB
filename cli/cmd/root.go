package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "axiodb",
	Short: "AxioDB CLI - Connect to AxioDB via TCP protocol",
	Long:  `AxioDB CLI provides a command-line interface to interact with AxioDB database servers using the TCP protocol.`,
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func init() {
	rootCmd.PersistentFlags().StringP("connection-string", "c", "", "Connection string (axiodb://host:port)")
	rootCmd.PersistentFlags().String("host", "localhost", "Server host")
	rootCmd.PersistentFlags().Int("port", 27019, "Server port")
	rootCmd.PersistentFlags().StringP("username", "u", "", "Username for authentication")
	rootCmd.PersistentFlags().StringP("password", "p", "", "Password for authentication")
	rootCmd.PersistentFlags().Bool("tls", false, "Enable TLS")
	rootCmd.PersistentFlags().String("tls-cert", "", "Path to CA certificate")
	rootCmd.PersistentFlags().Bool("tls-skip-verify", false, "Skip TLS certificate verification")
	rootCmd.PersistentFlags().StringP("output", "o", "table", "Output format: json|table")
	rootCmd.PersistentFlags().Int("timeout", 30, "Request timeout in seconds")
	rootCmd.PersistentFlags().String("db", "", "Database name")
	rootCmd.PersistentFlags().String("collection", "", "Collection name")
}
