package cmd

import (
	"fmt"

	"github.com/nexoral/axiodb-cli/internal/config"
	"github.com/nexoral/axiodb-cli/pkg/commands"
	"github.com/spf13/cobra"
)

var indexCmd = &cobra.Command{
	Use:   "index",
	Short: "Index operations",
}

var indexCreateCmd = &cobra.Command{
	Use:   "create <field1> [field2...]",
	Short: "Create an index on fields",
	Args:  cobra.MinimumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		if cfg.DB == "" || cfg.Collection == "" {
			return fmt.Errorf("--db and --collection flags are required")
		}

		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()

		resp, err := commands.CreateIndex(client, cfg.DB, cfg.Collection, args)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var indexDropCmd = &cobra.Command{
	Use:   "drop <name>",
	Short: "Drop an index by name",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		if cfg.DB == "" || cfg.Collection == "" {
			return fmt.Errorf("--db and --collection flags are required")
		}

		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()

		resp, err := commands.DropIndex(client, cfg.DB, cfg.Collection, args[0])
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var indexListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all indexes on a collection",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		if cfg.DB == "" || cfg.Collection == "" {
			return fmt.Errorf("--db and --collection flags are required")
		}

		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()

		resp, err := commands.ListIndexes(client, cfg.DB, cfg.Collection)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

func init() {
	indexCmd.AddCommand(indexCreateCmd)
	indexCmd.AddCommand(indexDropCmd)
	indexCmd.AddCommand(indexListCmd)
	rootCmd.AddCommand(indexCmd)
}
