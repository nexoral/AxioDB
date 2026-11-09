package cmd

import (
	"github.com/nexoral/axiodb-cli/internal/config"
	"github.com/nexoral/axiodb-cli/pkg/commands"
	"github.com/spf13/cobra"
)

var infoCmd = &cobra.Command{
	Use:   "info",
	Short: "Get system runtime diagnostics and host information",
	RunE: func(cmd *cobra.Command, _ []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()
		response, err := commands.GetSystemInfo(client)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, response.Data)
	},
}

var statsCmd = &cobra.Command{
	Use:   "stats",
	Short: "Get database, collection, and document dashboard statistics",
	RunE: func(cmd *cobra.Command, _ []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()
		response, err := commands.GetDashboardStats(client)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, response.Data)
	},
}

func init() {
	rootCmd.AddCommand(infoCmd, statsCmd)
}
