package cmd

import (
	"github.com/nexoral/axiodb-cli/internal/config"
	"github.com/nexoral/axiodb-cli/pkg/commands"
	"github.com/spf13/cobra"
)

var healthCmd = &cobra.Command{
	Use: "health", Short: "Check AxioDB service health",
	RunE: func(cmd *cobra.Command, _ []string) error {
		cfg, err := config.FromFlags(cmd); if err != nil { return err }
		client, err := cfg.ConnectAndAuth(); if err != nil { return err }; defer client.Disconnect()
		response, err := commands.Health(client); if err != nil { return err }
		return printOutput(cfg.Output, response)
	},
}

func init() { rootCmd.AddCommand(healthCmd) }
