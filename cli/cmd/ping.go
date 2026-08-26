package cmd

import (
	"fmt"

	"github.com/nexoral/axiodb-cli/internal/config"
	"github.com/spf13/cobra"
)

var pingCmd = &cobra.Command{
	Use:   "ping",
	Short: "Test connection to AxioDB server",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}

		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()

		if err := client.Ping(); err != nil {
			return fmt.Errorf("ping failed: %w", err)
		}

		fmt.Println("PONG")
		return nil
	},
}

func init() {
	rootCmd.AddCommand(pingCmd)
}
